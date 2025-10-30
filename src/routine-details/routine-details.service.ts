import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoutineDetailDto } from './dto/create-routine-detail.dto';
import { UpdateRoutineDetailDto } from './dto/update-routine-detail.dto';
import { RoutineDetail } from './entities/routine-detail.entity';
import { TreatmentRoutine } from '../treatment-routines/entities/treatment-routine.entity';

@Injectable()
export class RoutineDetailsService {
  constructor(
    @InjectRepository(RoutineDetail)
    private readonly routineDetailRepository: Repository<RoutineDetail>,
    @InjectRepository(TreatmentRoutine)
    private readonly treatmentRoutineRepository: Repository<TreatmentRoutine>,
  ) {}

  async create(
    createRoutineDetailDto: CreateRoutineDetailDto,
  ): Promise<RoutineDetail> {
    // Validate Routine exists
    const routine = await this.treatmentRoutineRepository.findOne({
      where: { routineId: createRoutineDetailDto.routineId },
    });
    if (!routine) {
      throw new BadRequestException(
        `Treatment Routine with ID ${createRoutineDetailDto.routineId} not found`,
      );
    }

    const { routineId: _omit, ...detailPayload } = createRoutineDetailDto;
    void _omit;

    const routineDetail = this.routineDetailRepository.create({
      ...detailPayload,
      productIds: createRoutineDetailDto.productIds ?? [],
    });

    routineDetail.treatmentRoutine = routine;
    return await this.routineDetailRepository.save(routineDetail);
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
}
