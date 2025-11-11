import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  FindOperator,
  FindOptionsWhere,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';
import {
  AvailabilitySlot,
  SlotStatus,
} from './entities/availability-slot.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { addMinutes, isBefore, isEqual } from 'date-fns';

type NewSlotData = {
  dermatologistId: string;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  price: number;
};
@Injectable()
export class AvailabilitySlotsService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly slotRepository: Repository<AvailabilitySlot>,
  ) {}

  private getRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(AvailabilitySlot)
      : this.slotRepository;
  }

  async createMySlots(
    dermatologistId: string,
    defaultSlotPrice: number,
    dto: CreateAvailabilityDto,
  ) {
    const newSlotsToCreate: NewSlotData[] = [];
    const startTimesToCheck: Date[] = [];

    for (const block of dto.blocks) {
      const start = this.parseDate(block.startTime, 'block start time');
      const blockEnd = this.parseDate(block.endTime, 'block end time');
      const duration = block.slotDurationInMinutes;
      const priceForThisBlock = block.price ?? defaultSlotPrice;
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
            price: priceForThisBlock,
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

    //Check overlap: (OldStart < NewEnd) AND (OldEnd > NewStart)
    const overlapConditions: FindOptionsWhere<AvailabilitySlot>[] =
      newSlotsToCreate.map((newSlot) => {
        return {
          dermatologistId: dermatologistId,
          startTime: LessThan(newSlot.endTime), // OldStart < NewEnd
          endTime: MoreThan(newSlot.startTime), // OldEnd > NewStart
        };
      });

    // Find slots that overlap with any of the new slots
    const existingOverlaps = await this.slotRepository.find({
      where: overlapConditions, // OR conditions (typeorm handles this automatically)
    });

    if (existingOverlaps.length > 0) {
      throw new ConflictException(
        'One or more new slots overlap with existing time slots.',
      );
    }

    try {
      await this.slotRepository.insert(newSlotsToCreate);
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.number === 1062) {
        throw new ConflictException(
          'A race condition occurred. One or more slots already exist.',
        );
      }
      throw error;
    }
    return {
      message: `Successfully created ${newSlotsToCreate.length} new slots.`,
    };
  }

  async getMySlots(
    dermatologistId: string,
    startDate?: string,
    endDate?: string,
    status?: SlotStatus,
  ) {
    let dateRangeFilter: FindOperator<Date> | undefined;

    if (startDate && endDate) {
      const rangeStart = this.parseDate(startDate, 'start date');
      const rangeEnd = this.parseDate(endDate, 'end date');

      if (rangeEnd < rangeStart) {
        throw new BadRequestException('End date must be after start date.');
      }

      dateRangeFilter = Between(rangeStart, rangeEnd);
    } else if (startDate || endDate) {
      throw new BadRequestException(
        'Both startDate and endDate are required when filtering by range.',
      );
    }

    const where: Record<string, unknown> = {
      dermatologistId,
    };

    if (dateRangeFilter) {
      where.startTime = dateRangeFilter;
    }

    if (status) {
      where.status = status;
    }

    return this.slotRepository.find({
      where,
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
    manager?: EntityManager,
  ): Promise<AvailabilitySlot> {
    const repository = this.getRepository(manager);
    const slot = await this.ensureSlotAvailability(
      repository,
      dermatologistId,
      startTimeIso,
      endTimeIso,
    );

    const updateResult = await repository.update(
      { slotId: slot.slotId, status: SlotStatus.AVAILABLE },
      { status: SlotStatus.BOOKED },
    );

    if (!updateResult.affected) {
      throw new ConflictException('Requested slot is no longer available.');
    }

    slot.status = SlotStatus.BOOKED;
    return slot;
  }

  async linkSlotToAppointment(
    slotId: string,
    appointmentId: string,
    manager?: EntityManager,
  ) {
    const repository = this.getRepository(manager);
    await repository.update(slotId, { appointmentId });
  }

  async releaseSlot(slotId: string, manager?: EntityManager) {
    const repository = this.getRepository(manager);
    await repository.update(slotId, {
      status: SlotStatus.AVAILABLE,
      appointmentId: null,
    });
  }

  async releaseSlotByAppointment(
    appointmentId: string,
    manager?: EntityManager,
  ) {
    if (!appointmentId) {
      return;
    }

    const repository = this.getRepository(manager);
    const slot = await repository.findOne({
      where: { appointmentId },
    });

    if (!slot) {
      return;
    }

    await this.releaseSlot(slot.slotId, manager);
  }

  private async ensureSlotAvailability(
    repository: Repository<AvailabilitySlot>,
    dermatologistId: string,
    startTimeIso: string,
    endTimeIso: string,
  ): Promise<AvailabilitySlot> {
    const { start, end } = this.getValidatedRange(startTimeIso, endTimeIso);

    const slot = await repository.findOne({
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
