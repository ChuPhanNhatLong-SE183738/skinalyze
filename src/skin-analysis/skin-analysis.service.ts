import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkinAnalysis } from './entities/skin-analysis.entity';
import { CreateSkinAnalysisDto } from './dto/create-skin-analysis.dto';
import { UpdateSkinAnalysisDto } from './dto/update-skin-analysis.dto';

@Injectable()
export class SkinAnalysisService {
  constructor(
    @InjectRepository(SkinAnalysis)
    private readonly skinAnalysisRepository: Repository<SkinAnalysis>,
  ) {}

  async create(createDto: CreateSkinAnalysisDto): Promise<SkinAnalysis> {
    const analysis = this.skinAnalysisRepository.create({
      ...createDto,
      analysisDate: createDto.analysisDate
        ? new Date(createDto.analysisDate)
        : new Date(),
      recommendedProducts: createDto.recommendedProducts || [],
    });
    return await this.skinAnalysisRepository.save(analysis);
  }

  async findAll(): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      relations: ['customer'],
      order: { analysisDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SkinAnalysis> {
    const analysis = await this.skinAnalysisRepository.findOne({
      where: { analysisId: id },
      relations: ['customer'],
    });

    if (!analysis) {
      throw new NotFoundException(`Skin analysis with ID ${id} not found`);
    }

    return analysis;
  }

  async findByCustomerId(customerId: string): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      where: { customerId },
      relations: ['customer'],
      order: { analysisDate: 'DESC' },
    });
  }

  async findBySkinType(skinType: string): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      where: { skinType },
      relations: ['customer'],
      order: { analysisDate: 'DESC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateSkinAnalysisDto,
  ): Promise<SkinAnalysis> {
    const analysis = await this.findOne(id);
    Object.assign(analysis, updateDto);

    if (updateDto.analysisDate) {
      analysis.analysisDate = new Date(updateDto.analysisDate);
    }

    return await this.skinAnalysisRepository.save(analysis);
  }

  async remove(id: string): Promise<void> {
    const analysis = await this.findOne(id);
    await this.skinAnalysisRepository.remove(analysis);
  }

  async getLatestByCustomerId(
    customerId: string,
  ): Promise<SkinAnalysis | null> {
    return await this.skinAnalysisRepository.findOne({
      where: { customerId },
      relations: ['customer'],
      order: { analysisDate: 'DESC' },
    });
  }

  async getAnalysisByDateRange(
    customerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository
      .createQueryBuilder('analysis')
      .leftJoinAndSelect('analysis.customer', 'customer')
      .where('analysis.customerId = :customerId', { customerId })
      .andWhere('analysis.analysisDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('analysis.analysisDate', 'DESC')
      .getMany();
  }
}
