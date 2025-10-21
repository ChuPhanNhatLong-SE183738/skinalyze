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

type StoredAvailabilitySlot = {
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  note?: string;
};

type StoredAvailability = {
  date: string;
  timeSlots: StoredAvailabilitySlot[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

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

    const availabilityList = this.getAvailabilityList(dermatologist);

    const newAvailability: StoredAvailability = {
      date: createAvailabilityDto.date,
      timeSlots: createAvailabilityDto.timeSlots,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (
      availabilityList.some(
        (availability) => availability.date === createAvailabilityDto.date,
      )
    ) {
      throw new BadRequestException(
        `Availability for date ${createAvailabilityDto.date} already exists`,
      );
    }

    dermatologist.availability = [...availabilityList, newAvailability];
    await this.dermatologistRepository.save(dermatologist);

    return this.toAvailabilityResponse(
      dermatologist.dermatologistId,
      newAvailability,
    );
  }

  async getAvailability(
    dermatologistId: string,
    date?: string,
  ): Promise<AvailabilityResponseDto[]> {
    const dermatologist = await this.findOne(dermatologistId);

    const availabilityList = this.getAvailabilityList(dermatologist);

    const filtered = date
      ? availabilityList.filter((availability) => availability.date === date)
      : availabilityList;

    return filtered.map((availability) =>
      this.toAvailabilityResponse(dermatologist.dermatologistId, availability),
    );
  }

  async updateAvailability(
    dermatologistId: string,
    date: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const dermatologist = await this.findOne(dermatologistId);

    const availabilityList = this.getAvailabilityList(dermatologist);

    if (availabilityList.length === 0) {
      throw new NotFoundException(
        `No availability found for dermatologist ${dermatologistId}`,
      );
    }

    const existingIndex = availabilityList.findIndex(
      (availability) => availability.date === date,
    );

    if (existingIndex === -1) {
      throw new NotFoundException(`Availability for date ${date} not found`);
    }

    const existingAvailability = availabilityList[existingIndex];
    const updatedAvailability: StoredAvailability = {
      ...existingAvailability,
      date: updateAvailabilityDto.date ?? existingAvailability.date,
      timeSlots:
        (updateAvailabilityDto.timeSlots as StoredAvailabilitySlot[]) ??
        existingAvailability.timeSlots,
      createdAt: existingAvailability.createdAt,
      updatedAt: new Date(),
    };

    const nextAvailability = [...availabilityList];
    nextAvailability[existingIndex] = updatedAvailability;
    dermatologist.availability = nextAvailability;
    await this.dermatologistRepository.save(dermatologist);

    return this.toAvailabilityResponse(
      dermatologist.dermatologistId,
      updatedAvailability,
    );
  }

  async deleteAvailability(
    dermatologistId: string,
    date: string,
  ): Promise<void> {
    const dermatologist = await this.findOne(dermatologistId);

    const availabilityList = this.getAvailabilityList(dermatologist);

    if (availabilityList.length === 0) {
      throw new NotFoundException(
        `No availability found for dermatologist ${dermatologistId}`,
      );
    }

    const filteredAvailability = availabilityList.filter(
      (availability) => availability.date !== date,
    );

    if (filteredAvailability.length === availabilityList.length) {
      throw new NotFoundException(`Availability for date ${date} not found`);
    }

    dermatologist.availability = filteredAvailability;
    await this.dermatologistRepository.save(dermatologist);
  }

  async markSlotAsOccupied(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<void> {
    await this.updateSlotStatus(
      dermatologistId,
      startTimeIso,
      endTimeIso,
      AvailabilityStatus.AVAILABLE,
      AvailabilityStatus.OCCUPIED,
    );
  }

  async markSlotAsAvailable(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<void> {
    await this.updateSlotStatus(
      dermatologistId,
      startTimeIso,
      endTimeIso,
      AvailabilityStatus.OCCUPIED,
      AvailabilityStatus.AVAILABLE,
    );
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

  private async findAvailabilitySlotOrThrow(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
    expectedStatus: AvailabilityStatus,
  ): Promise<{
    dermatologist: Dermatologist;
    availabilityIndex: number;
    slotIndex: number;
  }> {
    const dermatologist = await this.findOne(dermatologistId);

    const availabilityList = this.getAvailabilityList(dermatologist);

    if (availabilityList.length === 0) {
      throw new BadRequestException(
        `Dermatologist ${dermatologistId} has no availability configured`,
      );
    }

    const startTimeMs = this.parseIsoToMillis(startTimeIso, 'start time');
    const endTimeMs = this.parseIsoToMillis(endTimeIso, 'end time');

    if (endTimeMs <= startTimeMs) {
      throw new BadRequestException(
        'Availability end time must be after start time',
      );
    }

    const dateKey = startTimeIso.split('T')[0];
    const availabilityIndex = availabilityList.findIndex(
      (availability) => availability.date === dateKey,
    );

    if (availabilityIndex === -1) {
      throw new BadRequestException(
        `Dermatologist is not available on ${dateKey}`,
      );
    }

    const availability = availabilityList[availabilityIndex];

    const slotIndex = availability.timeSlots.findIndex((slot) => {
      if (!slot.startTime || !slot.endTime) {
        return false;
      }

      const slotStartMs = this.parseIsoToMillis(slot.startTime, 'slot start');
      const slotEndMs = this.parseIsoToMillis(slot.endTime, 'slot end');

      return (
        slot.status === expectedStatus &&
        slotStartMs === startTimeMs &&
        slotEndMs === endTimeMs
      );
    });

    if (slotIndex === -1) {
      const statusLabel =
        expectedStatus === AvailabilityStatus.AVAILABLE
          ? 'available'
          : 'occupied';

      throw new BadRequestException(
        `Requested availability slot is not ${statusLabel} anymore`,
      );
    }

    return { dermatologist, availabilityIndex, slotIndex };
  }

  private parseIsoToMillis(value: string, context: string): number {
    const parsed = new Date(value).getTime();

    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`Invalid ${context} provided`);
    }

    return parsed;
  }

  private getAvailabilityList(
    dermatologist: Dermatologist,
  ): StoredAvailability[] {
    return Array.isArray(dermatologist.availability)
      ? (dermatologist.availability as StoredAvailability[])
      : [];
  }

  private toAvailabilityResponse(
    dermatologistId: string,
    availability: StoredAvailability,
  ): AvailabilityResponseDto {
    return {
      date: availability.date,
      timeSlots: availability.timeSlots,
      dermatologistId,
      createdAt: new Date(availability.createdAt ?? new Date()),
      updatedAt: new Date(availability.updatedAt ?? new Date()),
    };
  }

  private async updateSlotStatus(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
    expectedStatus: AvailabilityStatus,
    nextStatus: AvailabilityStatus,
  ): Promise<void> {
    const { dermatologist, availabilityIndex, slotIndex } =
      await this.findAvailabilitySlotOrThrow(
        dermatologistId,
        startTimeIso,
        endTimeIso,
        expectedStatus,
      );

    const currentAvailability = this.getAvailabilityList(dermatologist);
    const updatedAvailability = [...currentAvailability];
    const availability = updatedAvailability[availabilityIndex];

    updatedAvailability[availabilityIndex] = {
      ...availability,
      timeSlots: availability.timeSlots.map((slot, index) =>
        index === slotIndex ? { ...slot, status: nextStatus } : slot,
      ),
      updatedAt: new Date(),
    };

    dermatologist.availability = updatedAvailability;
    await this.dermatologistRepository.save(dermatologist);
  }
}
