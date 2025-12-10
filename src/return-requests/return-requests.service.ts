import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import {
  ReviewReturnRequestDto,
  CompleteReturnDto,
} from './dto/review-return-request.dto';
import {
  ReturnRequest,
  ReturnRequestStatus,
} from './entities/return-request.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import {
  ShippingLog,
  ShippingStatus,
} from '../shipping-logs/entities/shipping-log.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class ReturnRequestsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private returnRequestRepository: Repository<ReturnRequest>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ShippingLog)
    private shippingLogRepository: Repository<ShippingLog>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(
    createReturnRequestDto: CreateReturnRequestDto,
    userId: string,
  ): Promise<ReturnRequest> {
    // Find customer from userId
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin('customer.user', 'user')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    console.log('🔍 Debug - userId:', userId);
    console.log('🔍 Debug - customer.customerId:', customer.customerId);

    // Validate order exists and belongs to customer
    const order = await this.orderRepository.findOne({
      where: { orderId: createReturnRequestDto.orderId },
      relations: ['customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    console.log('🔍 Debug - order.customerId:', order.customerId);

    if (order.customerId !== customer.customerId) {
      throw new ForbiddenException(
        'You can only create return request for your own orders',
      );
    }

    // Validate order status is DELIVERED
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Can only create return request for delivered orders',
      );
    }

    // Validate shipping log exists and status is DELIVERED
    const shippingLog = await this.shippingLogRepository.findOne({
      where: { shippingLogId: createReturnRequestDto.shippingLogId },
    });

    if (!shippingLog) {
      throw new NotFoundException('Shipping log not found');
    }

    if (shippingLog.status !== ShippingStatus.DELIVERED) {
      throw new BadRequestException(
        'Can only create return request for delivered shipments',
      );
    }

    // Check if return request already exists
    const existingRequest = await this.returnRequestRepository.findOne({
      where: {
        orderId: createReturnRequestDto.orderId,
        shippingLogId: createReturnRequestDto.shippingLogId,
      },
    });

    if (
      existingRequest &&
      existingRequest.status !== ReturnRequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Return request already exists for this order',
      );
    }

    // Create return request
    const returnRequest = this.returnRequestRepository.create({
      ...createReturnRequestDto,
      customerId: customer.customerId,
      status: ReturnRequestStatus.PENDING,
    });

    return this.returnRequestRepository.save(returnRequest);
  }

  async findAll(): Promise<ReturnRequest[]> {
    return this.returnRequestRepository.find({
      relations: [
        'order',
        'shippingLog',
        'customer',
        'reviewedByStaff',
        'assignedStaff',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(userId: string): Promise<ReturnRequest[]> {
    // Find customer from userId
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin('customer.user', 'user')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.returnRequestRepository.find({
      where: { customerId: customer.customerId },
      relations: ['order', 'shippingLog', 'reviewedByStaff', 'assignedStaff'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<ReturnRequest[]> {
    return this.returnRequestRepository.find({
      where: { status: ReturnRequestStatus.PENDING },
      relations: ['order', 'shippingLog', 'customer'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRequestRepository.findOne({
      where: { returnRequestId: id },
      relations: [
        'order',
        'shippingLog',
        'customer',
        'reviewedByStaff',
        'assignedStaff',
      ],
    });

    if (!returnRequest) {
      throw new NotFoundException(`Return request with ID ${id} not found`);
    }

    return returnRequest;
  }

  // Staff approve return request
  async approve(
    id: string,
    staffId: string,
    reviewDto?: ReviewReturnRequestDto,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      throw new BadRequestException('Can only approve pending return requests');
    }

    returnRequest.status = ReturnRequestStatus.APPROVED;
    returnRequest.reviewedByStaffId = staffId;
    returnRequest.reviewedAt = new Date();
    if (reviewDto?.reviewNote) {
      returnRequest.reviewNote = reviewDto.reviewNote;
    }

    return this.returnRequestRepository.save(returnRequest);
  }

  // Staff reject return request
  async reject(
    id: string,
    staffId: string,
    reviewDto?: ReviewReturnRequestDto,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      throw new BadRequestException('Can only reject pending return requests');
    }

    returnRequest.status = ReturnRequestStatus.REJECTED;
    returnRequest.reviewedByStaffId = staffId;
    returnRequest.reviewedAt = new Date();
    if (reviewDto?.reviewNote) {
      returnRequest.reviewNote = reviewDto.reviewNote;
    }

    return this.returnRequestRepository.save(returnRequest);
  }

  // Staff assign themselves to handle return
  async assignStaff(id: string, staffId: string): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Can only assign staff to approved return requests',
      );
    }

    returnRequest.status = ReturnRequestStatus.IN_PROGRESS;
    returnRequest.assignedStaffId = staffId;
    returnRequest.assignedAt = new Date();

    // Update shipping log status to RETURNING
    await this.shippingLogRepository.update(
      { shippingLogId: returnRequest.shippingLogId },
      { status: ShippingStatus.RETURNING },
    );

    return this.returnRequestRepository.save(returnRequest);
  }

  // Staff complete return (arrived at warehouse)
  async complete(
    id: string,
    staffId: string,
    completeDto: CompleteReturnDto,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnRequestStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Can only complete in-progress return requests',
      );
    }

    if (returnRequest.assignedStaffId !== staffId) {
      throw new ForbiddenException(
        'Only assigned staff can complete this return',
      );
    }

    returnRequest.status = ReturnRequestStatus.COMPLETED;
    returnRequest.returnedToWarehouseAt = new Date();
    if (completeDto.completionNote) {
      returnRequest.completionNote = completeDto.completionNote;
    }
    if (completeDto.returnCompletionPhotos) {
      returnRequest.returnCompletionPhotos = completeDto.returnCompletionPhotos;
    }

    // Update shipping log status to RETURNED
    await this.shippingLogRepository.update(
      { shippingLogId: returnRequest.shippingLogId },
      { status: ShippingStatus.RETURNED },
    );

    return this.returnRequestRepository.save(returnRequest);
  }

  // Customer cancel return request (only if PENDING)
  async cancel(id: string, userId: string): Promise<ReturnRequest> {
    // Find customer from userId
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin('customer.user', 'user')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    const returnRequest = await this.findOne(id);

    if (returnRequest.customerId !== customer.customerId) {
      throw new ForbiddenException(
        'You can only cancel your own return requests',
      );
    }

    if (returnRequest.status !== ReturnRequestStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending return requests');
    }

    returnRequest.status = ReturnRequestStatus.CANCELLED;
    return this.returnRequestRepository.save(returnRequest);
  }

  async remove(id: string): Promise<void> {
    const returnRequest = await this.findOne(id);
    await this.returnRequestRepository.remove(returnRequest);
  }
}
