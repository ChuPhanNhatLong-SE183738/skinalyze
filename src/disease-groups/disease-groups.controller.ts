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
} from '@nestjs/common';
import { DiseaseGroupsService } from './disease-groups.service';
import { CreateDiseaseGroupDto } from './dto/create-disease-group.dto';
import { UpdateDiseaseGroupDto } from './dto/update-disease-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('disease-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiseaseGroupsController {
  constructor(private readonly diseaseGroupsService: DiseaseGroupsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() createDiseaseGroupDto: CreateDiseaseGroupDto) {
    return this.diseaseGroupsService.create(createDiseaseGroupDto);
  }

  @Get()
  findAll() {
    return this.diseaseGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diseaseGroupsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(
    @Param('id') id: string,
    @Body() updateDiseaseGroupDto: UpdateDiseaseGroupDto,
  ) {
    return this.diseaseGroupsService.update(id, updateDiseaseGroupDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.diseaseGroupsService.remove(id);
  }
}