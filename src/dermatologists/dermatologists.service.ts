import {
  Injectable,
  NotFoundException,
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

@Injectable()
export class DermatologistsService {
  constructor(
    @InjectRepository(Dermatologist)
    private readonly dermatologistRepository: Repository<Dermatologist>,
  ) {}

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
        where: { user: { userId } },
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

  private handleError(error: unknown, message: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(message);
  }
}
