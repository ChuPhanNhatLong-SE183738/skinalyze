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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ShippingLogsService } from './shipping-logs.service';
import { CreateShippingLogDto } from './dto/create-shipping-log.dto';
import { UpdateShippingLogDto } from './dto/update-shipping-log.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import {
  CreateBatchDeliveryDto,
  AssignGhnOrderDto,
} from './dto/batch-delivery.dto';
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
    summary:
      '📦 Lấy danh sách đơn hàng chưa có staff nhận (available for pickup)',
    description: 'Staff có thể xem và chọn đơn hàng để giao',
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
    description: 'Xem các đơn hàng mà staff đang phụ trách',
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

  @Post(':id/upload-finished-pictures')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('pictures', 5)) // Max 5 ảnh
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '📸 Shipper upload ảnh bằng chứng hoàn thành đơn hàng',
    description: 'Upload 1-5 ảnh bằng chứng giao hàng thành công',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pictures: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Ảnh bằng chứng (1-5 ảnh)',
        },
      },
    },
  })
  async uploadFinishedPictures(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng upload ít nhất 1 ảnh');
    }

    if (files.length > 5) {
      throw new BadRequestException('Chỉ được upload tối đa 5 ảnh');
    }

    const userId = req.user.userId;
    const result = await this.shippingLogsService.uploadFinishedPictures(
      id,
      files,
      userId,
    );

    return ResponseHelper.success('Upload ảnh thành công', result);
  }

  @Post(':id/assign-to-me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '🤝 Staff tự nhận đơn hàng này',
    description: 'Staff có thể tự chọn và nhận đơn hàng để giao',
  })
  async assignToMe(@Param('id') id: string, @Request() req) {
    const staffId = req.user.userId;
    const log = await this.shippingLogsService.assignToMe(id, staffId);
    return ResponseHelper.success('Bạn đã nhận đơn hàng thành công', log);
  }

  @Post(':id/assign-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '👨‍💼 Admin gán staff cho đơn hàng',
    description: 'Chỉ ADMIN/MANAGER mới có thể gán staff cho đơn hàng',
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

  @Post('batch-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '📦 Tạo batch delivery - gom nhiều đơn giao cùng lúc',
    description:
      'Combine multiple orders from the same customer for one delivery trip. Convenient for shipper.',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch delivery created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Batch delivery created for 3 orders',
        data: {
          batchCode: 'BATCH-2025-12-01-ABC123',
          orderCount: 3,
          shippingLogs: [],
        },
      },
    },
  })
  async createBatchDelivery(@Body() dto: CreateBatchDeliveryDto) {
    const logs = await this.shippingLogsService.createBatchDelivery(dto);
    return ResponseHelper.success(
      `Batch delivery created for ${logs.length} orders`,
      {
        batchCode: logs[0].batchCode,
        orderCount: logs.length,
        shippingLogs: logs,
      },
    );
  }

  @Get('batch/:batchCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '📋 Xem tất cả orders trong 1 batch',
    description: 'Get all orders in the same batch delivery',
  })
  async getOrdersByBatch(@Param('batchCode') batchCode: string) {
    const logs = await this.shippingLogsService.getOrdersByBatchCode(batchCode);
    return ResponseHelper.success(
      `Found ${logs.length} orders in batch ${batchCode}`,
      logs,
    );
  }

  @Get('suggest-batch/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '💡 Gợi ý orders có thể gom chung batch delivery',
    description:
      'Suggest orders from the same customer that can be batched together',
  })
  async suggestBatchDelivery(@Param('customerId') customerId: string) {
    const orders =
      await this.shippingLogsService.suggestBatchDelivery(customerId);
    return ResponseHelper.success(
      `Found ${orders.length} orders available for batch delivery`,
      orders,
    );
  }

  @Post('assign-ghn')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '🚚 Gán thông tin tracking GHN cho order',
    description:
      'After creating GHN order, assign the tracking code to our shipping log',
  })
  @ApiResponse({
    status: 200,
    description: 'GHN order assigned successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'GHN order assigned successfully',
        data: {
          shippingLogId: '550e8400-e29b-41d4-a716-446655440000',
          ghnOrderCode: 'GHN12345678',
          status: 'PICKED_UP',
        },
      },
    },
  })
  async assignGhnOrder(@Body() dto: AssignGhnOrderDto) {
    const log = await this.shippingLogsService.assignGhnOrder(dto);
    return ResponseHelper.success('GHN order assigned successfully', {
      shippingLogId: log.shippingLogId,
      ghnOrderCode: log.ghnOrderCode,
      status: log.status,
    });
  }
}
