import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between, IsNull } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
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
import { addMinutes } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface AppointmentReservationResult {
  appointmentId: string;
  paymentCode: string;
  amount: number;
  expiredAt: Date;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly customersService: CustomersService,
    private readonly dermatologistsService: DermatologistsService,
    private readonly availabilitySlotsService: AvailabilitySlotsService,
    private readonly paymentsService: PaymentsService,
    private readonly googleMeetService: GoogleMeetService,
    private readonly entityManager: EntityManager,
  ) {}

  async createReservation(
    userId: string,
    createDto: CreateAppointmentDto,
  ): Promise<AppointmentReservationResult> {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found for this user.');
    }

    // 2. Bọc toàn bộ logic trong một DB Transaction
    return this.entityManager.transaction(async (manager) => {
      const appointmentRepo = manager.getRepository(Appointment);

      // 3. (Atomic) Khóa Khe Thời Gian
      const reservedSlot = await this.availabilitySlotsService.reserveSlot(
        createDto.dermatologistId,
        createDto.startTime,
        createDto.endTime,
        manager,
      );

      // 4. Create Pending Payment
      const payment = await this.paymentsService.createPayment(
        {
          paymentType: PaymentType.BOOKING,
          amount: reservedSlot.price,
          customerId: customer.customerId,
          userId: userId,
        },
        manager,
      );

      // 5. Create Pending Appointment
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

      // 6. Update the reverse relationships (complete 1:1)
      await this.availabilitySlotsService.linkSlotToAppointment(
        reservedSlot.slotId,
        savedAppointment.appointmentId,
        manager,
      );

      // 8. Return payment information to client
      return {
        appointmentId: savedAppointment.appointmentId,
        paymentCode: payment.paymentCode,
        amount: payment.amount,
        expiredAt: payment.expiredAt,
        // qrCodeUrl: `https"//img.vietqr.io/image/MB-YOUR_BANK_ACCOUNT-compact2.png?amount=${payment.amount}&addInfo=${payment.paymentCode}`,
      };
    }); // 9. KẾT THÚC TRANSACTION (Tự động Commit hoặc Rollback)
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

  @Cron(CronExpression.EVERY_MINUTE) // Run every minute
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
        // Ghi log lỗi cho từng cuộc hẹn nhưng không dừng vòng lặp
        this.logger.error(
          `Failed to process appointment ${appointment.appointmentId}: ${error.message}`,
        );
      }
    }
  }
}
