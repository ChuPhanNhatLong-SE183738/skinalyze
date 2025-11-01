import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DermatologistsService } from './dermatologists.service';
import {
  CreateDermatologistDto,
  UpdateDermatologistDto,
} from './dto/create-dermatologist.dto';
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
}
