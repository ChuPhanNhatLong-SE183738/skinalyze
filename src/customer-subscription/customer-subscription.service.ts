import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CustomerSubscription } from './entities/customer-subscription.entity';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { PaymentsService } from '../payments/payments.service';
import { Payment, PaymentType } from '../payments/entities/payment.entity';
import { CreateCustomerSubscriptionDto } from './dto/create-customer-subscription.dto';
import { Customer } from 'src/customers/entities/customer.entity';
import { SubscriptionPlan } from 'src/subscription-plans/entities/subscription-plan.entity';

@Injectable()
export class CustomerSubscriptionService {
  private readonly logger = new Logger(CustomerSubscriptionService.name);

  constructor(
    @InjectRepository(CustomerSubscription)
    private readonly customerSubscriptionRepository: Repository<CustomerSubscription>,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  async createSubscriptionPayment(
    customerId: string,
    dto: CreateCustomerSubscriptionDto,
  ): Promise<Payment> {
    const plan = await this.subscriptionPlansService.findOne(dto.planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const payment = await this.paymentsService.createPayment({
      paymentType: PaymentType.SUBSCRIPTION,
      amount: plan.basePrice,
      customerId: customerId,
      paymentMethod: dto.paymentMethod,
      planId: plan.planId,
    });

    return payment;
  }

  /**
   * KÍCH HOẠT MỘT GÓI (SUBSCRIPTION)
   * Được gọi bởi PaymentsService (trong postProcess) sau khi webhook xác nhận thanh toán.
   * Hàm này sẽ TẠO MỚI bản ghi CustomerSubscription.
   */
  async activateSubscription(
    customerId: string,
    planId: string,
    payment: Payment,
    paidAt: Date,
    manager: EntityManager,
  ): Promise<CustomerSubscription> {
    const subRepo = manager.getRepository(CustomerSubscription);
    const planRepo = manager.getRepository(SubscriptionPlan);
    const customerRepo = manager.getRepository(Customer);

    // 1. Lấy thông tin
    const [plan, customer] = await Promise.all([
      planRepo.findOneBy({ planId }),
      customerRepo.findOneBy({ customerId }),
    ]);

    if (!plan || !customer) {
      throw new NotFoundException(
        'Plan or Customer not found during activation',
      );
    }

    // 2. TẠO MỚI GÓI ĐÃ KÍCH HOẠT
    const duration = plan.durationInDays;
    const endDate = new Date(paidAt);
    endDate.setDate(paidAt.getDate() + duration);

    // SỬA LẠI: Gán các đối tượng quan hệ trực tiếp
    const newSubscription = subRepo.create({
      customer: customer,
      subscriptionPlan: plan,
      payment: payment,
      sessionsRemaining: plan.totalSessions,
      isActive: true,
      startDate: paidAt,
      endDate: endDate,
    });

    await subRepo.save(newSubscription);
    this.logger.log(
      `✅ Subscription ${newSubscription.id} activated. Expires on: ${endDate.toISOString()}`,
    );

    return newSubscription;
  }

  async useSession(
    subscriptionId: string,
    customerId: string,
    manager: EntityManager,
  ): Promise<CustomerSubscription> {
    const subRepo = manager.getRepository(CustomerSubscription);
    const subscription = await subRepo.findOne({
      where: { id: subscriptionId, customer: { customerId: customerId } },
    });

    if (!subscription) {
      throw new NotFoundException(
        'Subscription not found or does not belong to user.',
      );
    }
    if (!subscription.isActive) {
      throw new BadRequestException('This subscription is not active.');
    }
    if (subscription.endDate && new Date() > subscription.endDate) {
      throw new BadRequestException('This subscription has expired.');
    }
    if (subscription.sessionsRemaining <= 0) {
      throw new BadRequestException(
        'This subscription has no sessions remaining.',
      );
    }

    subscription.sessionsRemaining -= 1;

    return subRepo.save(subscription);
  }

  async refundSession(
    subscriptionId: string,
    manager: EntityManager,
  ): Promise<CustomerSubscription> {
    const subRepo = manager.getRepository(CustomerSubscription);
    const subscription = await subRepo.findOne({
      where: { id: subscriptionId },
      relations: ['subscriptionPlan'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription ${subscriptionId} not found for refund.`,
      );
    }

    if (
      subscription.sessionsRemaining >=
      subscription.subscriptionPlan.totalSessions
    ) {
      this.logger.warn(
        `Subscription ${subscriptionId} is already full. Cannot refund session.`,
      );
      return subscription;
    }
    subscription.sessionsRemaining += 1;

    this.logger.log(
      `Session refunded for Subscription ${subscriptionId}. New count: ${subscription.sessionsRemaining}`,
    );
    return subRepo.save(subscription);
  }

  async findByCustomerId(customerId: string): Promise<CustomerSubscription[]> {
    return this.customerSubscriptionRepository.find({
      where: { customer: { customerId: customerId } },
      relations: ['subscriptionPlan', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByIdAndCustomer(
    id: string,
    customerId: string,
  ): Promise<CustomerSubscription> {
    const subscription = await this.customerSubscriptionRepository.findOne({
      where: { id, customer: { customerId: customerId } },
      relations: ['subscriptionPlan', 'payment'],
    });

    if (!subscription) {
      throw new NotFoundException(
        'Subscription not found or you do not own it.',
      );
    }
    return subscription;
  }
}
