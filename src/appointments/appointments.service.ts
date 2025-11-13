import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  Between,
  IsNull,
  LessThan,
  FindOneOptions,
} from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  InterruptAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/update-appointment-status.dto';
import { CustomersService } from '../customers/customers.service';
import { DermatologistsService } from '../dermatologists/dermatologists.service';
import { Customer } from '../customers/entities/customer.entity';
import { Dermatologist } from '../dermatologists/entities/dermatologist.entity';
import { SkinAnalysis } from '../skin-analysis/entities/skin-analysis.entity';
import { TreatmentRoutine } from '../treatment-routines/entities/treatment-routine.entity';

import { AvailabilitySlotsService } from '../availability-slots/availability-slots.service';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentType } from 'src/payments/entities/payment.entity';
import { GoogleMeetService } from 'src/google-meet/google-meet.service';
import { addMinutes, subMinutes } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AppointmentStatus,
  TerminationReason,
} from './types/appointment.types';
import { CreateSubscriptionAppointmentDto } from './dto/create-subscription-appointment.dto';
import { CustomerSubscriptionService } from 'src/customer-subscription/customer-subscription.service';
import { UserRole } from 'src/users/entities/user.entity';
import { CompleteAppointmentDto } from './dto/complete-appointment-dto';

export interface AppointmentReservationResult {
  appointmentId: string;
  paymentCode: string;
  amount: number;
  expiredAt: Date;
  qrCodeUrl: string;
}
export interface AppointmentActionResult {
  message: string;
  [key: string]: any;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly GRACE_PERIOD_MS = 15 * 60 * 1000; // Waiting time for report NO_SHOW: 15 minutes
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly customersService: CustomersService,
    private readonly dermatologistsService: DermatologistsService,
    private readonly availabilitySlotsService: AvailabilitySlotsService,
    private readonly googleMeetService: GoogleMeetService,
    private readonly entityManager: EntityManager,
    private readonly customerSubscriptionService: CustomerSubscriptionService,

    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  async createReservation(
    userId: string,
    createDto: CreateAppointmentDto,
  ): Promise<AppointmentReservationResult> {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found for this user.');
    }

