import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SkinAnalysisService } from './skin-analysis.service';
import { CreateSkinAnalysisDto } from './dto/create-skin-analysis.dto';
import { UpdateSkinAnalysisDto } from './dto/update-skin-analysis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseHelper } from '../utils/responses';

@ApiTags('skin-analysis')
@Controller('skin-analysis')
export class SkinAnalysisController {
  constructor(private readonly skinAnalysisService: SkinAnalysisService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new skin analysis' })
  async create(@Body() createDto: CreateSkinAnalysisDto) {
    const analysis = await this.skinAnalysisService.create(createDto);
    return ResponseHelper.success(
      'Skin analysis created successfully',
      analysis,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all skin analyses' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'skinType', required: false })
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('skinType') skinType?: string,
  ) {
    let analyses;

    if (customerId) {
      analyses = await this.skinAnalysisService.findByCustomerId(customerId);
    } else if (skinType) {
      analyses = await this.skinAnalysisService.findBySkinType(skinType);
    } else {
      analyses = await this.skinAnalysisService.findAll();
    }

    return ResponseHelper.success(
      'Skin analyses retrieved successfully',
      analyses,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a skin analysis by ID' })
  async findOne(@Param('id') id: string) {
    const analysis = await this.skinAnalysisService.findOne(id);
    return ResponseHelper.success(
      'Skin analysis retrieved successfully',
      analysis,
    );
  }

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all analyses for a customer' })
  async findByCustomerId(@Param('customerId') customerId: string) {
    const analyses =
      await this.skinAnalysisService.findByCustomerId(customerId);
    return ResponseHelper.success(
      'Customer analyses retrieved successfully',
      analyses,
    );
  }

  @Get('customer/:customerId/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest analysis for a customer' })
  async getLatest(@Param('customerId') customerId: string) {
    const analysis =
      await this.skinAnalysisService.getLatestByCustomerId(customerId);
    return ResponseHelper.success(
      'Latest analysis retrieved successfully',
      analysis,
    );
  }

  @Get('customer/:customerId/date-range')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analyses by date range' })
  @ApiQuery({ name: 'startDate', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', example: '2025-12-31' })
  async getByDateRange(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const analyses = await this.skinAnalysisService.getAnalysisByDateRange(
      customerId,
      new Date(startDate),
      new Date(endDate),
    );
    return ResponseHelper.success('Analyses retrieved successfully', analyses);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a skin analysis' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSkinAnalysisDto,
  ) {
    const analysis = await this.skinAnalysisService.update(id, updateDto);
    return ResponseHelper.success(
      'Skin analysis updated successfully',
      analysis,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a skin analysis' })
  async remove(@Param('id') id: string) {
    await this.skinAnalysisService.remove(id);
    return ResponseHelper.success('Skin analysis deleted successfully');
  }
}
