import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
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
    try {
      const dermatologist = this.dermatologistRepository.create(
        createDermatologistDto,
      );
      return await this.dermatologistRepository.save(dermatologist);
    } catch (error) {
      this.handleError(error, 'Failed to create dermatologist');
    }
  }

  async findAll(): Promise<Dermatologist[]> {
    try {
      return await this.dermatologistRepository.find({
        relations: ['user'],
      });
    } catch (error) {
      this.handleError(error, 'Failed to retrieve dermatologists');
    }
  }

  async findOne(id: string): Promise<Dermatologist> {
    try {
      const dermatologist = await this.dermatologistRepository.findOne({
        where: { dermatologistId: id },
        relations: ['user'],
      });

      if (!dermatologist) {
        throw new NotFoundException(`Dermatologist with ID ${id} not found`);
      }

      return dermatologist;
    } catch (error) {
      this.handleError(error, `Failed to load dermatologist ${id}`);
    }
  }

  async findByUserId(userId: string): Promise<Dermatologist> {
    try {
      const dermatologist = await this.dermatologistRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      if (!dermatologist) {
        throw new NotFoundException(
          `Dermatologist profile for user ${userId} not found`,
        );
      }

      return dermatologist;
    } catch (error) {
      this.handleError(
        error,
        `Failed to load dermatologist for user ${userId}`,
      );
    }
  }

  async update(
    id: string,
    updateDermatologistDto: UpdateDermatologistDto,
  ): Promise<Dermatologist> {
    try {
      const dermatologist = await this.findOne(id);
      Object.assign(dermatologist, updateDermatologistDto);
      return await this.dermatologistRepository.save(dermatologist);
    } catch (error) {
      this.handleError(error, `Failed to update dermatologist ${id}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const dermatologist = await this.findOne(id);
      await this.dermatologistRepository.remove(dermatologist);
    } catch (error) {
      this.handleError(error, `Failed to remove dermatologist ${id}`);
    }
  }

  // Availability Management
  async createAvailability(
    dermatologistId: string,
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    try {
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
    } catch (error) {
      this.handleError(
        error,
        `Failed to create availability for dermatologist ${dermatologistId}`,
      );
    }
  }

  async getAvailability(
    dermatologistId: string,
    date?: string,
  ): Promise<AvailabilityResponseDto[]> {
    try {
      const dermatologist = await this.findOne(dermatologistId);

      const availabilityList = this.getAvailabilityList(dermatologist);

      const filtered = date
        ? availabilityList.filter((availability) => availability.date === date)
        : availabilityList;

      return filtered.map((availability) =>
        this.toAvailabilityResponse(
          dermatologist.dermatologistId,
          availability,
        ),
      );
    } catch (error) {
      this.handleError(
        error,
        `Failed to retrieve availability for dermatologist ${dermatologistId}`,
      );
    }
  }

  async updateAvailability(
    dermatologistId: string,
    date: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    try {
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
    } catch (error) {
      this.handleError(
        error,
        `Failed to update availability for dermatologist ${dermatologistId}`,
      );
    }
  }

  async deleteAvailability(
    dermatologistId: string,
    date: string,
  ): Promise<void> {
    try {
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
    } catch (error) {
      this.handleError(
        error,
        `Failed to delete availability for dermatologist ${dermatologistId}`,
      );
    }
  }

  async markSlotAsOccupied(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<void> {
    try {
      await this.updateSlotStatus(
        dermatologistId,
        startTimeIso,
        endTimeIso,
        AvailabilityStatus.AVAILABLE,
        AvailabilityStatus.OCCUPIED,
      );
    } catch (error) {
      this.handleError(error, 'Failed to mark dermatologist slot as occupied');
    }
  }

  async markSlotAsAvailable(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<void> {
    try {
      await this.updateSlotStatus(
        dermatologistId,
        startTimeIso,
        endTimeIso,
        AvailabilityStatus.OCCUPIED,
        AvailabilityStatus.AVAILABLE,
      );
    } catch (error) {
      this.handleError(error, 'Failed to mark dermatologist slot as available');
    }
  }

  // Helper method to check if dermatologist is available at specific time
  async checkAvailabilityAtTime(
    dermatologistId: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    try {
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
    } catch (error) {
      this.handleError(
        error,
        `Failed to check availability for dermatologist ${dermatologistId}`,
      );
    }
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

  private handleError(error: unknown, message: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(message);
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
