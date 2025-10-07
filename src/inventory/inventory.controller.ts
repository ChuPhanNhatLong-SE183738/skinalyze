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
import { ResponseHelper } from '../utils/responses';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { ReleaseReservationDto } from './dto/release-reservation.dto';
import { ConfirmSaleDto } from './dto/confirm-sale.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ===== GET ENDPOINTS =====

  @Get('shop/:shopId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory for a specific shop' })
  @ApiParam({ name: 'shopId', type: String })
  @ApiResponse({ status: 200, description: 'Returns shop inventory' })
  getShopInventory(@Param('shopId') shopId: string) {
    return this.inventoryService.getShopInventory(shopId);
  }

  @Get('shop/:shopId/product/:productId/batches')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get all batches for a product (FIFO order)',
    description: 'Returns batches sorted by expiry date (oldest first)',
  })
  @ApiParam({ name: 'shopId' })
  @ApiParam({ name: 'productId' })
  @ApiResponse({ status: 200, description: 'Returns batches in FIFO order' })
  getProductBatches(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
  ) {
    return this.inventoryService.getProductBatches(shopId, productId);
  }

  @Get('shop/:shopId/product/:productId/available')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get available stock for a product' })
  @ApiParam({ name: 'shopId' })
  @ApiParam({ name: 'productId' })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiResponse({ status: 200, description: 'Returns available stock quantity' })
  async getAvailableStock(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @Query('batchId') batchId?: string,
  ) {
    const available = await this.inventoryService.getAvailableStock(
      shopId,
      productId,
      batchId,
    );
    return { available };
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get product inventory across all shops' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Returns product inventory' })
  getProductInventory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventoryAcrossShops(productId);
  }

  @Get('batch/:batchId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get batch inventory across all shops' })
  @ApiParam({ name: 'batchId', type: String })
  @ApiResponse({ status: 200, description: 'Returns batch inventory' })
  getBatchInventory(@Param('batchId') batchId: string) {
    return this.inventoryService.getBatchInventoryAcrossShops(batchId);
  }

  @Get('alerts/low-stock')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiQuery({ name: 'shopId', type: String, required: false })
  @ApiQuery({ name: 'threshold', type: Number, required: false })
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
  @ApiQuery({ name: 'days', type: Number, required: false })
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

  // ===== POST ENDPOINTS =====

  @Post('reserve')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reserve stock khi thêm vào giỏ',
    description: 'Tự động lấy batch gần hết hạn trước (FEFO)',
  })
  @ApiBody({ type: ReserveStockDto })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        statusCode: 200,
        message: 'Đã reserve 80 sản phẩm',
        data: {
          success: true,
          reservations: [
            { batchId: 'BATCH-2024-12', quantity: 50 },
            { batchId: 'BATCH-2025-01', quantity: 30 },
          ],
        },
      },
    },
  })
  async reserveStock(@Body() dto: ReserveStockDto) {
    const result = await this.inventoryService.reserveStock(
      dto.shopId,
      dto.productId,
      dto.quantity,
    );

    if (!result.success) {
      return ResponseHelper.badRequest('Không đủ hàng trong kho');
    }

    return ResponseHelper.success(
      `Đã reserve ${dto.quantity} sản phẩm`,
      result,
    );
  }

  @Post('release-reservation')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release reservation khi xóa khỏi giỏ' })
  @ApiBody({ type: ReleaseReservationDto })
  @ApiResponse({ status: 200, description: 'Released' })
  async releaseReservation(@Body() dto: ReleaseReservationDto) {
    await this.inventoryService.releaseReservation(
      dto.shopId,
      dto.productId,
      dto.batchId,
      dto.quantity,
    );
    return ResponseHelper.success('Đã release reservation');
  }

  @Post('confirm-sale')
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm sale khi đặt hàng',
    description: 'Giảm currentStock và reservedStock',
  })
  @ApiBody({ type: ConfirmSaleDto })
  @ApiResponse({ status: 200, description: 'Sale confirmed' })
  async confirmSale(@Body() dto: ConfirmSaleDto) {
    await this.inventoryService.confirmSale(
      dto.shopId,
      dto.productId,
      dto.batchId,
      dto.quantity,
    );
    return ResponseHelper.success('Đã xác nhận bán hàng');
  }
}
