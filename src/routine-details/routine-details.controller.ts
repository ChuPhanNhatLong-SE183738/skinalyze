import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoutineDetailsService } from './routine-details.service';
import { CreateRoutineDetailDto } from './dto/create-routine-detail.dto';
import { UpdateRoutineDetailDto } from './dto/update-routine-detail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ResponseHelper } from '../utils/responses';

@ApiTags('Routine Details')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routine-details')
export class RoutineDetailsController {
  constructor(private readonly routineDetailsService: RoutineDetailsService) {}

  @Post()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new Routine detail' })
  async create(@Body() createRoutineDetailDto: CreateRoutineDetailDto) {
    const detail = await this.routineDetailsService.create(
      createRoutineDetailDto,
    );
    return ResponseHelper.created(
      'Routine detail created successfully',
      detail,
    );
  }

  @Get()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all Routine details' })
  async findAll() {
    const details = await this.routineDetailsService.findAll();
    return ResponseHelper.success(
      'Routine details retrieved successfully',
      details,
    );
  }

  @Get(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a Routine detail by ID' })
  async findOne(@Param('id') id: string) {
    const detail = await this.routineDetailsService.findOne(id);
    return ResponseHelper.success(
      'Routine detail retrieved successfully',
      detail,
    );
  }

  @Get('routine/:routineId')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all details for a specific Routine' })
  async findByRoutine(@Param('routineId') routineId: string) {
    const details = await this.routineDetailsService.findByRoutineId(routineId);
    return ResponseHelper.success(
      'Routine details retrieved successfully',
      details,
    );
  }

  @Patch(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a Routine detail' })
  async update(
    @Param('id') id: string,
    @Body() updateRoutineDetailDto: UpdateRoutineDetailDto,
  ) {
    const detail = await this.routineDetailsService.update(
      id,
      updateRoutineDetailDto,
    );
    return ResponseHelper.success(
      'Routine detail updated successfully',
      detail,
    );
  }

  @Delete(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a Routine detail' })
  async remove(@Param('id') id: string) {
    await this.routineDetailsService.remove(id);
    return ResponseHelper.success('Routine detail deleted successfully');
  }
}
