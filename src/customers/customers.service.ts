import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
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
}
