import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const fullUser = await this.usersService.findByEmail(loginDto.email);
    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      email: user.email,
      sub: user.userId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: fullUser.userId,
        email: fullUser.email,
        fullName: fullUser.fullName,
        phone: fullUser.phone,
        dob: fullUser.dob,
        photoUrl: fullUser.photoUrl,
        address: fullUser.address,
        balance: fullUser.balance,
        role: fullUser.role,
        isActive: fullUser.isActive,
        isVerified: fullUser.isVerified,
        createdAt: fullUser.createdAt,
        updatedAt: fullUser.updatedAt,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate required fields
    if (!registerDto.fullName) {
      throw new BadRequestException('Full name is required');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user data with explicit field mapping
    const userData = {
      email: registerDto.email,
      password: hashedPassword,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
      dob: registerDto.dob,
      photoUrl: registerDto.photoUrl,
      address: registerDto.address,
    };

    const user = await this.usersService.create(userData);

    // Generate JWT token
    const payload = {
      email: user.email,
      sub: user.userId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        dob: user.dob,
        photoUrl: user.photoUrl,
        address: user.address,
        balance: user.balance,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // Update password
    await this.usersService.update(userId, {
      password: hashedNewPassword,
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    // Remove sensitive fields that shouldn't be updated via this method
    const {
      password,
      role,
      isActive,
      userId: id,
      ...safeUpdateData
    } = updateData;

    return await this.usersService.update(userId, safeUpdateData);
  }

  async verifyEmail(userId: string) {
    await this.usersService.update(userId, { isVerified: true });
    return { message: 'Email verified successfully' };
  }

  async deactivateAccount(userId: string) {
    await this.usersService.update(userId, { isActive: false });
    return { message: 'Account deactivated successfully' };
  }
}
