import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkinAnalysis } from './entities/skin-analysis.entity';
import { CreateSkinAnalysisDto } from './dto/create-skin-analysis.dto';
import { UpdateSkinAnalysisDto } from './dto/update-skin-analysis.dto';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class SkinAnalysisService {
  constructor(
    @InjectRepository(SkinAnalysis)
    private readonly skinAnalysisRepository: Repository<SkinAnalysis>,
  ) {}

  async create(createDto: CreateSkinAnalysisDto): Promise<SkinAnalysis> {
    const { customerId, imageUrls, aiRecommendedProducts, ...rest } = createDto;

    const analysis = this.skinAnalysisRepository.create({
      ...rest,
      imageUrls: imageUrls ?? [],
      aiRecommendedProducts: aiRecommendedProducts ?? [],
    });

    analysis.customer = { customerId } as Customer;
    return await this.skinAnalysisRepository.save(analysis);
  }

  async findAll(): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
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
      where: { customer: { customerId } },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateSkinAnalysisDto,
  ): Promise<SkinAnalysis> {
    const analysis = await this.findOne(id);
    Object.assign(analysis, updateDto);

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
      where: { customer: { customerId } },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
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
      .andWhere('analysis.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('analysis.createdAt', 'DESC')
      .getMany();
  }
}
