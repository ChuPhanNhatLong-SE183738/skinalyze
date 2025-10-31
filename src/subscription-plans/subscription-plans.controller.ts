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
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { ResponseHelper } from '../utils/responses';

@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DERMATOLOGIST)
export class SubscriptionPlansController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto,
  ) {
    const subscription = await this.subscriptionPlansService.createForUser(
      user.userId,
      createSubscriptionPlanDto,
    );

    return ResponseHelper.created(
      'Subscription created successfully',
      subscription,
    );
  }

  @Get()
  async findAll(@GetUser() user: User) {
    const subscriptions = await this.subscriptionPlansService.findAllForUser(
      user.userId,
    );

    return ResponseHelper.success(
      'Subscriptions retrieved successfully',
      subscriptions,
    );
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id') id: string) {
    const subscription = await this.subscriptionPlansService.findOneForUser(
      user.userId,
      id,
    );

    return ResponseHelper.success('Subscription retrieved', subscription);
  }

  @Patch(':id')
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
  ) {
    const subscription = await this.subscriptionPlansService.updateForUser(
      user.userId,
      id,
      updateSubscriptionPlanDto,
    );

    return ResponseHelper.success('Subscription updated', subscription);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@GetUser() user: User, @Param('id') id: string) {
    await this.subscriptionPlansService.removeForUser(user.userId, id);
  }
}
