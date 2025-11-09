import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TopupBalanceDto } from './dto/topup-balance.dto';
import { User } from './entities/user.entity';
import { ResponseHelper } from '../utils/responses';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Validate required fields
    if (
      !createUserDto.email ||
      !createUserDto.password ||
      !createUserDto.fullName
    ) {
      throw new BadRequestException(
        'Email, password, and fullName are required fields',
      );
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['addresses'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
      relations: ['addresses'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['addresses'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Admin reset password - generates random password and sends email to user
   */
  async adminResetPassword(
    userId: string,
  ): Promise<{ message: string; temporaryPassword?: string }> {
    const user = await this.findOne(userId);

    // Generate random 16-character password
    const newPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8).toUpperCase();

    // Hash password
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Try to send email notification to user
    let emailSent = false;
    try {
      await this.emailService.sendAdminPasswordResetEmail(
        user.email,
        user.fullName,
        newPassword,
      );
      emailSent = true;
    } catch (error) {
      // Log error but don't fail the reset
      console.error('Failed to send password reset email:', error.message);
    }

    // Return password to admin if email failed
    if (emailSent) {
      return {
        message: `Password has been reset and sent to ${user.email}`,
      };
    } else {
      return {
        message: `Password has been reset but email delivery failed. Please provide this password to the user manually.`,
        temporaryPassword: newPassword,
      };
    }
  }

  async topupBalance(userId: string, topupDto: TopupBalanceDto) {
    const user = await this.findOne(userId);

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }

    // Validate amount
    if (topupDto.amount < 10000) {
      throw new BadRequestException('Số tiền nạp tối thiểu là 10,000 VND');
    }

    if (topupDto.amount > 50000000) {
      throw new BadRequestException('Số tiền nạp tối đa là 50,000,000 VND');
    }

    // Calculate new balance
    const oldBalance = parseFloat(user.balance.toString());
    const newBalance = oldBalance + topupDto.amount;

    // Update user balance
    user.balance = newBalance;
    await this.userRepository.save(user);

    // Return transaction info
    return ResponseHelper.success('Nạp tiền thành công', {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      oldBalance,
      topupAmount: topupDto.amount,
      newBalance,
      paymentMethod: topupDto.paymentMethod || 'unknown',
      note: topupDto.note,
      timestamp: new Date(),
    });
  }

  async getBalance(userId: string) {
    const user = await this.findOne(userId);
    return ResponseHelper.success('Lấy thông tin số dư thành công', {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      balance: parseFloat(user.balance.toString()),
      currency: 'VND',
    });
  }

  async getTopupHistory(userId: string) {
    // Note: Để track history đầy đủ, nên tạo bảng transactions riêng
    // Hiện tại chỉ return current balance
    const user = await this.findOne(userId);
    return ResponseHelper.success('Lịch sử nạp tiền', {
      userId: user.userId,
      currentBalance: parseFloat(user.balance.toString()),
      message: 'Để xem lịch sử chi tiết, cần implement bảng transactions riêng',
    });
  }
}
