import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
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
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ImportProductDto } from './dto/create-batch.dto';
import { ExportProductDto } from './dto/create-batch.dto';

@ApiTags('Batches')
@ApiBearerAuth()
@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new batch (Admin/Staff only)' })
  @ApiBody({ type: CreateBatchDto })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  create(@Body() createBatchDto: CreateBatchDto, @GetUser() user: User) {
    return this.batchesService.create(createBatchDto, user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all batches (Admin/Staff only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'Returns all batches' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.batchesService.findByStatus(status);
    }
    return this.batchesService.findAll();
  }

  @Get('my-batches')
  @ApiOperation({ summary: 'Get current user batches' })
  @ApiResponse({ status: 200, description: 'Returns user batches' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findMyBatches(@GetUser() user: User) {
    return this.batchesService.findByUser(user.userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get batch by ID (Admin/Staff only)' })
  @ApiParam({ name: 'id', type: String, description: 'Batch UUID' })
  @ApiResponse({ status: 200, description: 'Returns the batch' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update batch by ID (Admin/Staff only)' })
  @ApiParam({ name: 'id', type: String, description: 'Batch UUID' })
  @ApiBody({ type: UpdateBatchDto })
  @ApiResponse({ status: 200, description: 'Batch updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  update(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve batch (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Batch UUID' })
  @ApiResponse({ status: 200, description: 'Batch approved successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  approveBatch(@Param('id') id: string) {
    return this.batchesService.approveBatch(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject batch (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Batch UUID' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Batch rejected successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  rejectBatch(@Param('id') id: string, @Body('reason') reason: string) {
    return this.batchesService.rejectBatch(id, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete batch by ID (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Batch UUID' })
  @ApiResponse({ status: 204, description: 'Batch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  remove(@Param('id') id: string) {
    return this.batchesService.remove(id);
  }

  @Get('stock-history/:productId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get stock history for a product' })
  @ApiParam({ name: 'productId', type: String, description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Returns stock history' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  getStockHistory(@Param('productId') productId: string) {
    return this.batchesService.getStockHistory(productId);
  }
}
