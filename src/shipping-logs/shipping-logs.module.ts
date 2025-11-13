import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingLogsService } from './shipping-logs.service';
import { ShippingLogsController } from './shipping-logs.controller';
import { ShippingLog } from './entities/shipping-log.entity';
import { Order } from '../orders/entities/order.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingLog, Order]),
    CloudinaryModule,
  ],
  controllers: [ShippingLogsController],
  providers: [ShippingLogsService],
  exports: [ShippingLogsService],
})
export class ShippingLogsModule {}
