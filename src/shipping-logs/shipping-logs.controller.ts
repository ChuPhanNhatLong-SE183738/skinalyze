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
import { ShippingLogsService } from './shipping-logs.service';
import { CreateShippingLogDto } from './dto/create-shipping-log.dto';
import { UpdateShippingLogDto } from './dto/update-shipping-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseHelper } from '../utils/responses';

@ApiTags('shipping-logs')
@Controller('shipping-logs')
export class ShippingLogsController {
  constructor(private readonly shippingLogsService: ShippingLogsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new shipping log' })
  async create(@Body() createDto: CreateShippingLogDto) {
    const log = await this.shippingLogsService.create(createDto);
    return ResponseHelper.success('Shipping log created successfully', log);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all shipping logs' })
  async findAll() {
    const logs = await this.shippingLogsService.findAll();
    return ResponseHelper.success('Shipping logs retrieved successfully', logs);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipping logs for an order' })
  async findByOrderId(@Param('orderId') orderId: string) {
    const logs = await this.shippingLogsService.findByOrderId(orderId);
    return ResponseHelper.success('Shipping logs retrieved successfully', logs);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a shipping log by ID' })
  async findOne(@Param('id') id: string) {
    const log = await this.shippingLogsService.findOne(id);
    return ResponseHelper.success('Shipping log retrieved successfully', log);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a shipping log' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateShippingLogDto,
  ) {
    const log = await this.shippingLogsService.update(id, updateDto);
    return ResponseHelper.success('Shipping log updated successfully', log);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a shipping log' })
  async remove(@Param('id') id: string) {
    await this.shippingLogsService.remove(id);
    return ResponseHelper.success('Shipping log deleted successfully');
  }
}
