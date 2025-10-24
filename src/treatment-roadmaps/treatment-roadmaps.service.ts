import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTreatmentRoadmapDto } from './dto/create-treatment-roadmap.dto';
import { UpdateTreatmentRoadmapDto } from './dto/update-treatment-roadmap.dto';
import { TreatmentRoadmap } from './entities/treatment-roadmap.entity';
import { Dermatologist } from '../dermatologists/entities/dermatologist.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class TreatmentRoadmapsService {
  constructor(
    @InjectRepository(TreatmentRoadmap)
    private treatmentRoadmapRepository: Repository<TreatmentRoadmap>,
    @InjectRepository(Dermatologist)
    private dermatologistRepository: Repository<Dermatologist>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    createTreatmentRoadmapDto: CreateTreatmentRoadmapDto,
  ): Promise<TreatmentRoadmap> {
    // Validate dermatologist exists
    const dermatologist = await this.dermatologistRepository.findOne({
      where: { dermatologistId: createTreatmentRoadmapDto.dermatologistId },
    });
    if (!dermatologist) {
      throw new BadRequestException(
        `Dermatologist with ID ${createTreatmentRoadmapDto.dermatologistId} not found`,
      );
    }

    // Validate customer exists
    const customer = await this.customerRepository.findOne({
      where: { customerId: createTreatmentRoadmapDto.customerId },
    });
    if (!customer) {
      throw new BadRequestException(
        `Customer with ID ${createTreatmentRoadmapDto.customerId} not found`,
      );
    }

    // Validate appointment exists if provided
    if (createTreatmentRoadmapDto.appointmentId) {
      const appointment = await this.appointmentRepository.findOne({
        where: { appointmentId: createTreatmentRoadmapDto.appointmentId },
      });
      if (!appointment) {
        throw new BadRequestException(
          `Appointment with ID ${createTreatmentRoadmapDto.appointmentId} not found`,
        );
      }
    }

    const roadmap = this.treatmentRoadmapRepository.create(
      createTreatmentRoadmapDto,
    );
    return await this.treatmentRoadmapRepository.save(roadmap);
  }

  async findAll(): Promise<TreatmentRoadmap[]> {
    return await this.treatmentRoadmapRepository.find({
      relations: ['dermatologist', 'customer', 'appointment', 'roadmapDetails'],
    });
  }

  async findOne(id: string): Promise<TreatmentRoadmap> {
    const roadmap = await this.treatmentRoadmapRepository.findOne({
      where: { roadmapId: id },
      relations: ['dermatologist', 'customer', 'appointment', 'roadmapDetails'],
    });

    if (!roadmap) {
      throw new NotFoundException(`Treatment Roadmap with ID ${id} not found`);
    }

    return roadmap;
  }

  async findByDermatologist(
    dermatologistId: string,
  ): Promise<TreatmentRoadmap[]> {
    return await this.treatmentRoadmapRepository.find({
      where: { dermatologistId },
      relations: ['customer', 'appointment', 'roadmapDetails'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: string): Promise<TreatmentRoadmap[]> {
    return await this.treatmentRoadmapRepository.find({
      where: { customerId },
      relations: ['dermatologist', 'appointment', 'roadmapDetails'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateTreatmentRoadmapDto: UpdateTreatmentRoadmapDto,
  ): Promise<TreatmentRoadmap> {
    const roadmap = await this.findOne(id);

    Object.assign(roadmap, updateTreatmentRoadmapDto);

    return await this.treatmentRoadmapRepository.save(roadmap);
  }

  async remove(id: string): Promise<void> {
    const roadmap = await this.findOne(id);
    await this.treatmentRoadmapRepository.remove(roadmap);
  }
}
