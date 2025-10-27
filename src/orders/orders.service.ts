import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutCartDto, PaymentMethod } from './dto/checkout-cart.dto';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
  ) {}

  async create(createDto: CreateOrderDto): Promise<Order> {
    // Calculate total amount
    const totalAmount = createDto.orderItems.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    );

    // Create transaction
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: TransactionStatus.PENDING,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Create order
    const order = this.orderRepository.create({
      customerId: createDto.customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress: createDto.shippingAddress,
      notes: createDto.notes,
      status: createDto.status,
    });
    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = createDto.orderItems.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: item.productId,
        priceAtTime: item.priceAtTime,
        quantity: item.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    return this.findOne(savedOrder.orderId);
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: [
        'customer',
        'transaction',
        'orderItems',
        'orderItems.product',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id },
      relations: [
        'customer',
        'transaction',
        'orderItems',
        'orderItems.product',
        'shippingLogs',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { customerId },
      relations: [
        'customer',
        'transaction',
        'orderItems',
        'orderItems.product',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateDto);
    return await this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    order.status = 'REJECTED' as any;
    if (reason) {
      order.rejectionReason = reason;
    }

    // Update transaction status
    if (order.transaction) {
      order.transaction.status = TransactionStatus.CANCELLED;
      await this.transactionRepository.save(order.transaction);
    }

    return await this.orderRepository.save(order);
  }

  async confirmOrder(id: string, processedBy: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = 'CONFIRMED' as any;
    order.processedBy = processedBy;

    // Update transaction
    if (order.transaction) {
      order.transaction.status = TransactionStatus.COMPLETED;
      await this.transactionRepository.save(order.transaction);
    }

    return await this.orderRepository.save(order);
  }

  /**
   * 🛒 CHECKOUT CART - Chuyển cart items thành order
   * 💰 Support thanh toán bằng wallet (balance)
   */
  async checkoutCart(
    userId: string,
    checkoutDto: CheckoutCartDto,
  ): Promise<Order> {
    // 1. Lấy customer từ userId
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException(
        'Customer not found for this user. Please complete your profile.',
      );
    }

    // 2. Lấy cart của user
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 3. Tính total amount từ cart
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );

    // 4. 💰 XỬ LÝ THANH TOÁN BẰNG WALLET
    const paymentMethod = checkoutDto.paymentMethod || PaymentMethod.COD;
    const useWallet =
      checkoutDto.useWallet || paymentMethod === PaymentMethod.WALLET;

    if (useWallet) {
      // Lấy user để check balance
      const user = await this.usersService.findOne(userId);
      const userBalance = parseFloat(user.balance.toString());

      // Check đủ tiền không
      if (userBalance < totalAmount) {
        throw new BadRequestException(
          `Số dư không đủ. Cần ${totalAmount.toLocaleString('vi-VN')} VND, hiện có ${userBalance.toLocaleString('vi-VN')} VND. Vui lòng nạp thêm tiền.`,
        );
      }

      // Trừ tiền từ balance
      const newBalance = userBalance - totalAmount;
      await this.usersService.update(userId, { balance: newBalance });

      console.log(
        `✅ Paid by wallet: ${totalAmount} VND. New balance: ${newBalance} VND`,
      );
    }

    // 5. Tạo transaction
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: useWallet
        ? TransactionStatus.COMPLETED
        : TransactionStatus.PENDING,
      paymentMethod: paymentMethod,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 6. Tạo order
    const order = this.orderRepository.create({
      customerId: customer.customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress: checkoutDto.shippingAddress,
      notes: checkoutDto.notes,
      status: useWallet ? ('CONFIRMED' as any) : ('PENDING' as any), // Auto confirm nếu đã trả tiền
    });
    const savedOrder = await this.orderRepository.save(order);

    // 7. Tạo order items từ cart items
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: cartItem.productId,
        priceAtTime: cartItem.price || 0,
        quantity: cartItem.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    // 8. Confirm sale trong inventory (chuyển reserve → sold)
    for (const cartItem of cart.items) {
      await this.inventoryService.confirmSale(
        cartItem.productId,
        cartItem.quantity,
      );
    }

    // 9. Xóa cart sau khi checkout thành công
    await this.cartService.clearCart(userId);

    // 10. Trả về order với relations
    return this.findOne(savedOrder.orderId);
  }

  /**
   * Get customer by userId (helper method for controller)
   */
  async getCustomerByUserId(userId: string) {
    return await this.customersService.findByUserId(userId);
  }
}
