import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { DermatologistsService } from '../dermatologists/dermatologists.service';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionRepository: Repository<SubscriptionPlan>,
    private readonly dermatologistsService: DermatologistsService,
  ) {}

  async createForUser(
    userId: string,
    body: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);
      if (!dermatologist) {
        throw new NotFoundException('Dermatologist not found');
      }
      const subscription = this.subscriptionRepository.create({
        ...body,
        dermatologist: dermatologist,
        isActive: body.isActive ?? true,
      });

      return this.subscriptionRepository.save(subscription);
    } catch (error) {
      this.handleError(error, 'Failed to create subscription');
    }
  }

  async findAllForUser(userId: string): Promise<SubscriptionPlan[]> {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);
      if (!dermatologist) {
        throw new NotFoundException('Dermatologist not found');
      }
      return this.subscriptionRepository.find({
        where: {
          dermatologist: { dermatologistId: dermatologist.dermatologistId },
        },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.handleError(error, 'Failed to list subscriptions');
    }
  }

  async findOneForUser(
    userId: string,
    subscriptionId: string,
  ): Promise<SubscriptionPlan> {
    try {
      return await this.getOwnedSubscription(userId, subscriptionId);
    } catch (error) {
      this.handleError(error, 'Failed to load subscription');
    }
  }

  async updateForUser(
    userId: string,
    subscriptionId: string,
    body: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    try {
      const subscription = await this.getOwnedSubscription(
        userId,
        subscriptionId,
      );

      Object.assign(subscription, body);

      return this.subscriptionRepository.save(subscription);
    } catch (error) {
      this.handleError(error, 'Failed to update subscription');
    }
  }

  async removeForUser(userId: string, subscriptionId: string): Promise<void> {
    try {
      const subscription = await this.getOwnedSubscription(
        userId,
        subscriptionId,
      );
      await this.subscriptionRepository.remove(subscription);
    } catch (error) {
      this.handleError(error, 'Failed to delete subscription');
    }
  }

  private async getOwnedSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<SubscriptionPlan> {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);
      if (!dermatologist) {
        throw new NotFoundException('Dermatologist not found');
      }
      const subscription = await this.subscriptionRepository.findOne({
        where: {
          planId: subscriptionId,
          dermatologist: { dermatologistId: dermatologist.dermatologistId },
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      return subscription;
    } catch (error) {
      this.handleError(error, 'Failed to resolve subscription ownership');
    }
  }

  private handleError(error: unknown, message: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(message);
  }
}