    return this.entityManager.transaction(async (manager) => {
      const appointmentRepo = manager.getRepository(Appointment);

      const reservedSlot = await this.availabilitySlotsService.reserveSlot(
        createDto.dermatologistId,
        createDto.startTime,
        createDto.endTime,
        manager,
      );

      // Create Pending Payment
      const payment = await this.paymentsService.createPayment(
        {
          paymentType: PaymentType.BOOKING,
          amount: reservedSlot.price,
          customerId: customer.customerId,
          userId: userId,
        },
        manager,
      );

      // Create Pending Appointment
      const appointment = appointmentRepo.create({
        note: createDto.note,
        appointmentType: createDto.appointmentType,
        price: reservedSlot.price,
        startTime: reservedSlot.startTime,
        endTime: reservedSlot.endTime,
        appointmentStatus: AppointmentStatus.PENDING_PAYMENT,
        payment,
        availabilitySlot: reservedSlot,
        customer: { customerId: customer.customerId } as Customer,
        dermatologist: {
          dermatologistId: createDto.dermatologistId,
        } as Dermatologist,
        skinAnalysis: createDto.analysisId
          ? ({ analysisId: createDto.analysisId } as SkinAnalysis)
          : undefined,
        trackingRoutine: createDto.trackingRoutineId
          ? ({ routineId: createDto.trackingRoutineId } as TreatmentRoutine)
          : undefined,
      });

      const savedAppointment = await appointmentRepo.save(appointment);

      //  Update the reverse relationships (complete 1:1)
      await this.availabilitySlotsService.linkSlotToAppointment(
        reservedSlot.slotId,
        savedAppointment.appointmentId,
        manager,
      );

      //  Return payment information to client
      return {
        appointmentId: savedAppointment.appointmentId,
        paymentCode: payment.paymentCode,
        amount: payment.amount,
        expiredAt: payment.expiredAt,
        qrCodeUrl: `https"//img.vietqr.io/image/MB-YOUR_BANK_ACCOUNT-compact2.png?amount=${payment.amount}&addInfo=${payment.paymentCode}`,
      };
    });
  }

  async createSubscriptionAppointment(
    userId: string,
    createDto: CreateSubscriptionAppointmentDto,
  ): Promise<Appointment> {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found for this user.');
    }

    return this.entityManager.transaction(async (manager) => {
      const appointmentRepo = manager.getRepository(Appointment);

      //  Reserve Slot
      const reservedSlot = await this.availabilitySlotsService.reserveSlot(
        createDto.dermatologistId,
        createDto.startTime,
        createDto.endTime,
        manager,
      );

      //  -1 SESSION
      const usedSubscription =
        await this.customerSubscriptionService.useSession(
          createDto.customerSubscriptionId,
          customer.customerId,
          manager,
        );

      // Create Appointment (Scheduled)
      const appointment = appointmentRepo.create({
        note: createDto.note,
        appointmentType: createDto.appointmentType,
        price: 0,
        startTime: reservedSlot.startTime,
        endTime: reservedSlot.endTime,
        appointmentStatus: AppointmentStatus.SCHEDULED,
        customerSubscription: usedSubscription,
        availabilitySlot: reservedSlot,
        customer: { customerId: customer.customerId } as Customer,
        dermatologist: {
          dermatologistId: createDto.dermatologistId,
        } as Dermatologist,
        skinAnalysis: createDto.analysisId
          ? ({ analysisId: createDto.analysisId } as SkinAnalysis)
          : undefined,
        trackingRoutine: createDto.trackingRoutineId
          ? ({ routineId: createDto.trackingRoutineId } as TreatmentRoutine)
          : undefined,
      });

      const savedAppointment = await appointmentRepo.save(appointment);

      await this.availabilitySlotsService.linkSlotToAppointment(
        reservedSlot.slotId,
        savedAppointment.appointmentId,
        manager,
      );

      return savedAppointment;
    });
  }

  async completeAppointment(
    userId: string,
    appointmentId: string,
    dto: CompleteAppointmentDto,
  ): Promise<Appointment> {
    const dermatologist = await this.dermatologistsService.findByUserId(userId);

    const appointment = await this.appointmentRepository.findOne({
      where: {
        appointmentId,
        dermatologist: { dermatologistId: dermatologist.dermatologistId },
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found or you do not own it.',
      );
    }

    if (appointment.appointmentStatus !== AppointmentStatus.IN_PROGRESS) {
      this.logger.warn(
        `Attempted to complete an appointment not IN_PROGRESS (Status: ${appointment.appointmentStatus})`,
      );
      throw new BadRequestException(
        'Appointment is not in a state to be completed (must be IN_PROGRESS).',
      );
    }

    if (!appointment.customerJoinedAt) {
      this.logger.warn(
        `Attempted to complete appointment ${appointmentId} but customer has not joined.`,
      );
      throw new BadRequestException(
        'Cannot complete: Customer has not joined the appointment. Mark as NO_SHOW instead.',
      );
    }

    appointment.appointmentStatus = AppointmentStatus.COMPLETED;
    appointment.note = dto.note;

    const updatedAppointment =
      await this.appointmentRepository.save(appointment);

    // 5.
    // (Notification do appointment review to customer)
    // await this.notificationService.sendReviewRequest(appointment.customer.userId, appointmentId);

    return updatedAppointment;
  }

  async recordCheckIn(appointmentId: string, userId: string, role: UserRole) {
    const appointment = await this.findOne(appointmentId);

    if (
      appointment.appointmentStatus !== AppointmentStatus.SCHEDULED &&
      appointment.appointmentStatus !== AppointmentStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Cannot check-in to an appointment with status ${appointment.appointmentStatus}`,
      );
    }

    if (appointment.appointmentStatus === AppointmentStatus.SCHEDULED) {
      appointment.appointmentStatus = AppointmentStatus.IN_PROGRESS;
    }

    // Check role and ownership
    if (role === UserRole.CUSTOMER) {
      if (appointment.customer.user.userId !== userId) {
        throw new ForbiddenException('You do not own this appointment');
      }
      // First-time only
      if (!appointment.customerJoinedAt) {
        appointment.customerJoinedAt = new Date();
      }
    } else if (role === UserRole.DERMATOLOGIST) {
      // Check dermatologist
      if (appointment.dermatologist.user.userId !== userId) {
        throw new ForbiddenException(
          'You are not assigned to this appointment',
        );
      }
      if (!appointment.dermatologistJoinedAt) {
        appointment.dermatologistJoinedAt = new Date();
      }
    }

    await this.appointmentRepository.save(appointment);
  }

  async interruptAppointment(
    userId: string,
    role: UserRole,
    appointmentId: string,
    dto: InterruptAppointmentDto,
  ): Promise<AppointmentActionResult> {
    return this.entityManager.transaction(async (manager) => {
      const appointmentRepo = manager.getRepository(Appointment);
      const appointment = await appointmentRepo.findOne({
        where: { appointmentId },
        relations: [
          'customer',
          'dermatologist',
          'payment',
          'customerSubscription',
        ],
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.appointmentStatus !== AppointmentStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Appointment is not in progress. Cannot interrupt.',
        );
      }

      if (role === UserRole.CUSTOMER) {
        const customer = await this.customersService.findByUserId(userId);
        if (appointment.customer.customerId !== customer.customerId) {
          throw new ForbiddenException('You do not own this appointment');
        }
      } else if (role === UserRole.DERMATOLOGIST) {
        const dermatologist =
          await this.dermatologistsService.findByUserId(userId);
        if (
          appointment.dermatologist.dermatologistId !==
          dermatologist.dermatologistId
        ) {
          throw new ForbiddenException(
            'You are not assigned to this appointment',
          );
        }
      }

      appointment.appointmentStatus = AppointmentStatus.INTERRUPTED;
      appointment.terminatedReason = dto.reason;
      appointment.terminationNote = dto.terminationNote;
      await appointmentRepo.save(appointment);

      const shouldRefund =
        dto.reason === TerminationReason.DOCTOR_ISSUE ||
        dto.reason === TerminationReason.PLATFORM_ISSUE;

      let refundMessage = 'Đã báo cáo gián đoạn. Không áp dụng hoàn tiền/lượt.';

      if (shouldRefund) {
        if (appointment.payment) {
          // await this.paymentsService.requestRefund(
          //   appointment.payment,
          //   Number(appointment.price),
          //   manager,
          // );
          refundMessage = 'Yêu cầu hoàn tiền đang được xử lý.';
        } else if (appointment.customerSubscription) {
          await this.customerSubscriptionService.refundSession(
            appointment.customerSubscription.id,
            manager,
          );
          refundMessage = '1 lượt khám đã được hoàn lại vào gói của bạn.';
        }
      }

      this.logger.warn(
        `Appointment ${appointmentId} was INTERRUPTED. Reason: ${dto.reason}`,
      );

      return { message: refundMessage, refundTriggered: shouldRefund };
    });
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['customer', 'dermatologist', 'payment'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId: id },
      relations: ['customer', 'dermatologist', 'payment'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async updateStatus(
    id: string,
    { status }: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.appointmentStatus = status;
    await this.appointmentRepository.save(appointment);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }

  async generateManualMeetLink(
    userId: string,
    appointmentId: string,
  ): Promise<string> {
    const dermatologist = await this.dermatologistsService.findByUserId(userId);

    const appointment = await this.appointmentRepository.findOne({
      where: {
        appointmentId,
        dermatologist: { dermatologistId: dermatologist.dermatologistId },
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found or you do not have permission.',
      );
    }

    // Check if link already exists
    if (appointment.meetingUrl) {
      return appointment.meetingUrl;
    }

    // Check appointment status (only create link for 'SCHEDULED' appointments)
    if (appointment.appointmentStatus !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Cannot create link for a non-scheduled appointment.',
      );
    }

    const meetLink = await this.googleMeetService.createMeetLinkFromDates(
      ` Skinalyze - ${appointment.appointmentId}`,
      appointment.startTime,
      appointment.endTime,
    );

    await this.appointmentRepository.update(appointmentId, {
      meetingUrl: meetLink,
    });

    return meetLink;
  }

  private async executeCancellation(
    manager: EntityManager,
    appointment: Appointment,
    reason: TerminationReason,
    shouldRefund: boolean,
  ) {
    const appointmentRepo = manager.getRepository(Appointment);

    appointment.appointmentStatus = AppointmentStatus.CANCELLED;
    appointment.terminatedReason = reason;
    await appointmentRepo.save(appointment);

    let refundMessage = '';

    if (shouldRefund) {
      if (appointment.payment) {
        // await this.paymentsService.requestRefund(
        //   appointment.payment,
        //   Number(appointment.price),
        //   manager,
        // );
        refundMessage = 'Yêu cầu hoàn tiền 100% của bạn đang được xử lý.';
      } else if (appointment.customerSubscription) {
        await this.customerSubscriptionService.refundSession(
          appointment.customerSubscription.id,
          manager,
        );
        refundMessage = '1 lượt khám đã được hoàn lại vào gói của bạn.';
      }
    } else {
      refundMessage =
        'Đã hủy lịch. Không áp dụng hoàn tiền/hoàn lượt (do hủy muộn).';
    }

    if (appointment.availabilitySlot) {
      await this.availabilitySlotsService.releaseSlot(
        appointment.availabilitySlot.slotId,
        manager,
      );
    }

    this.logger.log(
      `Appointment ${appointment.appointmentId} cancelled. Reason: ${reason}`,
    );

    return {
      message: refundMessage,
      terminatedReason: reason,
    };
  }

  private async processNoShowReport(
    appointmentId: string,
    entityId: string,
    reportingRole: UserRole,
  ): Promise<AppointmentActionResult> {
    return this.entityManager.transaction(async (manager) => {
      const appRepo = manager.getRepository(Appointment);

      const findOptions: FindOneOptions<Appointment> = {
        where: {
          appointmentId: appointmentId,
          ...(reportingRole === UserRole.CUSTOMER
            ? { customer: { customerId: entityId } }
            : { dermatologist: { dermatologistId: entityId } }),
        },
        relations: ['payment', 'customerSubscription'],
      };

      const appointment = await appRepo.findOne(findOptions);

      if (!appointment) {
        throw new NotFoundException(
          'Appointment not found or you do not own it.',
        );
      }

      if (appointment.appointmentStatus !== AppointmentStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Can only report NO-SHOW for an in-progress appointment.',
        );
      }

      // Check waiting time (Grace Period)
      if (
        new Date().getTime() <
        appointment.startTime.getTime() + this.GRACE_PERIOD_MS
      ) {
        throw new BadRequestException(
          `Cannot mark NO-SHOW before grace period (${this.GRACE_PERIOD_MS / 60000} minutes) is over.`,
        );
      }

      let terminatedReason: TerminationReason;
      let refundMessage = '';
      // BUSINESS LOGIC FOR NO-SHOW REPORTING DERMATOLOGIST
      if (reportingRole === UserRole.CUSTOMER) {
        if (!appointment.customerJoinedAt) {
          throw new BadRequestException('You must check-in first.');
        }
        if (appointment.dermatologistJoinedAt) {
          throw new BadRequestException(
            'Dermatologist has already joined this appointment.',
          );
        }

        terminatedReason = TerminationReason.DOCTOR_NO_SHOW;

        if (appointment.payment) {
          // await this.paymentsService.requestRefund(
          //   appointment.payment,
          //   Number(appointment.price),
          //   TerminationReason.DOCTOR_NO_SHOW,
          //   manager,
          // );
          refundMessage =
            'Yêu cầu hoàn tiền 100% (do bác sĩ vắng mặt) đang được xử lý.';
        } else if (appointment.customerSubscription) {
          await this.customerSubscriptionService.refundSession(
            appointment.customerSubscription.id,
            manager,
          );
          refundMessage =
            '1 lượt khám đã được hoàn lại vào gói của bạn (do bác sĩ vắng mặt).';
        }
      } else {
        // BUSINESS LOGIC FOR NO-SHOW REPORTING CUSTOMER
        if (!appointment.dermatologistJoinedAt) {
          throw new BadRequestException('You must check-in first.');
        }
        if (appointment.customerJoinedAt) {
          throw new BadRequestException(
            'Customer has already joined this appointment.',
          );
        }

        terminatedReason = TerminationReason.CUSTOMER_NO_SHOW;

        refundMessage = 'Cuộc hẹn đã được ghi nhận là khách hàng vắng mặt.';
      }

      appointment.appointmentStatus = AppointmentStatus.NO_SHOW;
      appointment.terminatedReason = terminatedReason;
      await appRepo.save(appointment);

      this.logger.log(
        `Appointment ${appointmentId} marked as ${terminatedReason} by ${reportingRole}.`,
      );

      return { message: refundMessage };
    });
  }
  async reportCustomerNoShow(
    userId: string, // userId of Dermatologist
    appointmentId: string,
  ): Promise<AppointmentActionResult> {
    const dermatologist = await this.dermatologistsService.findByUserId(userId);

    return this.processNoShowReport(
      appointmentId,
      dermatologist.dermatologistId,
      UserRole.DERMATOLOGIST,
    );
  }

  async reportDoctorNoShow(
    userId: string, // userId of Customer
    appointmentId: string,
  ): Promise<AppointmentActionResult> {
    const customer = await this.customersService.findByUserId(userId);
    return this.processNoShowReport(
      appointmentId,
      customer.customerId,
      UserRole.CUSTOMER,
    );
  }

  async cancelMyAppointment(userId: string, appointmentId: string) {
    try {
      const customer = await this.customersService.findByUserId(userId);
      return this.entityManager.transaction(async (manager) => {
        const appointmentRepo = manager.getRepository(Appointment);

        const appointment = await appointmentRepo.findOne({
          where: {
            appointmentId: appointmentId,
            customer: { customerId: customer.customerId },
          },
          relations: ['payment', 'availabilitySlot', 'customerSubscription'],
        });

        if (!appointment) {
          throw new NotFoundException(
            'Appointment not found or you do not own it.',
          );
        }

        if (appointment.appointmentStatus !== AppointmentStatus.SCHEDULED) {
          throw new BadRequestException(
            `Cannot cancel an appointment with status: ${appointment.appointmentStatus}`,
          );
        }

        const MS_IN_24_HOURS = 24 * 60 * 60 * 1000;
        const msDifference =
          appointment.startTime.getTime() - new Date().getTime();

        if (msDifference > MS_IN_24_HOURS) {
          // Early Cancel
          return this.executeCancellation(
            manager,
            appointment,
            TerminationReason.CUSTOMER_CANCELLED_EARLY,
            true,
          );
        } else {
          // Late Cancel
          return this.executeCancellation(
            manager,
            appointment,
            TerminationReason.CUSTOMER_CANCELLED_LATE,
            false,
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Error cancelling appointment ${appointmentId} for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async cancelByDermatologist(userId: string, appointmentId: string) {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);

      return this.entityManager.transaction(async (manager) => {
        const appointmentRepo = manager.getRepository(Appointment);
        const appointment = await appointmentRepo.findOne({
          where: {
            appointmentId: appointmentId,
            dermatologist: { dermatologistId: dermatologist.dermatologistId },
          },
          relations: ['payment', 'availabilitySlot', 'customerSubscription'],
        });

        if (!appointment) {
          throw new NotFoundException(
            'Appointment not found or you do not own it.',
          );
        }

        if (appointment.appointmentStatus !== AppointmentStatus.SCHEDULED) {
          throw new BadRequestException(
            `Cannot cancel an appointment with status: ${appointment.appointmentStatus}`,
          );
        }

        return this.executeCancellation(
          manager,
          appointment,
          TerminationReason.DOCTOR_CANCELLED,
          true, //
        );
      });
    } catch (error) {
      this.logger.error(
        `Error cancelling appointment ${appointmentId} by dermatologist ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Được gọi bởi PaymentsService (Cron Job) khi một thanh toán bị hết hạn.
   * Hàm này PHẢI chạy bên trong một transaction do PaymentsService khởi tạo.
   */
  async cancelExpiredReservation(
    appointmentId: string,
    manager: EntityManager,
  ): Promise<void> {
    this.logger.log(
      `Cancelling expired reservation for Appt: ${appointmentId}`,
    );

    const appRepo = manager.getRepository(Appointment);

    // 1. Update Appointment -> CANCELLED
    await appRepo.update(appointmentId, {
      appointmentStatus: AppointmentStatus.CANCELLED,
      terminatedReason: TerminationReason.PAYMENT_TIMEOUT,
    });

    // 2. Find Appointment (with Slot)
    const appointment = await appRepo.findOne({
      where: { appointmentId },
      relations: ['availabilitySlot'],
    });

    // 3. Release Slot
    if (appointment?.availabilitySlot) {
      await this.availabilitySlotsService.releaseSlot(
        appointment.availabilitySlot.slotId,
        manager,
      );
    }
  }

  // Cron Job: Run every minute to check for appointments needing Meet links
  // @Cron(CronExpression.EVERY_MINUTE)
  async handleGenerateMeetLinksCron() {
    this.logger.log(
      'Running Cron Job: Check for appointments needing Meet links...',
    );

    const now = new Date();
    const targetTime = addMinutes(now, 10);

    const appointmentsToProcess = await this.appointmentRepository.find({
      where: {
        appointmentStatus: AppointmentStatus.SCHEDULED,
        meetingUrl: IsNull(),
        startTime: Between(now, targetTime), // Start time in the next 10 minutes
      },
      relations: ['dermatologist', 'customer'], // Information for notifications
    });

    if (appointmentsToProcess.length === 0) {
      this.logger.log('Cron Job: No appointments found needing links.');
      return;
    }

    this.logger.log(
      `Cron Job: Found ${appointmentsToProcess.length} appointments to process.`,
    );

    // Generate links for each appointment
    for (const appointment of appointmentsToProcess) {
      try {
        const meetLink = await this.googleMeetService.createMeetLinkFromDates(
          `Tư vấn Skinalyze - ${appointment.appointmentId}`,
          appointment.startTime,
          appointment.endTime,
        );

        await this.appointmentRepository.update(appointment.appointmentId, {
          meetingUrl: meetLink,
        });

        // Send notification emails (if email service is set up)
        // await this.emailService.sendMeetLinkNotification(
        //   appointment.customer,
        //   appointment.dermatologist,
        //   meetLink,
        // );

        this.logger.log(
          `Generated Meet link for appointment ${appointment.appointmentId}`,
        );
      } catch (error) {
        // Log the error but continue processing other appointments
        this.logger.error(
          `Failed to process appointment ${appointment.appointmentId}: ${error.message}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCleanupEndedAppointments() {
    this.logger.log(
      'Running Cron Job: Cleaning up ended appointments (NO_SHOW check)...',
    );

    // Find appointments that ended more than 15 minutes ago and are still SCHEDULED or IN_PROGRESS
    const fifteenMinutesAgo = subMinutes(new Date(), 15);

    const stuckAppointments = await this.appointmentRepository.find({
      select: [
        'appointmentId',
        'customerJoinedAt',
        'dermatologistJoinedAt',
        'appointmentStatus',
      ],
      where: [
        {
          appointmentStatus: AppointmentStatus.SCHEDULED,
          endTime: LessThan(fifteenMinutesAgo),
        },
        {
          appointmentStatus: AppointmentStatus.IN_PROGRESS,
          endTime: LessThan(fifteenMinutesAgo),
        },
      ],
    });

    if (stuckAppointments.length === 0) {
      this.logger.log('Cron Job (Cleanup): No stuck appointments found.');
      return;
    }

    this.logger.log(
      `Cron Job (Cleanup): Found ${stuckAppointments.length} appointments to process.`,
    );

    for (const stuckAppt of stuckAppointments) {
      const hasCustomer = !!stuckAppt.customerJoinedAt;
      const hasDoctor = !!stuckAppt.dermatologistJoinedAt;

      await this.entityManager
        .transaction(async (manager) => {
          const appointment = await manager.findOne(Appointment, {
            where: { appointmentId: stuckAppt.appointmentId },
            relations: ['payment', 'customerSubscription'],
          });

          if (!appointment) {
            this.logger.error(
              `Failed to find full appointment for ID: ${stuckAppt.appointmentId}`,
            );
            return;
          }
          let shouldRefund = false;
          let reason: TerminationReason;

          if (hasCustomer && hasDoctor) {
            appointment.appointmentStatus = AppointmentStatus.COMPLETED;
            await manager.save(appointment);
            return;
          } else if (hasCustomer && !hasDoctor) {
            reason = TerminationReason.DOCTOR_NO_SHOW;
            shouldRefund = true;
          } else if (!hasCustomer && hasDoctor) {
            reason = TerminationReason.CUSTOMER_NO_SHOW;
            shouldRefund = false;
          }

          // Both no-show
          else {
            reason = TerminationReason.CUSTOMER_NO_SHOW;
            shouldRefund = false;
          }

          appointment.appointmentStatus = AppointmentStatus.NO_SHOW;
          appointment.terminatedReason = reason;
          await manager.save(appointment);

          if (shouldRefund) {
            if (appointment.payment) {
              // await this.paymentsService.requestRefund(
              //   appointment.payment,
              //   Number(appointment.price),
              //   manager,
              // );
            } else if (appointment.customerSubscription) {
              await this.customerSubscriptionService.refundSession(
                appointment.customerSubscription.id,
                manager,
              );
            }
          }

          this.logger.log(
            `Cleaned up Appt ${appointment.appointmentId}, final status: NO_SHOW, Reason: ${reason}`,
          );
        })
        .catch((error) => {
          this.logger.error(
            `Failed to cleanup Appt ${stuckAppt.appointmentId}: ${error.message}`,
          );
        });
    }
  }
}
