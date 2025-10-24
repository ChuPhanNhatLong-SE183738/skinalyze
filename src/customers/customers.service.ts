import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      analysisId: createCustomerDto.analysisId || [],
      purchaseHistory: createCustomerDto.purchaseHistory || [],
    });
    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { customerId: id },
      relations: ['user'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async incrementAiUsage(userId: string): Promise<Customer> {
    const customer = await this.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException(`Customer with userId ${userId} not found`);
    }
    customer.aiUsageAmount += 1;
    return await this.customerRepository.save(customer);
  }

  async addAnalysis(userId: string, analysisId: string): Promise<Customer> {
    const customer = await this.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException(`Customer with userId ${userId} not found`);
    }
    if (!customer.analysisId) {
      customer.analysisId = [];
    }
    customer.analysisId.push(analysisId);
    return await this.customerRepository.save(customer);
  }

  async addPurchase(userId: string, purchaseData: any): Promise<Customer> {
    const customer = await this.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException(`Customer with userId ${userId} not found`);
    }
    if (!customer.purchaseHistory) {
      customer.purchaseHistory = [];
    }
    customer.purchaseHistory.push(purchaseData);
    return await this.customerRepository.save(customer);
  }

  async subscribeToPlan(
    userId: string,
    subscriptionId: string,
  ): Promise<Customer> {
    const customer = await this.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException(`Customer with userId ${userId} not found`);
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { subscriptionId, isActive: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found or inactive');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.durationInDays);

    const subscriptionHistory = [...(customer.subscriptionId ?? [])];
    subscriptionHistory.push(subscription.subscriptionId);

    customer.startDate = startDate;
    customer.endDate = endDate;
    customer.sessionRemaining = subscription.totalSessions;
    customer.subscriptionId = subscriptionHistory;

    return await this.customerRepository.save(customer);
  }
}
