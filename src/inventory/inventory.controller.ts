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

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all inventory' })
  @ApiResponse({ status: 200, description: 'Returns all inventory' })
  getAllInventory() {
    return this.inventoryService.getAllInventory();
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory for specific product' })
  @ApiParam({ name: 'productId' })
  @ApiResponse({ status: 200, description: 'Returns product inventory' })
  getProductInventory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventory(productId);
  }

  @Get('product/:productId/available')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get available stock for product' })
  @ApiParam({ name: 'productId' })
  @ApiResponse({ status: 200, description: 'Returns available stock' })
  async getAvailableStock(@Param('productId') productId: string) {
    const available = await this.inventoryService.getAvailableStock(productId);
    return { productId, available };
  }

  @Get('alerts/low-stock')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns low stock products' })
  getLowStockAlerts(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockAlerts(threshold);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiResponse({ status: 200, description: 'Returns summary stats' })
  getInventorySummary() {
    return this.inventoryService.getInventorySummary();
  }

  @Post('adjust')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust inventory stock' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number', description: '+/- to add/remove' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock adjusted' })
  async adjustStock(@Body() dto: { productId: string; quantity: number }) {
    await this.inventoryService.adjustStock(dto.productId, dto.quantity);
    return ResponseHelper.success('Stock adjusted successfully');
  }

  @Post('set')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set inventory stock' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId', 'quantity'],
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
        originalPrice: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock set' })
  async setStock(
    @Body()
    dto: {
      productId: string;
      quantity: number;
      originalPrice?: number;
    },
  ) {
    await this.inventoryService.setStock(
      dto.productId,
      dto.quantity,
      dto.originalPrice,
    );
    return ResponseHelper.success('Stock set successfully');
  }

  @Post('reserve')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve stock' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock reserved' })
  async reserveStock(@Body() dto: { productId: string; quantity: number }) {
    const result = await this.inventoryService.reserveStock(
      dto.productId,
      dto.quantity,
    );

    if (!result.success) {
      return ResponseHelper.badRequest('Không đủ hàng trong kho');
    }

    return ResponseHelper.success('Stock reserved successfully', result);
  }

  @Post('release')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release reservation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Reservation released' })
  async releaseReservation(
    @Body() dto: { productId: string; quantity: number },
  ) {
    await this.inventoryService.releaseReservation(dto.productId, dto.quantity);
    return ResponseHelper.success('Reservation released successfully');
  }

  @Post('confirm-sale')
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm sale' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Sale confirmed' })
  async confirmSale(@Body() dto: { productId: string; quantity: number }) {
    await this.inventoryService.confirmSale(dto.productId, dto.quantity);
    return ResponseHelper.success('Sale confirmed successfully');
  }
}
