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
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

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

    // 3. Tạo transaction
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: TransactionStatus.PENDING,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 4. Tạo order
    const order = this.orderRepository.create({
      customerId: customer.customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress: checkoutDto.shippingAddress,
      notes: checkoutDto.notes,
      status: 'PENDING' as any,
    });
    const savedOrder = await this.orderRepository.save(order);

    // 5. Tạo order items từ cart items
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: cartItem.productId,
        priceAtTime: cartItem.price || 0,
        quantity: cartItem.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    // 6. Confirm sale trong inventory (chuyển reserve → sold)
    for (const cartItem of cart.items) {
      if (cartItem.reservations) {
        for (const reservation of cartItem.reservations) {
          await this.inventoryService.confirmSale(
            cartItem.shopId,
            cartItem.productId,
            reservation.batchId,
            reservation.quantity,
          );
        }
      }
    }

    // 7. Xóa cart sau khi checkout thành công
    await this.cartService.clearCart(userId);

    // 8. Trả về order với relations
    return this.findOne(savedOrder.orderId);
  }

  /**
   * Get customer by userId (helper method for controller)
   */
  async getCustomerByUserId(userId: string) {
    return await this.customersService.findByUserId(userId);
  }
}
