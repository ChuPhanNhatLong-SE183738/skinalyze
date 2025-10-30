import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiseaseGroup } from './entities/disease-group.entity';
import { CreateDiseaseGroupDto } from './dto/create-disease-group.dto';
import { UpdateDiseaseGroupDto } from './dto/update-disease-group.dto';

@Injectable()
export class DiseaseGroupsService {
  constructor(
    @InjectRepository(DiseaseGroup)
    private diseaseGroupRepository: Repository<DiseaseGroup>,
  ) {}

  async create(createDiseaseGroupDto: CreateDiseaseGroupDto): Promise<DiseaseGroup> {
    const diseaseGroup = this.diseaseGroupRepository.create(createDiseaseGroupDto);
    return await this.diseaseGroupRepository.save(diseaseGroup);
  }

  async findAll(): Promise<DiseaseGroup[]> {
    return await this.diseaseGroupRepository.find({
      relations: ['diseases'],
    });
  }

  async findOne(id: string): Promise<DiseaseGroup> {
    const diseaseGroup = await this.diseaseGroupRepository.findOne({
      where: { diseaseGroupId: id },
      relations: ['diseases'],
    });

    if (!diseaseGroup) {
      throw new NotFoundException(`Disease group with ID ${id} not found`);
    }

    return diseaseGroup;
  }

  async update(id: string, updateDiseaseGroupDto: UpdateDiseaseGroupDto): Promise<DiseaseGroup> {
    const diseaseGroup = await this.findOne(id);
    Object.assign(diseaseGroup, updateDiseaseGroupDto);
    return await this.diseaseGroupRepository.save(diseaseGroup);
  }

  async remove(id: string): Promise<void> {
    const diseaseGroup = await this.findOne(id);
    await this.diseaseGroupRepository.remove(diseaseGroup);
  }
}