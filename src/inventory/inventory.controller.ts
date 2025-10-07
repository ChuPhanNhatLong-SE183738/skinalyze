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

// Import DTOs
import {
  ReserveStockDto,
  ReleaseReservationDto,
  ConfirmSaleDto,
  ConfirmMultipleSalesDto,
  AdjustStockDto,
} from './dto/create-inventory.dto';

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
    description: 'Returns batches sorted by expiry date (oldest first)'
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
      batchId
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
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve stock (FIFO by default)' })
  @ApiBody({ type: ReserveStockDto })
  @ApiResponse({ status: 200, description: 'Stock reserved successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  reserveStock(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserveStock(
      dto.shopId,
      dto.productId,
      dto.quantity,
      dto.useFIFO ?? true,
    );
  }

  @Post('release-reservation')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release stock reservation' })
  @ApiBody({ type: ReleaseReservationDto })
  @ApiResponse({ status: 200, description: 'Reservation released' })
  releaseReservation(@Body() dto: ReleaseReservationDto) {
    return this.inventoryService.releaseReservation(
      dto.shopId,
      dto.productId,
      dto.batchId,
      dto.quantity,
    );
  }

  @Post('confirm-sale')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm sale (single batch)' })
  @ApiBody({ type: ConfirmSaleDto })
  @ApiResponse({ status: 200, description: 'Sale confirmed' })
  confirmSale(@Body() dto: ConfirmSaleDto) {
    return this.inventoryService.confirmSale(
      dto.shopId,
      dto.productId,
      dto.batchId,
      dto.quantity,
    );
  }

  @Post('confirm-sales')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm multiple sales (FIFO orders)' })
  @ApiBody({ type: ConfirmMultipleSalesDto })
  @ApiResponse({ status: 200, description: 'Multiple sales confirmed' })
  async confirmMultipleSales(@Body() dto: ConfirmMultipleSalesDto) {
    await this.inventoryService.confirmMultipleSales(dto.shopId, dto.sales);
    return {
      success: true,
      confirmedSales: dto.sales,
    };
  }

  @Post('adjust')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually adjust stock (Admin only)' })
  @ApiBody({ type: AdjustStockDto })
  @ApiResponse({ status: 200, description: 'Stock adjusted' })
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStockByBatch(
      dto.shopId,
      dto.productId,
      dto.batchId,
      dto.quantity,
    );
  }
}