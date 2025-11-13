import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ResponseHelper } from '../utils/responses';
import { CustomerSubscriptionService } from './customer-subscription.service';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerSubscriptionDto } from './dto/create-customer-subscription.dto';

@ApiTags('Customer Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer-subscriptions')
export class CustomerSubscriptionController {
  constructor(
    private readonly customerSubscriptionService: CustomerSubscriptionService,
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a payment request for a subscription' })
  @ApiCreatedResponse({
    description: 'Payment request created. Awaiting payment.',
  })
  async createSubscriptionPayment(
    @GetUser() user: User,
    @Body() createDto: CreateCustomerSubscriptionDto,
  ) {
    const customer = await this.customersService.findByUserId(user.userId);
    const payment =
      await this.customerSubscriptionService.createSubscriptionPayment(
        customer.customerId,
        createDto,
      );

    return ResponseHelper.created(
      'Yêu cầu đăng ký gói đã được tạo. Vui lòng hoàn tất thanh toán.',
      {
        paymentInfo: {
          paymentCode: payment.paymentCode,
          amount: payment.amount,
          expiredAt: payment.expiredAt,
          // qrCodeUrl: `https://img.vietqr.io/image/MB-YOUR_BANK_ACCOUNT-compact2.png?amount=${payment.amount}&addInfo=${payment.paymentCode}`,
        },
      },
    );
  }

  @Get('my')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all my subscriptions (Customer only)' })
  @ApiOkResponse({ description: 'Subscriptions retrieved successfully.' })
  async getMySubscriptions(@GetUser() user: User) {
    const customer = await this.customersService.findByUserId(user.userId);
    const subscriptions =
      await this.customerSubscriptionService.findByCustomerId(
        customer.customerId,
      );

    return ResponseHelper.success(
      'Lấy danh sách gói thành công',
      subscriptions,
    );
  }

  @Get('my/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get details of my subscription (Customer only)' })
  @ApiOkResponse({ description: 'Subscription details retrieved.' })
  async getMySubscriptionDetails(
    @GetUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const customer = await this.customersService.findByUserId(user.userId);
    const subscription =
      await this.customerSubscriptionService.findOneByIdAndCustomer(
        id,
        customer.customerId,
      );

    return ResponseHelper.success('Lấy chi tiết gói thành công', subscription);
  }
}
