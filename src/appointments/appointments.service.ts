import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { CustomersService } from '../customers/customers.service';
import { DermatologistsService } from '../dermatologists/dermatologists.service';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly customersService: CustomersService,
    private readonly dermatologistsService: DermatologistsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(createDto: CreateAppointmentDto): Promise<Appointment> {
    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time provided');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    await Promise.all([
      this.customersService.findOne(createDto.customerId),
      this.dermatologistsService.findOne(createDto.dermatologistId),
    ]);

    const transaction = await this.transactionsService.findOne(
      createDto.transactionId,
    );

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Payment must be completed before booking an appointment',
      );
    }

    const overlapping = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.dermatologistId = :dermatologistId', {
        dermatologistId: createDto.dermatologistId,
      })
      .andWhere(
        '(appointment.startTime < :endTime AND appointment.endTime > :startTime)',
        { startTime, endTime },
      )
      .getExists();

    if (overlapping) {
      throw new ConflictException(
        'Dermatologist already has an appointment within this time range',
      );
    }

    const appointment = this.appointmentRepository.create({
      ...createDto,
      startTime,
      endTime,
      appointmentStatus: AppointmentStatus.PENDING_PAYMENT,
    });

    let savedAppointment: Appointment | undefined;
    let slotReserved = false;

    try {
      await this.dermatologistsService.markSlotAsOccupied(
        createDto.dermatologistId,
        createDto.startTime,
        createDto.endTime,
      );
      slotReserved = true;

      savedAppointment = await this.appointmentRepository.save(appointment);
    } catch (error) {
      if (savedAppointment?.appointmentId) {
        await this.appointmentRepository.delete(savedAppointment.appointmentId);
      }

      if (slotReserved) {
        try {
          await this.dermatologistsService.markSlotAsAvailable(
            createDto.dermatologistId,
            createDto.startTime,
            createDto.endTime,
          );
        } catch {
          // swallow release errors to preserve original exception context
        }
      }

      throw error;
    }

    return this.findOne(savedAppointment.appointmentId);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['customer', 'dermatologist', 'transaction'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId: id },
      relations: ['customer', 'dermatologist', 'transaction'],
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
}
