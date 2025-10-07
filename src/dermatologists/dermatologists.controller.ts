import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DermatologistsService } from './dermatologists.service';
import {
  CreateDermatologistDto,
  UpdateDermatologistDto,
} from './dto/create-dermatologist.dto';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailabilityResponseDto,
} from './dto/availability.dto';
import { Dermatologist } from './entities/dermatologist.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('dermatologists')
export class DermatologistsController {
  constructor(private readonly dermatologistsService: DermatologistsService) {}

  // CRUD Operations for Dermatologist
  @Post()
  create(
    @Body() createDermatologistDto: CreateDermatologistDto,
  ): Promise<Dermatologist> {
    return this.dermatologistsService.create(createDermatologistDto);
  }

  @Get()
  findAll(): Promise<Dermatologist[]> {
    return this.dermatologistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Dermatologist> {
    return this.dermatologistsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.DERMATOLOGIST)
  update(
    @Param('id') id: string,
    @Body() updateDermatologistDto: UpdateDermatologistDto,
  ): Promise<Dermatologist> {
    return this.dermatologistsService.update(id, updateDermatologistDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.dermatologistsService.remove(id);
  }

  // Availability Management Endpoints
  @Post(':id/availability')
  createAvailability(
    @Param('id') dermatologistId: string,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.dermatologistsService.createAvailability(
      dermatologistId,
      createAvailabilityDto,
    );
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id') dermatologistId: string,
    @Query('date') date?: string,
  ): Promise<AvailabilityResponseDto[]> {
    return this.dermatologistsService.getAvailability(dermatologistId, date);
  }

  @Patch(':id/availability/:date')
  updateAvailability(
    @Param('id') dermatologistId: string,
    @Param('date') date: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.dermatologistsService.updateAvailability(
      dermatologistId,
      date,
      updateAvailabilityDto,
    );
  }

  @Delete(':id/availability/:date')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAvailability(
    @Param('id') dermatologistId: string,
    @Param('date') date: string,
  ): Promise<void> {
    return this.dermatologistsService.deleteAvailability(dermatologistId, date);
  }

  @Get(':id/availability/check')
  checkAvailabilityAtTime(
    @Param('id') dermatologistId: string,
    @Query('date') date: string,
    @Query('time') time: string,
  ): Promise<boolean> {
    return this.dermatologistsService.checkAvailabilityAtTime(
      dermatologistId,
      date,
      time,
    );
  }
}
