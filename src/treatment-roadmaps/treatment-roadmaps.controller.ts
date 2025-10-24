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
import { TreatmentRoadmapsService } from './treatment-roadmaps.service';
import { CreateTreatmentRoadmapDto } from './dto/create-treatment-roadmap.dto';
import { UpdateTreatmentRoadmapDto } from './dto/update-treatment-roadmap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ResponseHelper } from '../utils/responses';

@ApiTags('Treatment Roadmaps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('treatment-roadmaps')
export class TreatmentRoadmapsController {
  constructor(
    private readonly treatmentRoadmapsService: TreatmentRoadmapsService,
  ) {}

  @Post()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new treatment roadmap' })
  async create(@Body() createTreatmentRoadmapDto: CreateTreatmentRoadmapDto) {
    const roadmap = await this.treatmentRoadmapsService.create(
      createTreatmentRoadmapDto,
    );
    return ResponseHelper.created(
      'Treatment roadmap created successfully',
      roadmap,
    );
  }

  @Get()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all treatment roadmaps' })
  async findAll() {
    const roadmaps = await this.treatmentRoadmapsService.findAll();
    return ResponseHelper.success(
      'Treatment roadmaps retrieved successfully',
      roadmaps,
    );
  }

  @Get(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a treatment roadmap by ID' })
  async findOne(@Param('id') id: string) {
    const roadmap = await this.treatmentRoadmapsService.findOne(id);
    return ResponseHelper.success(
      'Treatment roadmap retrieved successfully',
      roadmap,
    );
  }

  @Get('dermatologist/:dermatologistId')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all roadmaps by dermatologist' })
  async findByDermatologist(@Param('dermatologistId') dermatologistId: string) {
    const roadmaps =
      await this.treatmentRoadmapsService.findByDermatologist(dermatologistId);
    return ResponseHelper.success(
      'Dermatologist roadmaps retrieved successfully',
      roadmaps,
    );
  }

  @Get('customer/:customerId')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all roadmaps by customer' })
  async findByCustomer(@Param('customerId') customerId: string) {
    const roadmaps =
      await this.treatmentRoadmapsService.findByCustomer(customerId);
    return ResponseHelper.success(
      'Customer roadmaps retrieved successfully',
      roadmaps,
    );
  }

  @Patch(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a treatment roadmap' })
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentRoadmapDto: UpdateTreatmentRoadmapDto,
  ) {
    const roadmap = await this.treatmentRoadmapsService.update(
      id,
      updateTreatmentRoadmapDto,
    );
    return ResponseHelper.success(
      'Treatment roadmap updated successfully',
      roadmap,
    );
  }

  @Delete(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a treatment roadmap' })
  async remove(@Param('id') id: string) {
    await this.treatmentRoadmapsService.remove(id);
    return ResponseHelper.success('Treatment roadmap deleted successfully');
  }
}
