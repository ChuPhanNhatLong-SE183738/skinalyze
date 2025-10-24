import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { DermatologistsService } from '../dermatologists/dermatologists.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly dermatologistsService: DermatologistsService,
  ) {}

  async createForUser(
    userId: string,
    body: CreateSubscriptionDto,
  ): Promise<Subscription> {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);
      if (!dermatologist) {
        throw new NotFoundException('Dermatologist not found');
      }
      const subscription = this.subscriptionRepository.create({
        ...body,
        dermatologistId: dermatologist.dermatologistId,
        isActive: body.isActive ?? true,
      });

      return this.subscriptionRepository.save(subscription);
    } catch (error) {
      this.handleError(error, 'Failed to create subscription');
    }
  }

  async findAllForUser(userId: string): Promise<Subscription[]> {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);
      if (!dermatologist) {
        throw new NotFoundException('Dermatologist not found');
      }
      return this.subscriptionRepository.find({
        where: { dermatologistId: dermatologist.dermatologistId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.handleError(error, 'Failed to list subscriptions');
    }
  }

  async findOneForUser(
    userId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    try {
      return await this.getOwnedSubscription(userId, subscriptionId);
    } catch (error) {
      this.handleError(error, 'Failed to load subscription');
    }
  }

  async updateForUser(
    userId: string,
    subscriptionId: string,
    body: UpdateSubscriptionDto,
  ): Promise<Subscription> {
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
  ): Promise<Subscription> {
    try {
      const dermatologist =
        await this.dermatologistsService.findByUserId(userId);
      if (!dermatologist) {
        throw new NotFoundException('Dermatologist not found');
      }
      const subscription = await this.subscriptionRepository.findOne({
        where: {
          subscriptionId,
          dermatologistId: dermatologist.dermatologistId,
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
