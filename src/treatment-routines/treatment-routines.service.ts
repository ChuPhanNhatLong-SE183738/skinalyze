import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTreatmentRoutineDto } from './dto/create-treatment-routine.dto';
import { UpdateTreatmentRoutineDto } from './dto/update-treatment-routine.dto';
import {
  TreatmentRoutine,
  RoutineStatus,
} from './entities/treatment-routine.entity';
import { Dermatologist } from '../dermatologists/entities/dermatologist.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SkinAnalysis } from '../skin-analysis/entities/skin-analysis.entity';

@Injectable()
export class TreatmentRoutinesService {
  constructor(
    @InjectRepository(TreatmentRoutine)
    private readonly treatmentRoutineRepository: Repository<TreatmentRoutine>,
    @InjectRepository(Dermatologist)
    private readonly dermatologistRepository: Repository<Dermatologist>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(SkinAnalysis)
    private readonly skinAnalysisRepository: Repository<SkinAnalysis>,
  ) {}

  async create(
    createTreatmentRoutineDto: CreateTreatmentRoutineDto,
  ): Promise<TreatmentRoutine> {
    const {
      dermatologistId,
      customerId,
      originalAnalysisId,
      createdFromAppointmentId,
      status,
      routineName,
    } = createTreatmentRoutineDto;

    // Validate dermatologist exists
    const dermatologist = await this.dermatologistRepository.findOne({
      where: { dermatologistId },
    });
    if (!dermatologist) {
      throw new BadRequestException(
        `Dermatologist with ID ${dermatologistId} not found`,
      );
    }

    // Validate customer exists
    const customer = await this.customerRepository.findOne({
      where: { customerId },
    });
    if (!customer) {
      throw new BadRequestException(`Customer with ID ${customerId} not found`);
    }

    let originalAnalysis: SkinAnalysis | null = null;
    if (originalAnalysisId) {
      originalAnalysis = await this.skinAnalysisRepository.findOne({
        where: { analysisId: originalAnalysisId },
      });

      if (!originalAnalysis) {
        throw new BadRequestException(
          `Skin analysis with ID ${originalAnalysisId} not found`,
        );
      }
    }

    let createdFromAppointment: Appointment | null = null;

    // Validate appointment exists if provided
    if (createdFromAppointmentId) {
      createdFromAppointment = await this.appointmentRepository.findOne({
        where: { appointmentId: createdFromAppointmentId },
      });
      if (!createdFromAppointment) {
        throw new BadRequestException(
          `Appointment with ID ${createdFromAppointmentId} not found`,
        );
      }
    }

    const routine = this.treatmentRoutineRepository.create({
      routineName,
      status: status ?? RoutineStatus.ACTIVE,
      dermatologist,
      customer,
    });

    if (originalAnalysis) {
      routine.originalAnalysis = originalAnalysis;
    }

    if (createdFromAppointment) {
      routine.createdFromAppointment = createdFromAppointment;
    }
    return await this.treatmentRoutineRepository.save(routine);
  }

  async findAll(): Promise<TreatmentRoutine[]> {
    return await this.treatmentRoutineRepository.find({
      relations: [
        'dermatologist',
        'customer',
        'originalAnalysis',
        'createdFromAppointment',
        'followUpAppointments',
        'routineDetails',
      ],
    });
  }

  async findOne(id: string): Promise<TreatmentRoutine> {
    const routine = await this.treatmentRoutineRepository.findOne({
      where: { routineId: id },
      relations: [
        'dermatologist',
        'customer',
        'originalAnalysis',
        'createdFromAppointment',
        'followUpAppointments',
        'routineDetails',
      ],
    });

    if (!routine) {
      throw new NotFoundException(`Treatment Routine with ID ${id} not found`);
    }

    return routine;
  }

  async findByDermatologist(
    dermatologistId: string,
  ): Promise<TreatmentRoutine[]> {
    return await this.treatmentRoutineRepository.find({
      where: { dermatologist: { dermatologistId } },
      relations: [
        'customer',
        'originalAnalysis',
        'createdFromAppointment',
        'routineDetails',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: string): Promise<TreatmentRoutine[]> {
    return await this.treatmentRoutineRepository.find({
      where: { customer: { customerId } },
      relations: [
        'dermatologist',
        'originalAnalysis',
        'createdFromAppointment',
        'routineDetails',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateTreatmentRoutineDto: UpdateTreatmentRoutineDto,
  ): Promise<TreatmentRoutine> {
    const routine = await this.findOne(id);

    if (updateTreatmentRoutineDto.routineName) {
      routine.routineName = updateTreatmentRoutineDto.routineName;
    }

    if (updateTreatmentRoutineDto.status) {
      routine.status = updateTreatmentRoutineDto.status;
    }

    if (updateTreatmentRoutineDto.dermatologistId) {
      const dermatologist = await this.dermatologistRepository.findOne({
        where: { dermatologistId: updateTreatmentRoutineDto.dermatologistId },
      });
      if (!dermatologist) {
        throw new BadRequestException(
          `Dermatologist with ID ${updateTreatmentRoutineDto.dermatologistId} not found`,
        );
      }
      routine.dermatologist = dermatologist;
    }

    if (updateTreatmentRoutineDto.customerId) {
      const customer = await this.customerRepository.findOne({
        where: { customerId: updateTreatmentRoutineDto.customerId },
      });
      if (!customer) {
        throw new BadRequestException(
          `Customer with ID ${updateTreatmentRoutineDto.customerId} not found`,
        );
      }
      routine.customer = customer;
    }

    if (updateTreatmentRoutineDto.originalAnalysisId) {
      const originalAnalysis = await this.skinAnalysisRepository.findOne({
        where: { analysisId: updateTreatmentRoutineDto.originalAnalysisId },
      });
      if (!originalAnalysis) {
        throw new BadRequestException(
          `Skin analysis with ID ${updateTreatmentRoutineDto.originalAnalysisId} not found`,
        );
      }
      routine.originalAnalysis = originalAnalysis;
    }

    if (updateTreatmentRoutineDto.createdFromAppointmentId) {
      const appointment = await this.appointmentRepository.findOne({
        where: {
          appointmentId: updateTreatmentRoutineDto.createdFromAppointmentId,
        },
      });
      if (!appointment) {
        throw new BadRequestException(
          `Appointment with ID ${updateTreatmentRoutineDto.createdFromAppointmentId} not found`,
        );
      }
      routine.createdFromAppointment = appointment;
    }

    return await this.treatmentRoutineRepository.save(routine);
  }

  async remove(id: string): Promise<void> {
    const routine = await this.findOne(id);
    await this.treatmentRoutineRepository.remove(routine);
  }
}
