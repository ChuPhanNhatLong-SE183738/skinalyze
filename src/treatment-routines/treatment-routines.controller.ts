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
import { TreatmentRoutinesService } from './treatment-routines.service';
import { CreateTreatmentRoutineDto } from './dto/create-treatment-routine.dto';
import { UpdateTreatmentRoutineDto } from './dto/update-treatment-routine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ResponseHelper } from '../utils/responses';

@ApiTags('Treatment Routines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('treatment-routines')
export class TreatmentRoutinesController {
  constructor(
    private readonly treatmentRoutinesService: TreatmentRoutinesService,
  ) {}

  @Post()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new treatment Routine' })
  async create(@Body() createTreatmentRoutineDto: CreateTreatmentRoutineDto) {
    const Routine = await this.treatmentRoutinesService.create(
      createTreatmentRoutineDto,
    );
    return ResponseHelper.created(
      'Treatment Routine created successfully',
      Routine,
    );
  }

  @Get()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all treatment Routines' })
  async findAll() {
    const Routines = await this.treatmentRoutinesService.findAll();
    return ResponseHelper.success(
      'Treatment Routines retrieved successfully',
      Routines,
    );
  }

  @Get(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a treatment Routine by ID' })
  async findOne(@Param('id') id: string) {
    const Routine = await this.treatmentRoutinesService.findOne(id);
    return ResponseHelper.success(
      'Treatment Routine retrieved successfully',
      Routine,
    );
  }

  @Get('dermatologist/:dermatologistId')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all Routines by dermatologist' })
  async findByDermatologist(@Param('dermatologistId') dermatologistId: string) {
    const Routines =
      await this.treatmentRoutinesService.findByDermatologist(dermatologistId);
    return ResponseHelper.success(
      'Dermatologist Routines retrieved successfully',
      Routines,
    );
  }

  @Get('customer/:customerId')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all Routines by customer' })
  async findByCustomer(@Param('customerId') customerId: string) {
    const Routines =
      await this.treatmentRoutinesService.findByCustomer(customerId);
    return ResponseHelper.success(
      'Customer Routines retrieved successfully',
      Routines,
    );
  }

  @Patch(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a treatment Routine' })
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentRoutineDto: UpdateTreatmentRoutineDto,
  ) {
    const Routine = await this.treatmentRoutinesService.update(
      id,
      updateTreatmentRoutineDto,
    );
    return ResponseHelper.success(
      'Treatment Routine updated successfully',
      Routine,
    );
  }

  @Delete(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a treatment Routine' })
  async remove(@Param('id') id: string) {
    await this.treatmentRoutinesService.remove(id);
    return ResponseHelper.success('Treatment Routine deleted successfully');
  }
}
