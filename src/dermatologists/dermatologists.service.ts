import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dermatologist } from './entities/dermatologist.entity';
import {
  CreateDermatologistDto,
  UpdateDermatologistDto,
} from './dto/create-dermatologist.dto';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailabilityResponseDto,
  AvailabilityStatus,
} from './dto/availability.dto';

@Injectable()
export class DermatologistsService {
  constructor(
    @InjectRepository(Dermatologist)
    private dermatologistRepository: Repository<Dermatologist>,
  ) {}

  // CRUD for Dermatologist
  async create(
    createDermatologistDto: CreateDermatologistDto,
  ): Promise<Dermatologist> {
    const dermatologist = this.dermatologistRepository.create(
      createDermatologistDto,
    );
    return await this.dermatologistRepository.save(dermatologist);
  }

  async findAll(): Promise<Dermatologist[]> {
    return await this.dermatologistRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Dermatologist> {
    const dermatologist = await this.dermatologistRepository.findOne({
      where: { dermatologistId: id },
      relations: ['user'],
    });

    if (!dermatologist) {
      throw new NotFoundException(`Dermatologist with ID ${id} not found`);
    }

    return dermatologist;
  }

  async update(
    id: string,
    updateDermatologistDto: UpdateDermatologistDto,
  ): Promise<Dermatologist> {
    const dermatologist = await this.findOne(id);
    Object.assign(dermatologist, updateDermatologistDto);
    return await this.dermatologistRepository.save(dermatologist);
  }

  async remove(id: string): Promise<void> {
    const dermatologist = await this.findOne(id);
    await this.dermatologistRepository.remove(dermatologist);
  }

  // Availability Management
  async createAvailability(
    dermatologistId: string,
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const dermatologist = await this.findOne(dermatologistId);

    if (!dermatologist.availability) {
      dermatologist.availability = [];
    }

    // Check if availability for this date already exists
    const existingIndex = dermatologist.availability.findIndex(
      (avail: any) => avail.date === createAvailabilityDto.date,
    );

    const newAvailability = {
      date: createAvailabilityDto.date,
      timeSlots: createAvailabilityDto.timeSlots,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      throw new BadRequestException(
        `Availability for date ${createAvailabilityDto.date} already exists`,
      );
    }

    dermatologist.availability.push(newAvailability);
    await this.dermatologistRepository.save(dermatologist);

    return {
      ...newAvailability,
      dermatologistId: dermatologist.dermatologistId,
    };
  }

  async getAvailability(
    dermatologistId: string,
    date?: string,
  ): Promise<AvailabilityResponseDto[]> {
    const dermatologist = await this.findOne(dermatologistId);

    if (!dermatologist.availability) {
      return [];
    }

    let availabilities = dermatologist.availability;

    if (date) {
      availabilities = availabilities.filter(
        (avail: any) => avail.date === date,
      );
    }

    return availabilities.map((avail: any) => ({
      ...avail,
      dermatologistId: dermatologist.dermatologistId,
    }));
  }

  async updateAvailability(
    dermatologistId: string,
    date: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const dermatologist = await this.findOne(dermatologistId);

    if (!dermatologist.availability) {
      throw new NotFoundException(
        `No availability found for dermatologist ${dermatologistId}`,
      );
    }

    const existingIndex = dermatologist.availability.findIndex(
      (avail: any) => avail.date === date,
    );

    if (existingIndex === -1) {
      throw new NotFoundException(`Availability for date ${date} not found`);
    }

    const updatedAvailability = {
      ...dermatologist.availability[existingIndex],
      ...updateAvailabilityDto,
      updatedAt: new Date(),
    };

    dermatologist.availability[existingIndex] = updatedAvailability;
    await this.dermatologistRepository.save(dermatologist);

    return {
      ...updatedAvailability,
      dermatologistId: dermatologist.dermatologistId,
    };
  }

  async deleteAvailability(
    dermatologistId: string,
    date: string,
  ): Promise<void> {
    const dermatologist = await this.findOne(dermatologistId);

    if (!dermatologist.availability) {
      throw new NotFoundException(
        `No availability found for dermatologist ${dermatologistId}`,
      );
    }

    const filteredAvailability = dermatologist.availability.filter(
      (avail: any) => avail.date !== date,
    );

    if (filteredAvailability.length === dermatologist.availability.length) {
      throw new NotFoundException(`Availability for date ${date} not found`);
    }

    dermatologist.availability = filteredAvailability;
    await this.dermatologistRepository.save(dermatologist);
  }

  // Helper method to check if dermatologist is available at specific time
  async checkAvailabilityAtTime(
    dermatologistId: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const availabilities = await this.getAvailability(dermatologistId, date);

    if (availabilities.length === 0) {
      return false;
    }

    const dayAvailability = availabilities[0];
    const requestedTime = new Date(`${date}T${time}`);

    return dayAvailability.timeSlots.some((slot) => {
      const startTime = new Date(`${date}T${slot.startTime.split('T')[1]}`);
      const endTime = new Date(`${date}T${slot.endTime.split('T')[1]}`);

      return (
        slot.status === AvailabilityStatus.AVAILABLE &&
        requestedTime >= startTime &&
        requestedTime < endTime
      );
    });
  }
}
