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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    const user = this.userRepository.create(createUserDto);
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
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
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
