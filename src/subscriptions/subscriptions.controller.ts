import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ResponseHelper } from '../utils/responses';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DERMATOLOGIST)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionsService.createForUser(
      user.userId,
      createSubscriptionDto,
    );

    return ResponseHelper.created(
      'Subscription created successfully',
      subscription,
    );
  }

  @Get()
  async findAll(@GetUser() user: User) {
    const subscriptions = await this.subscriptionsService.findAllForUser(
      user.userId,
    );

    return ResponseHelper.success(
      'Subscriptions retrieved successfully',
      subscriptions,
    );
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id') id: string) {
    const subscription = await this.subscriptionsService.findOneForUser(
      user.userId,
      id,
    );

    return ResponseHelper.success('Subscription retrieved', subscription);
  }

  @Patch(':id')
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const subscription = await this.subscriptionsService.updateForUser(
      user.userId,
      id,
      updateSubscriptionDto,
    );

    return ResponseHelper.success('Subscription updated', subscription);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@GetUser() user: User, @Param('id') id: string) {
    await this.subscriptionsService.removeForUser(user.userId, id);
  }
}
