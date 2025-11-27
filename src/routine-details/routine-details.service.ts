import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateRoutineDetailDto } from './dto/create-routine-detail.dto';
import { UpdateRoutineDetailDto } from './dto/update-routine-detail.dto';
import { RoutineDetail } from './entities/routine-detail.entity';
import { TreatmentRoutine } from '../treatment-routines/entities/treatment-routine.entity';
import { DermatologistsService } from 'src/dermatologists/dermatologists.service';

@Injectable()
export class RoutineDetailsService {
  constructor(
    @InjectRepository(RoutineDetail)
    private readonly routineDetailRepository: Repository<RoutineDetail>,
    @InjectRepository(TreatmentRoutine)
    private readonly treatmentRoutineRepository: Repository<TreatmentRoutine>,
    private readonly dermatologistsService: DermatologistsService,
    private readonly entityManager: EntityManager,
  ) {}

  private async checkOwnership(
    userId: string,
    routineDetailId: string,
  ): Promise<RoutineDetail> {
    const detail = await this.routineDetailRepository.findOne({
      where: { routineDetailId },
      relations: ['treatmentRoutine', 'treatmentRoutine.dermatologist'],
    });

    if (!detail) {
      throw new NotFoundException('Routine Detail not found');
    }

    const dermatologist = await this.dermatologistsService.findByUserId(userId);

    if (
      detail.treatmentRoutine.dermatologist.dermatologistId !==
      dermatologist.dermatologistId
    ) {
      throw new ForbiddenException(
        'You do not have permission to modify this routine detail.',
      );
    }

    return detail;
  }

  async create(
    userId: string,
    createRoutineDetailDto: CreateRoutineDetailDto,
  ): Promise<RoutineDetail> {
    // 1. Validate Routine exists
    const routine = await this.treatmentRoutineRepository.findOne({
      where: { routineId: createRoutineDetailDto.routineId },
      relations: ['dermatologist.user'],
    });

    if (!routine) {
      throw new BadRequestException(
        `Treatment Routine with ID ${createRoutineDetailDto.routineId} not found`,
      );
    }
    if (routine?.dermatologist?.user?.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add details to this routine.',
      );
    }

    // 2. Create RoutineDetail with new structure
    // Remove routineId from payload as we will assign treatmentRoutine relation
    const { routineId, products, ...detailPayload } = createRoutineDetailDto;

    // Create new RoutineDetail entity
    const newRoutineDetail = new RoutineDetail();
    Object.assign(newRoutineDetail, detailPayload);

    newRoutineDetail.products = products ?? [];
    newRoutineDetail.isActive = true;
    newRoutineDetail.treatmentRoutine = routine;

    // Save to database
    return await this.routineDetailRepository.save(newRoutineDetail);
  }

  async findAll(): Promise<RoutineDetail[]> {
    return await this.routineDetailRepository.find({
      relations: ['treatmentRoutine'],
    });
  }

  async findOne(id: string): Promise<RoutineDetail> {
    const routineDetail = await this.routineDetailRepository.findOne({
      where: { routineDetailId: id },
      relations: ['treatmentRoutine'],
    });

    if (!routineDetail) {
      throw new NotFoundException(`Routine Detail with ID ${id} not found`);
    }

    return routineDetail;
  }

  async findByRoutineId(routineId: string): Promise<RoutineDetail[]> {
    return await this.routineDetailRepository.find({
      where: { treatmentRoutine: { routineId } },
      relations: ['treatmentRoutine'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    updateRoutineDetailDto: UpdateRoutineDetailDto,
  ): Promise<RoutineDetail> {
    const routineDetail = await this.findOne(id);

    Object.assign(routineDetail, updateRoutineDetailDto);

    return await this.routineDetailRepository.save(routineDetail);
  }

  async remove(id: string): Promise<void> {
    const routineDetail = await this.findOne(id);
    await this.routineDetailRepository.remove(routineDetail);
  }

  async updateWithVersioning(
    userId: string,
    detailId: string,
    updateDto: UpdateRoutineDetailDto,
  ): Promise<RoutineDetail> {
    // Check ownership and get the old detail
    const oldDetail = await this.checkOwnership(userId, detailId);

    if (!oldDetail.isActive) {
      throw new BadRequestException(
        'Cannot update an inactive routine detail.',
      );
    }

    return this.entityManager.transaction(async (manager) => {
      const detailRepo = manager.getRepository(RoutineDetail);

      // A. Inactive old detail
      oldDetail.isActive = false;
      await detailRepo.save(oldDetail);

      // B. Create new record (Clone old data + Apply new changes)
      const newDetail = new RoutineDetail();

      newDetail.description = updateDto.description ?? oldDetail.description;
      newDetail.content = updateDto.content ?? oldDetail.content;
      newDetail.products = updateDto.products ?? oldDetail.products;
      newDetail.stepType = updateDto.stepType ?? oldDetail.stepType;

      newDetail.isActive = true;
      newDetail.treatmentRoutine = oldDetail.treatmentRoutine;

      return await detailRepo.save(newDetail);
    });
  }

  async softRemove(userId: string, detailId: string): Promise<void> {
    const detail = await this.checkOwnership(userId, detailId);
    // Soft delete
    detail.isActive = false;
    await this.routineDetailRepository.save(detail);
  }
}
