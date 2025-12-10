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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import {
  ReviewReturnRequestDto,
  CompleteReturnDto,
} from './dto/review-return-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Return Requests')
@Controller('return-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReturnRequestsController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Customer creates return request (CUSTOMER only)' })
  create(
    @Body() createReturnRequestDto: CreateReturnRequestDto,
    @Request() req,
  ) {
    return this.returnRequestsService.create(
      createReturnRequestDto,
      req.user.userId,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all return requests (ADMIN/STAFF only)' })
  findAll() {
    return this.returnRequestsService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get pending return requests (ADMIN/STAFF only)' })
  findPending() {
    return this.returnRequestsService.findPending();
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get my return requests (CUSTOMER)' })
  findMyRequests(@Request() req) {
    return this.returnRequestsService.findByCustomer(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get return request by ID' })
  findOne(@Param('id') id: string) {
    return this.returnRequestsService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Approve return request (STAFF/ADMIN only)' })
  approve(
    @Param('id') id: string,
    @Body() reviewDto: ReviewReturnRequestDto,
    @Request() req,
  ) {
    return this.returnRequestsService.approve(id, req.user.userId, reviewDto);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Reject return request (STAFF/ADMIN only)' })
  reject(
    @Param('id') id: string,
    @Body() reviewDto: ReviewReturnRequestDto,
    @Request() req,
  ) {
    return this.returnRequestsService.reject(id, req.user.userId, reviewDto);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Staff assigns themselves to handle return' })
  assignStaff(@Param('id') id: string, @Request() req) {
    return this.returnRequestsService.assignStaff(id, req.user.userId);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Staff completes return (arrived at warehouse)' })
  complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteReturnDto,
    @Request() req,
  ) {
    return this.returnRequestsService.complete(
      id,
      req.user.userId,
      completeDto,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Customer cancels return request (PENDING only)' })
  cancel(@Param('id') id: string, @Request() req) {
    return this.returnRequestsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete return request (ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.returnRequestsService.remove(id);
  }
}
