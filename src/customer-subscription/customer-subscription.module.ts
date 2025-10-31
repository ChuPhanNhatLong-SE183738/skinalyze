import { Module } from '@nestjs/common';
import { CustomerSubscriptionController } from './customer-subscription.controller';
import { CustomerSubscriptionService } from './customer-subscription.service';

@Module({
  controllers: [CustomerSubscriptionController],
  providers: [CustomerSubscriptionService]
})
export class CustomerSubscriptionModule {}
