import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { WithdrawalOtpSession } from './entities/withdrawal-otp-session.entity';
import { User } from '../users/entities/user.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WithdrawalRequest, WithdrawalOtpSession, User]),
    EmailModule,
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
