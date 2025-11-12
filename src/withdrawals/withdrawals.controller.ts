import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import {
  CreateWithdrawalRequestDto,
  VerifyOtpDto,
} from './dto/create-withdrawal-request.dto';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ResponseHelper } from '../utils/responses';
import { WithdrawalStatus } from './entities/withdrawal-request.entity';

@ApiTags('Withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({
    summary: 'Create withdrawal request (Dermatologist only)',
    description: 'Creates a new withdrawal request and sends OTP to email for verification',
  })
  @ApiResponse({ status: 201, description: 'Withdrawal request created, OTP sent to email' })
  async createRequest(
    @GetUser() user: User,
    @Body() createDto: CreateWithdrawalRequestDto,
  ) {
    const request = await this.withdrawalsService.createRequest(
      user.userId,
      createDto,
    );
    return ResponseHelper.created(
      'Withdrawal request created. Please check your email for OTP code.',
      {
        requestId: request.requestId,
        amount: request.amount,
        status: request.status,
      },
    );
  }

  @Post(':requestId/verify-otp')
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({
    summary: 'Verify OTP for withdrawal request',
    description: 'Verifies the OTP code sent to email',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOTP(
    @GetUser() user: User,
    @Param('requestId') requestId: string,
    @Body() verifyDto: VerifyOtpDto,
  ) {
    const request = await this.withdrawalsService.verifyOTP(
      user.userId,
      requestId,
      verifyDto.otpCode,
    );
    return ResponseHelper.success('OTP verified successfully', {
      requestId: request.requestId,
      status: request.status,
      verifiedAt: request.verifiedAt,
    });
  }

  @Post(':requestId/resend-otp')
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({
    summary: 'Resend OTP code',
    description: 'Generates and sends a new OTP code to email',
  })
  @ApiResponse({ status: 200, description: 'New OTP sent to email' })
  async resendOTP(
    @GetUser() user: User,
    @Param('requestId') requestId: string,
  ) {
    await this.withdrawalsService.resendOTP(user.userId, requestId);
    return ResponseHelper.success('New OTP code sent to your email');
  }

  @Get('my-requests')
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({
    summary: 'Get my withdrawal requests',
    description: 'Returns all withdrawal requests for the authenticated dermatologist',
  })
  @ApiResponse({ status: 200, description: 'Withdrawal requests retrieved successfully' })
  async getMyRequests(@GetUser() user: User) {
    const requests = await this.withdrawalsService.getMyRequests(user.userId);
    return ResponseHelper.success(
      'Your withdrawal requests retrieved successfully',
      requests,
    );
  }

  @Get()
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all withdrawal requests (Staff/Admin only)',
    description: 'Returns all withdrawal requests with optional status filter',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: WithdrawalStatus,
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'Withdrawal requests retrieved successfully' })
  async getAllRequests(@Query('status') status?: WithdrawalStatus) {
    const requests = await this.withdrawalsService.getAllRequests(status);
    return ResponseHelper.success(
      'Withdrawal requests retrieved successfully',
      requests,
    );
  }

  @Patch(':requestId/status')
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update withdrawal request status (Staff/Admin only)',
    description: 'Approves, rejects, or completes a withdrawal request',
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @GetUser() user: User,
    @Param('requestId') requestId: string,
    @Body() updateDto: UpdateWithdrawalStatusDto,
  ) {
    const request = await this.withdrawalsService.updateStatus(
      requestId,
      user.userId,
      updateDto,
    );
    return ResponseHelper.success('Withdrawal request status updated', request);
  }

  @Delete(':requestId')
  @Roles(UserRole.DERMATOLOGIST)
  @ApiOperation({
    summary: 'Cancel withdrawal request',
    description: 'Cancels a pending or verified withdrawal request',
  })
  @ApiResponse({ status: 200, description: 'Request cancelled successfully' })
  async cancelRequest(
    @GetUser() user: User,
    @Param('requestId') requestId: string,
  ) {
    await this.withdrawalsService.cancelRequest(user.userId, requestId);
    return ResponseHelper.success('Withdrawal request cancelled');
  }
}
