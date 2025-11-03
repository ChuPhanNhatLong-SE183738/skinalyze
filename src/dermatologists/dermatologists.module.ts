import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DermatologistsController } from './dermatologists.controller';
import { DermatologistsService } from './dermatologists.service';
import { Dermatologist } from './entities/dermatologist.entity';
import { AvailabilitySlotsModule } from 'src/availability-slots/availability-slots.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dermatologist]),
    forwardRef(() => AvailabilitySlotsModule),
    UsersModule,
  ],
  controllers: [DermatologistsController],
  providers: [DermatologistsService],
  exports: [DermatologistsService],
})
export class DermatologistsModule {}
