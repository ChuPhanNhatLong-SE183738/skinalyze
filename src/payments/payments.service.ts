import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from './entities/payment.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrdersService } from '../orders/orders.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { OrderStatus } from '../orders/entities/order.entity';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
  ) {}

  /**
   * Tạo payment mới (cho order hoặc topup)
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const {
      orderId,
      userId,
      customerId,
      cartData,
      shippingAddress,
      orderNotes,
      amount,
      paymentMethod,
      paymentType,
    } = createPaymentDto;

    // Validate based on payment type
    if (paymentType === PaymentType.ORDER) {
      // Nếu có orderId, verify order exists (cho trường hợp thanh toán order đã tạo)
      if (orderId) {
        const order = await this.ordersService.findOne(orderId);
        if (!order) {
          throw new NotFoundException(`Order #${orderId} not found`);
        }
      }
      // Nếu không có orderId, cần có cartData để tạo order sau khi thanh toán
      else if (!cartData || !customerId) {
        throw new BadRequestException(
          'Cart data and customer ID are required for order payment',
        );
      }
    } else if (paymentType === PaymentType.TOPUP) {
      if (!userId) {
        throw new BadRequestException('User ID is required for topup');
      }
      // Verify user exists
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }
      // Validate topup amount
      if (amount < 10000) {
        throw new BadRequestException('Số tiền nạp tối thiểu là 10,000 VND');
      }
      if (amount > 50000000) {
        throw new BadRequestException('Số tiền nạp tối đa là 50,000,000 VND');
      }
    }

    // Generate unique payment code
    const paymentCode = this.generatePaymentCode(
      paymentType,
      orderId,
      userId,
      customerId,
    );

    // Set expiration (15 minutes for banking)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);

    const paymentData: any = {
      paymentCode,
      paymentType,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING,
      expiredAt,
    };

    // Add optional fields only if they exist
    if (orderId) paymentData.orderId = orderId;
    if (userId) paymentData.userId = userId;
    if (customerId) paymentData.customerId = customerId;
    if (cartData) paymentData.cartData = JSON.stringify(cartData);
    if (shippingAddress) paymentData.shippingAddress = shippingAddress;
    if (orderNotes) paymentData.orderNotes = orderNotes;

    const payment = this.paymentRepository.create(
      paymentData,
    ) as unknown as Payment;
    const savedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `💳 Payment created: ${paymentCode} - Type: ${paymentType} - Amount: ${amount}`,
    );

    return savedPayment;
  }

  /**
   * Xử lý webhook từ SePay
   */
  async handleSepayWebhook(webhookData: SepayWebhookDto): Promise<any> {
    this.logger.log(
      `🔔 Received SePay webhook: ${JSON.stringify(webhookData)}`,
    );

    // Chỉ xử lý giao dịch tiền VÀO
    if (webhookData.transferType !== 'in') {
      this.logger.warn(
        `⚠️ Ignored transaction type: ${webhookData.transferType}`,
      );
      return { success: false, message: 'Only process incoming transactions' };
    }

    // Extract payment code từ nội dung chuyển khoản
    const paymentCode = this.extractPaymentCode(webhookData.content);
    if (!paymentCode) {
      this.logger.warn(
        `⚠️ No payment code found in content: ${webhookData.content}`,
      );
      return { success: false, message: 'Payment code not found' };
    }

    this.logger.log(
      `🔍 Extracted payment code: "${paymentCode}" (length: ${paymentCode.length})`,
    );

    // Debug: Try multiple search methods
    this.logger.log(`🔍 Searching for payment...`);

    // Method 1: Simple findOne
    const payment1 = await this.paymentRepository.findOne({
      where: { paymentCode: paymentCode },
    });
    this.logger.log(
      `Method 1 (exact match): ${payment1 ? 'FOUND' : 'NOT FOUND'}`,
    );

    // Method 2: Case insensitive
    const payment2 = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('UPPER(payment.paymentCode) = UPPER(:code)', { code: paymentCode })
      .getOne();
    this.logger.log(
      `Method 2 (case insensitive): ${payment2 ? 'FOUND' : 'NOT FOUND'}`,
    );

    // Method 3: LIKE search
    const payment3 = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paymentCode LIKE :code', { code: `%${paymentCode}%` })
      .getOne();
    this.logger.log(`Method 3 (LIKE): ${payment3 ? 'FOUND' : 'NOT FOUND'}`);

    // Debug: List all payments with similar prefix
    const allPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paymentCode LIKE :prefix', { prefix: 'SKO%' })
      .orderBy('payment.createdAt', 'DESC')
      .limit(10)
      .getMany();
    this.logger.log(
      `📊 Recent SKO payments in DB: ${allPayments.map((p) => `"${p.paymentCode}"`).join(', ')}`,
    );

    // Use the payment found by any method
    const payment = payment1 || payment2 || payment3;

    if (payment) {
      // Load order relation if needed
      const paymentWithOrder = await this.paymentRepository.findOne({
        where: { paymentId: payment.paymentId },
        relations: ['order'],
      });
      this.logger.log(`✅ Payment found! Loading with relations...`);
    }

    this.logger.log(`🔍 Final result: ${payment ? 'FOUND' : 'NOT FOUND'}`);

    if (!payment) {
      this.logger.error(`❌ Payment not found in database: ${paymentCode}`);
      this.logger.error(`📋 Content was: ${webhookData.content}`);

      return { success: false, message: 'Payment not found', paymentCode };
    }

    // Kiểm tra payment đã hoàn thành chưa
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.warn(`⚠️ Payment already completed: ${paymentCode}`);
      return { success: false, message: 'Payment already completed' };
    }

    // Kiểm tra payment đã hết hạn chưa
    if (payment.expiredAt && new Date() > payment.expiredAt) {
      payment.status = PaymentStatus.EXPIRED;
      await this.paymentRepository.save(payment);
      this.logger.warn(`⚠️ Payment expired: ${paymentCode}`);
      return { success: false, message: 'Payment expired' };
    }

    // Kiểm tra số tiền
    const amountReceived = webhookData.transferAmount;
    const amountExpected = Number(payment.amount);

    if (amountReceived < amountExpected) {
      this.logger.warn(
        `⚠️ Insufficient amount. Expected: ${amountExpected}, Received: ${amountReceived}`,
      );
      // Update paid amount nhưng không complete
      payment.paidAmount = amountReceived;
      payment.sepayTransactionId = webhookData.id;
      payment.gateway = webhookData.gateway;
      payment.accountNumber = webhookData.accountNumber;
      payment.referenceCode = webhookData.referenceCode;
      payment.transferContent = webhookData.content;
      payment.transactionDate = new Date(webhookData.transactionDate);
      payment.webhookData = JSON.stringify(webhookData);
      await this.paymentRepository.save(payment);

      return {
        success: false,
        message: 'Insufficient amount',
        expected: amountExpected,
        received: amountReceived,
      };
    }

    // Payment thành công!
    payment.status = PaymentStatus.COMPLETED;
    payment.paidAmount = amountReceived;
    payment.paidAt = new Date();
    payment.sepayTransactionId = webhookData.id;
    payment.gateway = webhookData.gateway;
    payment.accountNumber = webhookData.accountNumber;
    payment.referenceCode = webhookData.referenceCode;
    payment.transferContent = webhookData.content;
    payment.transactionDate = new Date(webhookData.transactionDate);
    payment.webhookData = JSON.stringify(webhookData);

    await this.paymentRepository.save(payment);

    this.logger.log(
      `✅ Payment completed: ${paymentCode} - Type: ${payment.paymentType}`,
    );

    // Process based on payment type
    if (payment.paymentType === PaymentType.ORDER) {
      let orderId = payment.orderId;

      // 🆕 Nếu chưa có orderId, tạo order từ cartData
      if (!orderId && payment.cartData && payment.customerId) {
        try {
          const cartData = JSON.parse(payment.cartData);

          // Tạo order với status CONFIRMED luôn (đã thanh toán)
          const newOrder = await this.ordersService.createOrderFromPayment({
            customerId: payment.customerId,
            cartItems: cartData.items,
            shippingAddress: payment.shippingAddress,
            notes: payment.orderNotes,
            totalAmount: amountReceived,
            paymentId: payment.paymentId,
          });

          // Update payment với orderId mới
          payment.orderId = newOrder.orderId;
          await this.paymentRepository.save(payment);

          orderId = newOrder.orderId;

          this.logger.log(`✅ Order created from payment: #${orderId}`);

          // 🆕 Xóa cart sau khi tạo order thành công
          if (payment.userId) {
            try {
              await this.cartService.clearCart(payment.userId);
              this.logger.log(`✅ Cart cleared for user: ${payment.userId}`);
            } catch (error) {
              this.logger.warn(
                `⚠️ Failed to clear cart for user ${payment.userId}: ${error.message}`,
              );
              // Don't throw - order already created, just log warning
            }
          }
        } catch (error) {
          this.logger.error(
            `❌ Failed to create order from payment: ${error.message}`,
          );
          throw error;
        }
      }
      // Nếu đã có orderId (trường hợp cũ), update order status
      else if (orderId) {
        await this.ordersService.update(orderId, {
          status: OrderStatus.CONFIRMED,
        });
        this.logger.log(`✅ Order #${orderId} marked as CONFIRMED`);
      }

      return {
        success: true,
        message: 'Order payment processed successfully',
        paymentType: 'order',
        paymentCode,
        amount: amountReceived,
        orderId: orderId,
      };
    } else if (payment.paymentType === PaymentType.TOPUP) {
      // Add balance to user account
      const user = await this.usersService.findOne(payment.userId);
      const oldBalance = parseFloat(user.balance.toString());
      const newBalance = oldBalance + amountReceived;

      await this.usersService.update(payment.userId, {
        balance: newBalance,
      });

      this.logger.log(
        `✅ Balance updated for user ${payment.userId}: ${oldBalance} → ${newBalance}`,
      );

      return {
        success: true,
        message: 'Topup processed successfully',
        paymentType: 'topup',
        paymentCode,
        amount: amountReceived,
        userId: payment.userId,
        oldBalance,
        newBalance,
      };
    }
  }

  /**
   * Lấy payment theo code
   */
  async findByCode(paymentCode: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentCode} not found`);
    }

    return payment;
  }

  /**
   * Lấy payment theo orderId
   */
  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate payment code duy nhất
   * Format:
   * - Order: SKO{orderId|customerId}{timestamp} (SKinalyze Order)
   * - Topup: SKT{userId_short}{timestamp} (SKinalyze Topup)
   */
  private generatePaymentCode(
    paymentType: PaymentType,
    orderId?: string,
    userId?: string,
    customerId?: string,
  ): string {
    const timestamp = Date.now().toString().slice(-6); // Lấy 6 số cuối

    if (paymentType === PaymentType.ORDER) {
      // Use orderId if exists, otherwise use customerId
      const idToUse = orderId || customerId;
      if (idToUse) {
        const idShort = idToUse.replace(/-/g, '').slice(-8).toUpperCase();
        return `SKO${idShort}${timestamp}`;
      }
    } else if (paymentType === PaymentType.TOPUP && userId) {
      // For topup, use last 8 chars of userId
      const userIdShort = userId.replace(/-/g, '').slice(-8).toUpperCase();
      return `SKT${userIdShort}${timestamp}`;
    }

    // Fallback
    return `SK${timestamp}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Extract payment code từ nội dung chuyển khoản
   * Tìm pattern: SKO hoặc SKT + ký tự
   */
  private extractPaymentCode(content: string): string | null {
    // Match SKO hoặc SKT followed by alphanumeric
    const match = content.match(/SK[OT][A-Z0-9]+/i);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentCode: string): Promise<any> {
    const payment = await this.findByCode(paymentCode);

    return {
      paymentCode: payment.paymentCode,
      status: payment.status,
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      expiredAt: payment.expiredAt,
      paidAt: payment.paidAt,
      order: payment.order
        ? {
            orderId: payment.order.orderId,
            status: payment.order.status,
          }
        : null,
    };
  }

  /**
   * Cancel expired payments (chạy bằng cron job)
   */
  async cancelExpiredPayments(): Promise<number> {
    const expiredPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('payment.expiredAt < :now', { now: new Date() })
      .getMany();

    for (const payment of expiredPayments) {
      payment.status = PaymentStatus.EXPIRED;
      await this.paymentRepository.save(payment);
    }

    this.logger.log(`🕐 Expired ${expiredPayments.length} payments`);
    return expiredPayments.length;
  }
}
