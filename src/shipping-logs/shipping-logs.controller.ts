import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingLogsService } from './shipping-logs.service';
import { CreateShippingLogDto } from './dto/create-shipping-log.dto';
import { UpdateShippingLogDto } from './dto/update-shipping-log.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseHelper } from '../utils/responses';
import { UserRole } from '../users/entities/user.entity';

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

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '📦 Lấy danh sách đơn hàng chưa có staff nhận (available for pickup)',
    description: 'Staff có thể xem và chọn đơn hàng để giao'
  })
  async findAvailable() {
    const logs = await this.shippingLogsService.findAvailableForPickup();
    return ResponseHelper.success(
      'Available shipping logs retrieved successfully',
      logs,
    );
  }

  @Get('my-deliveries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '👤 Lấy danh sách đơn hàng của tôi (staff đang login)',
    description: 'Xem các đơn hàng mà staff đang phụ trách'
  })
  async findMyDeliveries(@Request() req) {
    const staffId = req.user.userId;
    const logs = await this.shippingLogsService.findByStaffId(staffId);
    return ResponseHelper.success('My deliveries retrieved successfully', logs);
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

  @Post(':id/assign-to-me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '🤝 Staff tự nhận đơn hàng này',
    description: 'Staff có thể tự chọn và nhận đơn hàng để giao'
  })
  async assignToMe(@Param('id') id: string, @Request() req) {
    const staffId = req.user.userId;
    const log = await this.shippingLogsService.assignToMe(id, staffId);
    return ResponseHelper.success(
      'Bạn đã nhận đơn hàng thành công',
      log,
    );
  }

  @Post(':id/assign-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '👨‍💼 Admin gán staff cho đơn hàng',
    description: 'Chỉ ADMIN/MANAGER mới có thể gán staff cho đơn hàng'
  })
  async assignStaff(
    @Param('id') id: string,
    @Body() assignDto: AssignStaffDto,
  ) {
    const log = await this.shippingLogsService.assignStaff(
      id,
      assignDto.staffId,
      assignDto.force,
    );
    return ResponseHelper.success('Staff assigned successfully', log);
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
