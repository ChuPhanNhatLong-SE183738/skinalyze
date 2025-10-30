import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentType } from './entities/payment.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrdersService } from '../orders/orders.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { OrderStatus } from '../orders/entities/order.entity';
import { UsersService } from '../users/users.service';

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
  ) {}

  /**
   * Tạo payment mới (cho order hoặc topup)
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { orderId, userId, amount, paymentMethod, paymentType } = createPaymentDto;

    // Validate based on payment type
    if (paymentType === PaymentType.ORDER) {
      if (!orderId) {
        throw new BadRequestException('Order ID is required for order payment');
      }
      // Verify order exists
      const order = await this.ordersService.findOne(orderId);
      if (!order) {
        throw new NotFoundException(`Order #${orderId} not found`);
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
    const paymentCode = this.generatePaymentCode(paymentType, orderId, userId);

    // Set expiration (15 minutes for banking)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);

    const payment = this.paymentRepository.create({
      paymentCode,
      paymentType,
      orderId,
      userId,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING,
      expiredAt,
    });

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
    this.logger.log(`🔔 Received SePay webhook: ${JSON.stringify(webhookData)}`);

    // Chỉ xử lý giao dịch tiền VÀO
    if (webhookData.transferType !== 'in') {
      this.logger.warn(`⚠️ Ignored transaction type: ${webhookData.transferType}`);
      return { success: false, message: 'Only process incoming transactions' };
    }

    // Extract payment code từ nội dung chuyển khoản
    const paymentCode = this.extractPaymentCode(webhookData.content);
    if (!paymentCode) {
      this.logger.warn(`⚠️ No payment code found in content: ${webhookData.content}`);
      return { success: false, message: 'Payment code not found' };
    }

    // Tìm payment theo code
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode },
      relations: ['order'],
    });

    if (!payment) {
      this.logger.warn(`⚠️ Payment not found: ${paymentCode}`);
      return { success: false, message: 'Payment not found' };
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

    this.logger.log(`✅ Payment completed: ${paymentCode} - Type: ${payment.paymentType}`);

    // Process based on payment type
    if (payment.paymentType === PaymentType.ORDER) {
      // Update order status to CONFIRMED (paid)
      if (payment.order) {
        await this.ordersService.update(payment.order.orderId, {
          status: OrderStatus.PENDING,
        });
        this.logger.log(`✅ Order #${payment.orderId} marked as PENDING`);
      }

      return {
        success: true,
        message: 'Order payment processed successfully',
        paymentType: 'order',
        paymentCode,
        amount: amountReceived,
        orderId: payment.orderId,
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
   * - Order: SKO{orderId}{timestamp} (SKinalyze Order)
   * - Topup: SKT{userId_short}{timestamp} (SKinalyze Topup)
   */
  private generatePaymentCode(
    paymentType: PaymentType,
    orderId?: string,
    userId?: string,
  ): string {
    const timestamp = Date.now().toString().slice(-6); // Lấy 6 số cuối

    if (paymentType === PaymentType.ORDER && orderId) {
      // For order, use last 8 chars of orderId (UUID)
      const orderIdShort = orderId.replace(/-/g, '').slice(-8).toUpperCase();
      return `SKO${orderIdShort}${timestamp}`;
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
      order: payment.order ? {
        orderId: payment.order.orderId,
        status: payment.order.status,
      } : null,
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
