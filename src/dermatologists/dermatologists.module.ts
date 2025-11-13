import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DermatologistsController } from './dermatologists.controller';
import { DermatologistsService } from './dermatologists.service';
import { Dermatologist } from './entities/dermatologist.entity';
import { AvailabilitySlotsModule } from 'src/availability-slots/availability-slots.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dermatologist]),
    forwardRef(() => AvailabilitySlotsModule),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  controllers: [DermatologistsController],
  providers: [DermatologistsService],
  exports: [DermatologistsService],
})
export class DermatologistsModule {}
