import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
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
import { PaymentsService } from '../payments/payments.service';
import { PaymentType } from '../payments/entities/payment.entity';

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
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
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
   * 💰 Support: wallet, COD, banking (SePay)
   */
  async checkoutCart(
    userId: string,
    checkoutDto: CheckoutCartDto,
  ): Promise<any> {
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

    // 4. 💰 XỬ LÝ PHƯƠNG THỨC THANH TOÁN
    const paymentMethod = checkoutDto.paymentMethod || PaymentMethod.COD;
    const useWallet =
      checkoutDto.useWallet || paymentMethod === PaymentMethod.WALLET;

    let orderStatus: any = 'PENDING';
    let transactionStatus = TransactionStatus.PENDING;
    let paymentInfo: any = null;

    // 4a. Thanh toán bằng WALLET
    if (useWallet) {
      const user = await this.usersService.findOne(userId);
      const userBalance = parseFloat(user.balance.toString());

      if (userBalance < totalAmount) {
        throw new BadRequestException(
          `Số dư không đủ. Cần ${totalAmount.toLocaleString('vi-VN')} VND, hiện có ${userBalance.toLocaleString('vi-VN')} VND. Vui lòng nạp thêm tiền.`,
        );
      }

      // Trừ tiền từ balance
      const newBalance = userBalance - totalAmount;
      await this.usersService.update(userId, { balance: newBalance });

      orderStatus = 'CONFIRMED';
      transactionStatus = TransactionStatus.COMPLETED;

      console.log(
        `✅ Paid by wallet: ${totalAmount} VND. New balance: ${newBalance} VND`,
      );
    }

    // 5. Tạo transaction
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: transactionStatus,
      paymentMethod: paymentMethod,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 6. Tạo order
    const order = this.orderRepository.create({
      customerId: customer.customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress: checkoutDto.shippingAddress,
      notes: checkoutDto.notes,
      status: orderStatus,
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

    // 9. 💳 TẠO PAYMENT RECORD NẾU LÀ BANKING
    if (paymentMethod === PaymentMethod.BANKING) {
      const payment = await this.paymentsService.createPayment({
        paymentType: PaymentType.ORDER,
        orderId: savedOrder.orderId,
        amount: totalAmount,
        paymentMethod: 'banking' as any,
      });

      // Generate QR code URL
      const qrCodeUrl = `https://img.vietqr.io/image/MB-0347178790-compact2.png?amount=${totalAmount}&addInfo=${payment.paymentCode}&accountName=CHU PHAN NHAT LONG`;

      paymentInfo = {
        paymentId: payment.paymentId,
        paymentCode: payment.paymentCode,
        amount: totalAmount,
        status: payment.status,
        expiredAt: payment.expiredAt,
        qrCodeUrl,
        bankingInfo: {
          bankName: 'MBBank',
          accountNumber: '0347178790',
          accountName: 'CHU PHAN NHAT LONG',
          amount: totalAmount,
          content: payment.paymentCode,
          qrCode: qrCodeUrl,
        },
        instructions: [
          '1. Mở app ngân hàng và quét mã QR',
          '2. Hoặc chuyển khoản thủ công với thông tin bên dưới',
          `3. Nội dung chuyển khoản: ${payment.paymentCode}`,
          '4. Hệ thống tự động xác nhận sau khi nhận tiền (thời gian thực)',
          '5. Đơn hàng sẽ được xác nhận ngay khi thanh toán thành công',
        ],
      };

      console.log(`💳 Payment created: ${payment.paymentCode} for order #${savedOrder.orderId}`);
    }

    // 10. Xóa cart sau khi checkout thành công
    await this.cartService.clearCart(userId);

    // 11. Trả về order với payment info
    const fullOrder = await this.findOne(savedOrder.orderId);

    return {
      order: fullOrder,
      payment: paymentInfo,
      message: paymentInfo 
        ? 'Order created. Please complete payment to confirm.'
        : useWallet 
        ? 'Order confirmed and paid by wallet.'
        : 'Order created successfully.',
    };
  }

  /**
   * Get customer by userId (helper method for controller)
   */
  async getCustomerByUserId(userId: string) {
    return await this.customersService.findByUserId(userId);
  }
}
