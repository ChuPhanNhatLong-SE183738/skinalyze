import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { StockMovementService } from './stock-movement.service';
import {
  CreateStockMovementDto,
  BulkStockMovementDto,
} from './dto/create-stock-movement.dto';
import { MovementType, MovementStatus } from './entities/stock-movement.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { StockMovement } from './entities/stock-movement.entity';

@ApiTags('Stock Movement')
@ApiBearerAuth()
@Controller('stock-movement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create stock movement request' })
  @ApiBody({ type: CreateStockMovementDto })
  @ApiResponse({
    status: 201,
    description: 'Movement request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createMovement(
    @Body() createDto: CreateStockMovementDto,
    @GetUser() user: User,
  ) {
    return this.stockMovementService.createMovement(createDto, user.userId);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple stock movement requests' })
  @ApiBody({ type: BulkStockMovementDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk movement requests created successfully',
  })
  async createBulkMovements(
    @Body() bulkDto: BulkStockMovementDto,
    @GetUser() user: User,
  ): Promise<StockMovement[]> {
    const results: StockMovement[] = [];
    for (const movement of bulkDto.movements) {
      const result = await this.stockMovementService.createMovement(
        movement,
        user.userId,
      );
      results.push(result);
    }
    return results;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all stock movements with filters' })
  @ApiQuery({ name: 'movementType', enum: MovementType, required: false })
  @ApiQuery({ name: 'status', enum: MovementStatus, required: false })
  @ApiQuery({ name: 'shopId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Returns filtered stock movements' })
  findAll(
    @Query('movementType') movementType?: MovementType,
    @Query('status') status?: MovementStatus,
    @Query('shopId') shopId?: string,
  ) {
    return this.stockMovementService.findAll({
      movementType,
      status,
      shopId,
    });
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get movement history' })
  @ApiQuery({ name: 'productId', type: String, required: false })
  @ApiQuery({ name: 'batchId', type: String, required: false })
  @ApiQuery({ name: 'shopId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Returns movement history' })
  getMovementHistory(
    @Query('productId') productId?: string,
    @Query('batchId') batchId?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.stockMovementService.getMovementHistory(productId, batchId, shopId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get stock movement by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns the stock movement' })
  @ApiResponse({ status: 404, description: 'Movement not found' })
  findOne(@Param('id') id: string) {
    return this.stockMovementService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve stock movement (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Movement approved successfully' })
  @ApiResponse({ status: 400, description: 'Movement cannot be approved' })
  approveMovement(@Param('id') id: string, @GetUser() user: User) {
    return this.stockMovementService.approveMovement(id, user.userId);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject stock movement (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Movement rejected successfully' })
  @ApiResponse({ status: 400, description: 'Movement cannot be rejected' })
  rejectMovement(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @GetUser() user: User,
  ) {
    return this.stockMovementService.rejectMovement(id, user.userId, reason);
  }
}