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
  UpdateBatchOrderDto,
  CompleteBatchDto,
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

  @Get('batches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all batch deliveries',
    description: 'Get all batches with order count, total amount, and status',
  })
  @ApiResponse({
    status: 200,
    description: 'Batches retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Found 5 batches',
        data: [
          {
            batchCode: 'BATCH-2025-12-04-YB5ULX',
            orderCount: 3,
            totalAmount: 90000,
            status: 'IN_PROGRESS',
            completedCount: 1,
            createdAt: '2025-12-04T04:33:29.044Z',
            shippingStaffId: '...',
            shippingStaff: {
              userId: '...',
              fullName: 'Nguyen Van A',
              phone: '0987654321',
            },
            orders: [
              {
                shippingLogId: '...',
                orderId: '...',
                status: 'DELIVERED',
                totalAmount: 30000,
              },
            ],
          },
        ],
      },
    },
  })
  async getAllBatches() {
    const batches = await this.shippingLogsService.getAllBatches();
    return ResponseHelper.success(`Found ${batches.length} batches`, batches);
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

  @Post('batches/:batchCode/pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '🚚 Staff pickup batch delivery',
    description:
      'Staff picks up a batch - all orders move to IN_TRANSIT status',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch picked up successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Batch BATCH-2025-12-05-ABC123 picked up successfully',
        data: [
          {
            shippingLogId: '...',
            orderId: '...',
            status: 'IN_TRANSIT',
            batchCode: 'BATCH-2025-12-05-ABC123',
          },
        ],
      },
    },
  })
  async pickupBatch(@Param('batchCode') batchCode: string, @Request() req) {
    const staffId = req.user.userId;
    const logs = await this.shippingLogsService.pickupBatch(batchCode, staffId);
    return ResponseHelper.success(
      `Batch ${batchCode} picked up successfully`,
      logs,
    );
  }

  @Patch('batches/:batchCode/orders/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '📝 Update status of an order in batch',
    description:
      'Staff updates individual order status while delivering batch (e.g., DELIVERED, FAILED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Order status updated to DELIVERED',
        data: {
          shippingLogId: '...',
          orderId: '...',
          batchCode: 'BATCH-2025-12-05-ABC123',
          status: 'DELIVERED',
          deliveredDate: '2025-12-05T10:30:00.000Z',
        },
      },
    },
  })
  async updateBatchOrder(
    @Param('batchCode') batchCode: string,
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateBatchOrderDto,
    @Request() req,
  ) {
    const staffId = req.user.userId;
    const log = await this.shippingLogsService.updateBatchOrder(
      batchCode,
      updateDto.orderId,
      {
        status: updateDto.status,
        note: updateDto.note,
        unexpectedCase: updateDto.unexpectedCase,
        finishedPictures: updateDto.finishedPictures,
      },
      staffId,
    );
    return ResponseHelper.success(
      `Order status updated to ${updateDto.status}`,
      log,
    );
  }

  @Post('batches/:batchCode/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '✅ Complete batch with batch completion proof',
    description:
      'Staff completes entire batch after all orders are delivered/failed. Uploads batch-level proof photos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch completed successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Batch completed successfully',
        data: {
          batchCode: 'BATCH-2025-12-05-ABC123',
          status: 'COMPLETED',
          orderCount: 3,
          completedCount: 3,
          deliveredCount: 2,
          failedCount: 1,
          completionPhotos: ['url-1', 'url-2'],
          completionNote: 'Đã giao xong tất cả đơn',
          completedAt: '2025-12-05T12:00:00Z',
          codCollected: true,
          totalCodAmount: 450000,
        },
      },
    },
  })
  async completeBatch(
    @Param('batchCode') batchCode: string,
    @Body() completionDto: CompleteBatchDto,
    @Request() req,
  ) {
    const staffId = req.user.userId;
    const result = await this.shippingLogsService.completeBatch(
      batchCode,
      completionDto,
      staffId,
    );
    return ResponseHelper.success('Batch completed successfully', result);
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

  @Get('batch-suggestions/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get batch delivery suggestions for a customer (Staff/Admin)',
    description:
      'Returns orders from same customer that can be batched together for delivery',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch suggestions retrieved',
    schema: {
      example: {
        statusCode: 200,
        message: 'Batch suggestions for customer',
        data: [
          {
            shippingLogId: '550e8400-e29b-41d4-a716-446655440001',
            orderId: '550e8400-e29b-41d4-a716-446655440002',
            status: 'PENDING',
            shippingMethod: 'INTERNAL',
            totalAmount: 150000,
            createdAt: '2025-12-02T10:00:00Z',
          },
          {
            shippingLogId: '550e8400-e29b-41d4-a716-446655440003',
            orderId: '550e8400-e29b-41d4-a716-446655440004',
            status: 'PENDING',
            shippingMethod: 'INTERNAL',
            totalAmount: 200000,
            createdAt: '2025-12-02T11:30:00Z',
          },
        ],
      },
    },
  })
  async getBatchSuggestions(@Param('customerId') customerId: string) {
    const suggestions =
      await this.shippingLogsService.getBatchSuggestions(customerId);
    return ResponseHelper.success(
      'Batch suggestions for customer',
      suggestions,
    );
  }

  @Get('track/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Track order shipping status (Customer)',
    description: 'Get real-time shipping status from GHN for a specific order',
  })
  @ApiResponse({
    status: 200,
    description: 'Shipping tracking info retrieved',
    schema: {
      example: {
        statusCode: 200,
        message: 'Shipping tracking info',
        data: {
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          ghnOrderCode: 'GHNABC123',
          status: 'IN_TRANSIT',
          shippingMethod: 'GHN',
          ghnTracking: {
            status: 'transporting',
            expectedDeliveryTime: '2025-12-05 15:00:00',
            currentLocation: 'Bưu cục Quận 1',
          },
        },
      },
    },
  })
  async trackOrder(@Param('orderId') orderId: string, @Request() req) {
    const tracking = await this.shippingLogsService.trackOrder(
      orderId,
      req.user.userId,
    );
    return ResponseHelper.success('Shipping tracking info', tracking);
  }
}
