import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('shop/:shopId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory for a specific shop' })
  @ApiParam({ name: 'shopId', type: String })
  @ApiResponse({ status: 200, description: 'Returns shop inventory' })
  getShopInventory(@Param('shopId') shopId: string) {
    return this.inventoryService.getShopInventory(shopId);
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get product inventory across all shops' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns product inventory across shops',
  })
  getProductInventory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventoryAcrossShops(productId);
  }

  @Get('batch/:batchId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get batch inventory across all shops' })
  @ApiParam({ name: 'batchId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns batch inventory across shops',
  })
  getBatchInventory(@Param('batchId') batchId: string) {
    return this.inventoryService.getBatchInventoryAcrossShops(batchId);
  }

  @Post('reserve')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve stock for order' })
  @ApiBody({
    schema: {
      properties: {
        shopId: { type: 'string' },
        productId: { type: 'string' },
        quantity: { type: 'number' },
        preferOldestBatch: { type: 'boolean', default: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Stock reserved successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        reservations: {
          type: 'array',
          items: {
            properties: {
              batchId: { type: 'string' },
              quantity: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  reserveStock(
    @Body('shopId') shopId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
    @Body('preferOldestBatch') preferOldestBatch: boolean = true,
  ): Promise<{
    success: boolean;
    reservations: { batchId: string; quantity: number }[];
  }> {
    return this.inventoryService.reserveStock(
      shopId,
      productId,
      quantity,
      preferOldestBatch,
    );
  }

  @Post('release-reservation')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release stock reservation' })
  @ApiBody({
    schema: {
      properties: {
        shopId: { type: 'string' },
        productId: { type: 'string' },
        batchId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation released successfully',
  })
  releaseReservation(
    @Body('shopId') shopId: string,
    @Body('productId') productId: string,
    @Body('batchId') batchId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoryService.releaseReservation(
      shopId,
      productId,
      batchId,
      quantity,
    );
  }

  @Post('confirm-sale')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm sale and remove stock' })
  @ApiBody({
    schema: {
      properties: {
        shopId: { type: 'string' },
        productId: { type: 'string' },
        batchId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Sale confirmed successfully' })
  confirmSale(
    @Body('shopId') shopId: string,
    @Body('productId') productId: string,
    @Body('batchId') batchId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoryService.confirmSale(
      shopId,
      productId,
      batchId,
      quantity,
    );
  }

  @Get('alerts/low-stock')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiQuery({ name: 'shopId', type: String, required: false })
  @ApiQuery({
    name: 'threshold',
    type: Number,
    required: false,
    description: 'Stock threshold (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'Returns low stock items' })
  getLowStockAlerts(
    @Query('shopId') shopId?: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.inventoryService.getLowStockAlerts(shopId, threshold);
  }

  @Get('alerts/expiring')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get expiring batches' })
  @ApiQuery({ name: 'shopId', type: String, required: false })
  @ApiQuery({
    name: 'days',
    type: Number,
    required: false,
    description: 'Days from now (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Returns expiring batches' })
  getExpiringBatches(
    @Query('shopId') shopId?: string,
    @Query('days') days?: number,
  ) {
    return this.inventoryService.getExpiringBatches(shopId, days);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiQuery({ name: 'shopId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Returns inventory summary' })
  getInventorySummary(@Query('shopId') shopId?: string) {
    return this.inventoryService.getInventorySummary(shopId);
  }
}
