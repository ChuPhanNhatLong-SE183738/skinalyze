import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { CustomersModule } from '../customers/customers.module';
import { DermatologistsModule } from '../dermatologists/dermatologists.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AvailabilitySlotsModule } from '../availability-slots/availability-slots.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    CustomersModule,
    DermatologistsModule,
    TransactionsModule,
    AvailabilitySlotsModule,
    PaymentsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
