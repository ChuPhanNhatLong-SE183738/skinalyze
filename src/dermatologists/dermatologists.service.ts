import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dermatologist } from './entities/dermatologist.entity';
import {
  CreateDermatologistDto,
  UpdateDermatologistDto,
} from './dto/create-dermatologist.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class DermatologistsService {
  constructor(
    @InjectRepository(Dermatologist)
    private readonly dermatologistRepository: Repository<Dermatologist>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    createDermatologistDto: CreateDermatologistDto,
  ): Promise<Dermatologist> {
    try {
      await this.usersService.findOne(userId);
      const existingProfile = await this.dermatologistRepository.findOne({
        where: { user: { userId: userId } },
      });
      if (existingProfile) {
        throw new ConflictException(
          `Dermatologist profile for this user already exists`,
        );
      }
      const dermatologist = this.dermatologistRepository.create({
        ...createDermatologistDto,
        user: { userId: userId },
      });
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

  async findByDermaId(dermaId: string): Promise<Dermatologist> {
    try {
      const dermatologist = await this.dermatologistRepository.findOne({
        where: { dermatologistId: dermaId },
        relations: ['user'],
      });
      if (!dermatologist) {
        throw new NotFoundException(
          `Dermatologist with ID ${dermaId} not found 33`,
        );
      }

      return dermatologist;
    } catch (error) {
      this.handleError(error, `Failed to load dermatologist ${dermaId}`);
    }
  }

  async findByUserId(userId: string): Promise<Dermatologist> {
    try {
      // console.log('Long log ID', userId);

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

  async updateMyProfile(
    userId: string,
    updateDermatologistDto: UpdateDermatologistDto,
  ): Promise<Dermatologist> {
    try {
      const dermatologist = await this.findByUserId(userId);

      Object.assign(dermatologist, updateDermatologistDto);
      return await this.dermatologistRepository.save(dermatologist);
    } catch (error) {
      this.handleError(
        error,
        `Failed to update dermatologist for user ${userId}`,
      );
    }
  }

  async update(
    dermatologistId: string,
    updateDermatologistDto: UpdateDermatologistDto,
  ): Promise<Dermatologist> {
    try {
      const dermatologist = await this.findByDermaId(dermatologistId);
      Object.assign(dermatologist, updateDermatologistDto);
      return await this.dermatologistRepository.save(dermatologist);
    } catch (error) {
      this.handleError(
        error,
        `Failed to update dermatologist ${dermatologistId}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const dermatologist = await this.findByDermaId(id);
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
