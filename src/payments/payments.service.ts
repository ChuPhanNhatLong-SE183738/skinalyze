import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from './entities/payment.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import {
  AvailabilitySlot,
  SlotStatus,
} from '../availability-slots/entities/availability-slot.entity';

interface PaymentProcessingResult {
  success: boolean;
  message: string;
  paymentType?: string;
  paymentCode?: string;
  amount?: number;
  [key: string]: unknown;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
  ) {}

  /**
   * Tạo payment mới (cho order, topup, booking...)
   */
  async createPayment(
    createPaymentDto: CreatePaymentDto,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repository =
      manager?.getRepository(Payment) ?? this.paymentRepository;

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

      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (amount < 10000) {
        throw new BadRequestException('Số tiền nạp tối thiểu là 10,000 VND');
      }

      if (amount > 50000000) {
        throw new BadRequestException('Số tiền nạp tối đa là 50,000,000 VND');
      }
    } else if (paymentType === PaymentType.BOOKING) {
      if (!customerId) {
        throw new BadRequestException(
          'CustomerId ID is required for booking payment',
        );
      }
    }

    const paymentCode = this.generatePaymentCode(
      paymentType,
      orderId,
      userId,
      customerId,
    );

    // Set expiration (15 minutes for banking)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);

    const paymentData: Partial<Payment> = {
      paymentCode,
      paymentType,
      amount,
      paymentMethod: paymentMethod ?? PaymentMethod.BANKING,
      status: PaymentStatus.PENDING,
      expiredAt,
    };

    if (orderId) {
      paymentData.orderId = orderId;
    }
    if (userId) {
      paymentData.userId = userId;
    }
    if (customerId) {
      paymentData.customerId = customerId;
    }
    if (cartData) {
      paymentData.cartData = JSON.stringify(cartData);
    }
    if (shippingAddress) {
      paymentData.shippingAddress = shippingAddress;
    }
    if (orderNotes) {
      paymentData.orderNotes = orderNotes;
    }

    const payment = repository.create(paymentData);
    const savedPayment = await repository.save(payment);

    this.logger.log(
      `💳 Payment created: ${paymentCode} - Type: ${paymentType} - Amount: ${amount}`,
    );

    return savedPayment;
  }

  /**
   * Xử lý webhook từ SePay (xác nhận thanh toán)
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

    let responsePayload: PaymentProcessingResult | undefined;
    let postProcess: (() => Promise<void>) | undefined;
    let processedPaymentInfo:
      | { paymentId: number; paymentCode: string }
      | undefined;

    await this.entityManager.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const payment = await paymentRepo.findOne({
        where: { paymentCode },
        relations: ['appointment', 'appointment.availabilitySlot'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment) {
        this.logger.error(`❌ Payment not found in database: ${paymentCode}`);
        responsePayload = {
          success: false,
          message: 'Payment not found',
          paymentCode,
        };
        return;
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        this.logger.warn(`⚠️ Payment already completed: ${paymentCode}`);
        responsePayload = {
          success: false,
          message: 'Payment already completed',
        };
        return;
      }

      if (payment.expiredAt && new Date() > payment.expiredAt) {
        payment.status = PaymentStatus.EXPIRED;
        await paymentRepo.save(payment);
        this.logger.warn(`⚠️ Payment expired: ${paymentCode}`);
        responsePayload = { success: false, message: 'Payment expired' };
        return;
      }

      const amountReceived = webhookData.transferAmount;
      const amountExpected = Number(payment.amount);

      this.applyWebhookAudit(payment, webhookData, amountReceived);

      if (amountReceived < amountExpected) {
        this.logger.warn(
          `⚠️ Insufficient amount. Expected: ${amountExpected}, Received: ${amountReceived}`,
        );
        await paymentRepo.save(payment);
        responsePayload = {
          success: false,
          message: 'Insufficient amount',
          expected: amountExpected,
          received: amountReceived,
        };
        return;
      }

      payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      await paymentRepo.save(payment);

      processedPaymentInfo = {
        paymentId: payment.paymentId,
        paymentCode: payment.paymentCode,
      };

      this.logger.log(
        `✅ Payment completed: ${paymentCode} - Type: ${payment.paymentType}`,
      );

      switch (payment.paymentType) {
        case PaymentType.ORDER:
          postProcess = async () => {
            responsePayload = await this.processOrderPaymentAfterCommit(
              payment.paymentId,
              amountReceived,
            );
          };
          break;
        case PaymentType.TOPUP:
          postProcess = async () => {
            responsePayload = await this.processTopupPaymentAfterCommit(
              payment.paymentId,
              amountReceived,
            );
          };
          break;
        case PaymentType.BOOKING:
          postProcess = async () => {
            responsePayload = await this.processBookingPaymentAfterCommit(
              payment.paymentId,
              amountReceived,
            );
          };
          break;
        default:
          responsePayload = {
            success: true,
            message: 'Payment processed successfully',
            paymentType: payment.paymentType,
            paymentCode,
            amount: amountReceived,
          };
      }
    });

    if (postProcess) {
      try {
        await postProcess();
      } catch (error) {
        //  LỖI NGHIỆP VỤ (CRITICAL)
        const err = error as Error;
        const paymentId = processedPaymentInfo?.paymentId ?? 'unknown';
        const paymentCode = processedPaymentInfo?.paymentCode ?? 'unknown';
        this.logger.error(
          `[CRITICAL] Payment (ID: ${paymentId}, Code: ${paymentCode}) completed but post-processing failed: ${err.message}`,
          err.stack,
        );
        //  TẠI ĐÂY PHẢI GỬI THÔNG BÁO CHO ADMIN
        throw error;
      }
    }

    return (
      responsePayload ?? {
        success: false,
        message: 'Unable to process payment',
      }
    );
  }

  private applyWebhookAudit(
    payment: Payment,
    webhookData: SepayWebhookDto,
    amountReceived: number,
  ): void {
    payment.paidAmount = amountReceived;
    payment.sepayTransactionId = webhookData.id;
    payment.gateway = webhookData.gateway;
    payment.accountNumber = webhookData.accountNumber;
    payment.referenceCode = webhookData.referenceCode;
    payment.transferContent = webhookData.content;
    payment.transactionDate = new Date(webhookData.transactionDate);
    payment.webhookData = JSON.stringify(webhookData);
  }

  private async processBookingPaymentAfterCommit(
    paymentId: number,
    amountReceived: number,
  ): Promise<PaymentProcessingResult> {
    // Bắt đầu một transaction MỚI, riêng biệt
    // để đảm bảo Cập nhật Hẹn và Cập nhật Slot xảy ra đồng bộ
    return this.entityManager.transaction(async (manager) => {
      // Dùng 'manager' để lấy các repository cho transaction này
      const paymentRepo = manager.getRepository(Payment);
      const appointmentRepo = manager.getRepository(Appointment);
      const slotRepo = manager.getRepository(AvailabilitySlot);

      // 1. Tìm Payment (bằng ID)
      const payment = await paymentRepo.findOne({
        where: { paymentId },
      });

      if (!payment) {
        this.logger.error(`❌ Payment ${paymentId} not found after commit`);
        throw new NotFoundException('Payment not found after commit');
      }

      // 2. Tìm Appointment liên quan
      // (Giả sử Appointment đã được tạo và liên kết 'paymentId'
      // trong luồng "Giữ Chỗ" ban đầu)
      const appointment = await appointmentRepo.findOne({
        where: { payment: { paymentId: paymentId } },
        relations: ['availabilitySlot'],
      });

      if (!appointment) {
        this.logger.error(
          `❌ Booking payment ${payment.paymentCode} missing appointment linkage`,
        );
        throw new NotFoundException('Appointment not found for this payment');
      }

      // 3. Cập nhật trạng thái Appointment
      if (appointment.appointmentStatus === AppointmentStatus.PENDING_PAYMENT) {
        appointment.appointmentStatus = AppointmentStatus.SCHEDULED;
      }
      await appointmentRepo.save(appointment);

      // 4. Cập nhật trạng thái Slot
      if (appointment.availabilitySlot) {
        await slotRepo.update(appointment.availabilitySlot.slotId, {
          status: SlotStatus.BOOKED,
          appointmentId: appointment.appointmentId,
        });
      }

      this.logger.log(
        `✅ Booking confirmed for Appointment ${appointment.appointmentId}`,
      );

      // 5. Trả về kết quả
      return {
        success: true,
        message: 'Booking payment processed successfully',
        paymentType: 'booking',
        paymentCode: payment.paymentCode,
        amount: amountReceived,
        appointmentId: appointment.appointmentId,
        slotId: appointment.availabilitySlot?.slotId ?? null,
      };
    });
  }

  private async processOrderPaymentAfterCommit(
    paymentId: number,
    amountReceived: number,
  ): Promise<PaymentProcessingResult> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (!payment) {
      this.logger.error(
        `❌ Payment ${paymentId} not found after transaction commit`,
      );
      return {
        success: false,
        message: 'Payment not found after commit',
        paymentId,
      };
    }

    let orderId = payment.orderId;

    if (!orderId && payment.cartData && payment.customerId) {
      try {
        const parsedCart = JSON.parse(payment.cartData) as unknown;
        const items = (parsedCart as { items?: unknown }).items;

        if (!Array.isArray(items)) {
          throw new BadRequestException('Invalid cart data on payment');
        }

        const newOrder = await this.ordersService.createOrderFromPayment({
          customerId: payment.customerId,
          cartItems: items as Record<string, unknown>[],
          shippingAddress: payment.shippingAddress,
          notes: payment.orderNotes,
          totalAmount: amountReceived,
          paymentId: payment.paymentId,
        });

        payment.orderId = newOrder.orderId;
        await this.paymentRepository.save(payment);
        orderId = newOrder.orderId;

        this.logger.log(`✅ Order created from payment: #${orderId}`);

        if (payment.userId) {
          try {
            await this.cartService.clearCart(payment.userId);
            this.logger.log(`✅ Cart cleared for user: ${payment.userId}`);
          } catch (error) {
            const err = error as Error;
            this.logger.warn(
              `⚠️ Failed to clear cart for user ${payment.userId}: ${err.message}`,
            );
          }
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `❌ Failed to create order from payment: ${err.message}`,
        );
        throw error;
      }
    } else if (orderId) {
      await this.ordersService.update(orderId, {
        status: OrderStatus.CONFIRMED,
      });
      this.logger.log(`✅ Order #${orderId} marked as CONFIRMED`);
    }

    return {
      success: true,
      message: 'Order payment processed successfully',
      paymentType: 'order',
      paymentCode: payment.paymentCode,
      amount: amountReceived,
      orderId,
    };
  }

  private async processTopupPaymentAfterCommit(
    paymentId: number,
    amountReceived: number,
  ): Promise<PaymentProcessingResult> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (!payment || !payment.userId) {
      this.logger.error(
        `❌ Payment ${paymentId} missing user information for topup`,
      );
      return {
        success: false,
        message: 'Invalid topup payment data',
        paymentId,
      };
    }

    const user = await this.usersService.findOne(payment.userId);
    const oldBalance = Number(user.balance);
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
      paymentCode: payment.paymentCode,
      amount: amountReceived,
      userId: payment.userId,
      oldBalance,
      newBalance,
    };
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
    } else if (paymentType === PaymentType.BOOKING && customerId) {
      const customerIdShort = customerId
        .replace(/-/g, '')
        .slice(-8)
        .toUpperCase();
      return `SKB${customerIdShort}${timestamp}`;
    } else if (paymentType === PaymentType.SUBSCRIPTION && customerId) {
      const customerIdShort = customerId
        .replace(/-/g, '')
        .slice(-8)
        .toUpperCase();
      return `SKS${customerIdShort}${timestamp}`;
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
    const match = content.match(/SK[OTBS][A-Z0-9]+/i);
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
