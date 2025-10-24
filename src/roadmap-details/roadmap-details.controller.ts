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
import { RoadmapDetailsService } from './roadmap-details.service';
import { CreateRoadmapDetailDto } from './dto/create-roadmap-detail.dto';
import { UpdateRoadmapDetailDto } from './dto/update-roadmap-detail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ResponseHelper } from '../utils/responses';

@ApiTags('Roadmap Details')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roadmap-details')
export class RoadmapDetailsController {
  constructor(private readonly roadmapDetailsService: RoadmapDetailsService) {}

  @Post()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new roadmap detail' })
  async create(@Body() createRoadmapDetailDto: CreateRoadmapDetailDto) {
    const detail = await this.roadmapDetailsService.create(
      createRoadmapDetailDto,
    );
    return ResponseHelper.created(
      'Roadmap detail created successfully',
      detail,
    );
  }

  @Get()
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all roadmap details' })
  async findAll() {
    const details = await this.roadmapDetailsService.findAll();
    return ResponseHelper.success(
      'Roadmap details retrieved successfully',
      details,
    );
  }

  @Get(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a roadmap detail by ID' })
  async findOne(@Param('id') id: string) {
    const detail = await this.roadmapDetailsService.findOne(id);
    return ResponseHelper.success(
      'Roadmap detail retrieved successfully',
      detail,
    );
  }

  @Get('roadmap/:roadmapId')
  @Roles(UserRole.DERMATOLOGIST, UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all details for a specific roadmap' })
  async findByRoadmap(@Param('roadmapId') roadmapId: string) {
    const details = await this.roadmapDetailsService.findByRoadmapId(roadmapId);
    return ResponseHelper.success(
      'Roadmap details retrieved successfully',
      details,
    );
  }

  @Patch(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a roadmap detail' })
  async update(
    @Param('id') id: string,
    @Body() updateRoadmapDetailDto: UpdateRoadmapDetailDto,
  ) {
    const detail = await this.roadmapDetailsService.update(
      id,
      updateRoadmapDetailDto,
    );
    return ResponseHelper.success(
      'Roadmap detail updated successfully',
      detail,
    );
  }

  @Delete(':id')
  @Roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a roadmap detail' })
  async remove(@Param('id') id: string) {
    await this.roadmapDetailsService.remove(id);
    return ResponseHelper.success('Roadmap detail deleted successfully');
  }
}
