import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disease } from './entities/disease.entity';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';

@Injectable()
export class DiseasesService {
  constructor(
    @InjectRepository(Disease)
    private diseaseRepository: Repository<Disease>,
  ) {}

  async create(createDiseaseDto: CreateDiseaseDto): Promise<Disease> {
    const disease = this.diseaseRepository.create(createDiseaseDto);
    return await this.diseaseRepository.save(disease);
  }

  async findAll(): Promise<Disease[]> {
    return await this.diseaseRepository.find({
      relations: ['diseaseGroup'],
    });
  }

  async findByGroup(diseaseGroupId: string): Promise<Disease[]> {
    return await this.diseaseRepository.find({
      where: { diseaseGroupId },
      relations: ['diseaseGroup'],
    });
  }

  async findOne(id: string): Promise<Disease> {
    const disease = await this.diseaseRepository.findOne({
      where: { diseaseId: id },
      relations: ['diseaseGroup'],
    });

    if (!disease) {
      throw new NotFoundException(`Disease with ID ${id} not found`);
    }

    return disease;
  }

  async update(id: string, updateDiseaseDto: UpdateDiseaseDto): Promise<Disease> {
    const disease = await this.findOne(id);
    Object.assign(disease, updateDiseaseDto);
    return await this.diseaseRepository.save(disease);
  }

  async remove(id: string): Promise<void> {
    const disease = await this.findOne(id);
    await this.diseaseRepository.remove(disease);
  }
}