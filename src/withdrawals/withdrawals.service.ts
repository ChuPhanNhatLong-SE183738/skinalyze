import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WithdrawalRequest,
  WithdrawalStatus,
} from './entities/withdrawal-request.entity';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(WithdrawalRequest)
    private readonly withdrawalRepository: Repository<WithdrawalRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private censorAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return '****';
    }
    const visibleStart = accountNumber.substring(0, 2);
    const visibleEnd = accountNumber.substring(accountNumber.length - 2);
    const maskedLength = accountNumber.length - 4;
    const masked = '*'.repeat(maskedLength);
    return `${visibleStart}${masked}${visibleEnd}`;
  }

  private sanitizeRequest(request: WithdrawalRequest): WithdrawalRequest {
    if (request.accountNumber) {
      request.accountNumber = this.censorAccountNumber(request.accountNumber);
    }
    return request;
  }

  async createRequest(
    userId: string,
    createDto: CreateWithdrawalRequestDto,
  ): Promise<WithdrawalRequest> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.balance < createDto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Current balance: ${user.balance} VND`,
      );
    }

    const otpCode = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    const request = this.withdrawalRepository.create({
      userId,
      fullName: createDto.fullName,
      amount: createDto.amount,
      type: createDto.type,
      bankName: createDto.bankName,
      accountNumber: createDto.accountNumber,
      notes: createDto.notes,
      otpCode,
      otpExpiry,
      status: WithdrawalStatus.PENDING,
    });

    const saved = await this.withdrawalRepository.save(request);

    await this.emailService.sendWithdrawalOTP(
      user.email,
      otpCode,
      createDto.amount,
      createDto.bankName,
      createDto.accountNumber,
    );

    return this.sanitizeRequest(saved);
  }

  async verifyOTP(
    userId: string,
    requestId: string,
    otpCode: string,
  ): Promise<WithdrawalRequest> {
    const request = await this.withdrawalRepository.findOne({
      where: { requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(
        'This request has already been processed',
      );
    }

    if (!request.otpCode || !request.otpExpiry) {
      throw new BadRequestException('OTP not found for this request');
    }

    if (new Date() > request.otpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    if (request.otpCode !== otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    request.status = WithdrawalStatus.VERIFIED;
    request.verifiedAt = new Date();
    request.otpCode = null;
    request.otpExpiry = null;

    const saved = await this.withdrawalRepository.save(request);
    return this.sanitizeRequest(saved);
  }

  async resendOTP(userId: string, requestId: string): Promise<void> {
    const request = await this.withdrawalRepository.findOne({
      where: { requestId, userId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(
        'Cannot resend OTP for this request status',
      );
    }

    const otpCode = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    request.otpCode = otpCode;
    request.otpExpiry = otpExpiry;

    await this.withdrawalRepository.save(request);

    await this.emailService.sendWithdrawalOTP(
      request.user.email,
      otpCode,
      request.amount,
      request.bankName,
      request.accountNumber,
    );
  }

  async getMyRequests(userId: string): Promise<WithdrawalRequest[]> {
    const requests = await this.withdrawalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return requests.map(req => this.sanitizeRequest(req));
  }

  async getAllRequests(status?: WithdrawalStatus): Promise<WithdrawalRequest[]> {
    const where = status ? { status } : {};
    const requests = await this.withdrawalRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return requests.map(req => this.sanitizeRequest(req));
  }

  async updateStatus(
    requestId: string,
    adminUserId: string,
    updateDto: UpdateWithdrawalStatusDto,
  ): Promise<WithdrawalRequest> {
    const request = await this.withdrawalRepository.findOne({
      where: { requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (
      updateDto.status === WithdrawalStatus.APPROVED &&
      request.status !== WithdrawalStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Request must be verified before approval',
      );
    }

    if (updateDto.status === WithdrawalStatus.APPROVED) {
      const user = request.user;
      
      if (user.balance < request.amount) {
        throw new BadRequestException('User has insufficient balance');
      }

      user.balance = Number(user.balance) - Number(request.amount);
      await this.userRepository.save(user);

      request.approvedAt = new Date();
      request.approvedBy = adminUserId;
    }

    if (updateDto.status === WithdrawalStatus.REJECTED) {
      request.rejectionReason = updateDto.rejectionReason || null;
    }

    if (updateDto.status === WithdrawalStatus.COMPLETED) {
      request.completedAt = new Date();
    }

    request.status = updateDto.status;
    const updated = await this.withdrawalRepository.save(request);

    await this.emailService.sendWithdrawalStatusUpdate(
      request.user.email,
      updateDto.status,
      request.amount,
      request.bankName,
      updateDto.rejectionReason,
    );

    return this.sanitizeRequest(updated);
  }

  async cancelRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.withdrawalRepository.findOne({
      where: { requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (
      request.status !== WithdrawalStatus.PENDING &&
      request.status !== WithdrawalStatus.VERIFIED
    ) {
      throw new BadRequestException('Cannot cancel this request');
    }

    request.status = WithdrawalStatus.CANCELLED;
    await this.withdrawalRepository.save(request);
  }
}
