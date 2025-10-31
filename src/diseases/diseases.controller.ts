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
  UseGuards,
  Query,
} from '@nestjs/common';
import { DiseasesService } from './diseases.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('diseases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiseasesController {
  constructor(private readonly diseasesService: DiseasesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.DERMATOLOGIST)
  create(@Body() createDiseaseDto: CreateDiseaseDto) {
    return this.diseasesService.create(createDiseaseDto);
  }

  @Get()
  findAll(@Query('groupId') groupId?: string) {
    if (groupId) {
      return this.diseasesService.findByGroup(groupId);
    }
    return this.diseasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diseasesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.DERMATOLOGIST)
  update(@Param('id') id: string, @Body() updateDiseaseDto: UpdateDiseaseDto) {
    return this.diseasesService.update(id, updateDiseaseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.diseasesService.remove(id);
  }
}