import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { DeviceTokensService } from './device-tokens.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TopupBalanceDto } from './dto/topup-balance.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly deviceTokensService: DeviceTokensService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all users (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get user by ID (Admin/Staff only)' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.userId, updateUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reset user password and send email notification (Admin only)',
    description:
      'Generates a random password and sends it to user via email. If email fails, returns the password to admin.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        temporaryPassword: {
          type: 'string',
          description: 'Only present if email delivery failed',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Param('id') id: string) {
    return this.usersService.adminResetPassword(id);
  }

  @Post('topup')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Nạp tiền vào tài khoản',
    description:
      'User có thể nạp tiền vào balance của mình. Min: 10,000 VND, Max: 50,000,000 VND',
  })
  @ApiBody({ type: TopupBalanceDto })
  @ApiResponse({
    status: 200,
    description: 'Nạp tiền thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Nạp tiền thành công',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          fullName: 'Nguyen Van A',
          oldBalance: 100000,
          topupAmount: 500000,
          newBalance: 600000,
          paymentMethod: 'momo',
          note: 'Nạp tiền qua Momo',
          timestamp: '2025-10-21T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount or account disabled',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async topupBalance(@GetUser() user: User, @Body() topupDto: TopupBalanceDto) {
    return this.usersService.topupBalance(user.userId, topupDto);
  }

  @Get('balance')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.DERMATOLOGIST,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({
    summary: 'Xem số dư tài khoản',
    description: 'Lấy thông tin số dư hiện tại của user',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin số dư',
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy thông tin số dư thành công',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          fullName: 'Nguyen Van A',
          balance: 600000,
          currency: 'VND',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@GetUser() user: User) {
    return this.usersService.getBalance(user.userId);
  }

  @Get('topup-history')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.DERMATOLOGIST,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({
    summary: 'Xem lịch sử nạp tiền',
    description:
      'Lấy lịch sử các lần nạp tiền (cần implement transactions table để track đầy đủ)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử nạp tiền',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopupHistory(@GetUser() user: User) {
    return this.usersService.getTopupHistory(user.userId);
  }

  @Post('device-tokens')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.DERMATOLOGIST,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({
    summary: 'Register device token for push notifications',
    description:
      'Register FCM token to receive push notifications on mobile/web',
  })
  @ApiBody({ type: RegisterDeviceTokenDto })
  @ApiResponse({
    status: 201,
    description: 'Device token registered successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async registerDeviceToken(
    @GetUser() user: User,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const deviceToken = await this.deviceTokensService.registerToken(
      user.userId,
      dto,
    );
    return {
      statusCode: 201,
      message: 'Device token registered successfully',
      data: deviceToken,
    };
  }

  @Delete('device-tokens/:fcmToken')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.DERMATOLOGIST,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({
    summary: 'Remove device token (logout from device)',
    description: 'Remove FCM token when user logs out from a device',
  })
  @ApiParam({ name: 'fcmToken', description: 'FCM token to remove' })
  @ApiResponse({
    status: 200,
    description: 'Device token removed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeDeviceToken(
    @GetUser() user: User,
    @Param('fcmToken') fcmToken: string,
  ) {
    await this.deviceTokensService.deleteToken(user.userId, fcmToken);
    return {
      statusCode: 200,
      message: 'Device token removed successfully',
    };
  }
}
