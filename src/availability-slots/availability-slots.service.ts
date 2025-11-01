import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  AvailabilitySlot,
  SlotStatus,
} from './entities/availability-slot.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { addMinutes, isBefore, isEqual } from 'date-fns';

@Injectable()
export class AvailabilitySlotsService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly slotRepository: Repository<AvailabilitySlot>,
  ) {}

  async createMySlots(dermatologistId: string, dto: CreateAvailabilityDto) {
    const newSlotsToCreate: Partial<AvailabilitySlot>[] = [];
    const startTimesToCheck: Date[] = [];

    for (const block of dto.blocks) {
      const start = this.parseDate(block.startTime, 'block start time');
      const blockEnd = this.parseDate(block.endTime, 'block end time');
      const duration = block.slotDurationInMinutes;

      if (blockEnd <= start) {
        throw new BadRequestException(
          'Block end time must be after block start time.',
        );
      }

      let currentSlotStart = start;

      while (isBefore(currentSlotStart, blockEnd)) {
        const currentSlotEnd = addMinutes(currentSlotStart, duration);

        if (
          isBefore(currentSlotEnd, blockEnd) ||
          isEqual(currentSlotEnd, blockEnd)
        ) {
          newSlotsToCreate.push({
            dermatologistId,
            startTime: currentSlotStart,
            endTime: currentSlotEnd,
            status: SlotStatus.AVAILABLE,
          });
          startTimesToCheck.push(currentSlotStart);
          currentSlotStart = currentSlotEnd;
        } else {
          break;
        }
      }
    }

    if (newSlotsToCreate.length === 0) {
      throw new BadRequestException('No valid slots to create.');
    }

    const existingSlots = await this.slotRepository.find({
      where: {
        dermatologistId,
        startTime: In(startTimesToCheck),
      },
    });

    if (existingSlots.length > 0) {
      throw new ConflictException(
        'One or more slots already exist at these times.',
      );
    }

    await this.slotRepository.insert(newSlotsToCreate);

    return {
      message: `Successfully created ${newSlotsToCreate.length} new slots.`,
    };
  }

  async getMySlots(
    dermatologistId: string,
    startDate: string,
    endDate: string,
  ) {
    const rangeStart = this.parseDate(startDate, 'start date');
    const rangeEnd = this.parseDate(endDate, 'end date');

    if (rangeEnd < rangeStart) {
      throw new BadRequestException('End date must be after start date.');
    }

    return this.slotRepository.find({
      where: {
        dermatologistId,
        startTime: Between(rangeStart, rangeEnd),
      },
      order: {
        startTime: 'ASC',
      },
    });
  }

  async cancelMySlot(dermatologistId: string, slotId: string) {
    const slot = await this.slotRepository.findOne({
      where: {
        slotId,
        dermatologistId,
      },
    });

    if (!slot) {
      throw new NotFoundException(
        'Slot not found or you do not have permission.',
      );
    }

    if (slot.status === SlotStatus.BOOKED) {
      throw new BadRequestException(
        'This slot is already booked by a customer. Please cancel the appointment instead.',
      );
    }

    await this.slotRepository.remove(slot);

    return { message: 'Availability slot successfully cancelled.' };
  }

  async reserveSlot(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<AvailabilitySlot> {
    const slot = await this.ensureSlotAvailability(
      dermatologistId,
      startTimeIso,
      endTimeIso,
    );

    const updateResult = await this.slotRepository.update(
      { slotId: slot.slotId, status: SlotStatus.AVAILABLE },
      { status: SlotStatus.BOOKED },
    );

    if (!updateResult.affected) {
      throw new ConflictException('Requested slot is no longer available.');
    }

    return slot;
  }

  async linkSlotToAppointment(slotId: string, appointmentId: string) {
    await this.slotRepository.update(slotId, { appointmentId });
  }

  async releaseSlot(slotId: string) {
    await this.slotRepository.update(slotId, {
      status: SlotStatus.AVAILABLE,
      appointmentId: null,
    });
  }

  async releaseSlotByAppointment(appointmentId: string) {
    if (!appointmentId) {
      return;
    }

    const slot = await this.slotRepository.findOne({
      where: { appointmentId },
    });

    if (!slot) {
      return;
    }

    await this.releaseSlot(slot.slotId);
  }

  private async ensureSlotAvailability(
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<AvailabilitySlot> {
    const { start, end } = this.getValidatedRange(startTimeIso, endTimeIso);

    const slot = await this.slotRepository.findOne({
      where: {
        dermatologistId,
        startTime: start,
      },
    });

    if (!slot) {
      throw new NotFoundException('Requested slot does not exist.');
    }

    if (slot.endTime.getTime() !== end.getTime()) {
      throw new BadRequestException(
        'Requested time range does not match the slot duration.',
      );
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new ConflictException('Requested slot is no longer available.');
    }

    return slot;
  }

  private parseDate(value: string, context: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${context} provided.`);
    }

    return parsed;
  }

  private getValidatedRange(startIso: string, endIso: string) {
    const start = this.parseDate(startIso, 'start time');
    const end = this.parseDate(endIso, 'end time');

    if (end <= start) {
      throw new BadRequestException('End time must be after start time.');
    }

    return { start, end };
  }
}
