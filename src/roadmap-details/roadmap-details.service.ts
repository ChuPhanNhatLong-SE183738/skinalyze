import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoadmapDetailDto } from './dto/create-roadmap-detail.dto';
import { UpdateRoadmapDetailDto } from './dto/update-roadmap-detail.dto';
import { RoadmapDetail } from './entities/roadmap-detail.entity';
import { TreatmentRoadmap } from '../treatment-roadmaps/entities/treatment-roadmap.entity';

@Injectable()
export class RoadmapDetailsService {
  constructor(
    @InjectRepository(RoadmapDetail)
    private roadmapDetailRepository: Repository<RoadmapDetail>,
    @InjectRepository(TreatmentRoadmap)
    private treatmentRoadmapRepository: Repository<TreatmentRoadmap>,
  ) {}

  async create(
    createRoadmapDetailDto: CreateRoadmapDetailDto,
  ): Promise<RoadmapDetail> {
    // Validate roadmap exists
    const roadmap = await this.treatmentRoadmapRepository.findOne({
      where: { roadmapId: createRoadmapDetailDto.roadmapId },
    });
    if (!roadmap) {
      throw new BadRequestException(
        `Treatment Roadmap with ID ${createRoadmapDetailDto.roadmapId} not found`,
      );
    }

    const roadmapDetail = this.roadmapDetailRepository.create(
      createRoadmapDetailDto,
    );
    return await this.roadmapDetailRepository.save(roadmapDetail);
  }

  async findAll(): Promise<RoadmapDetail[]> {
    return await this.roadmapDetailRepository.find({
      relations: ['treatmentRoadmap'],
    });
  }

  async findOne(id: string): Promise<RoadmapDetail> {
    const roadmapDetail = await this.roadmapDetailRepository.findOne({
      where: { roadmapDetailId: id },
      relations: ['treatmentRoadmap'],
    });

    if (!roadmapDetail) {
      throw new NotFoundException(`Roadmap Detail with ID ${id} not found`);
    }

    return roadmapDetail;
  }

  async findByRoadmapId(roadmapId: string): Promise<RoadmapDetail[]> {
    return await this.roadmapDetailRepository.find({
      where: { roadmapId },
      relations: ['treatmentRoadmap'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    updateRoadmapDetailDto: UpdateRoadmapDetailDto,
  ): Promise<RoadmapDetail> {
    const roadmapDetail = await this.findOne(id);

    Object.assign(roadmapDetail, updateRoadmapDetailDto);

    return await this.roadmapDetailRepository.save(roadmapDetail);
  }

  async remove(id: string): Promise<void> {
    const roadmapDetail = await this.findOne(id);
    await this.roadmapDetailRepository.remove(roadmapDetail);
  }
}
