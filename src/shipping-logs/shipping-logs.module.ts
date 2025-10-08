import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingLogsService } from './shipping-logs.service';
import { ShippingLogsController } from './shipping-logs.controller';
import { ShippingLog } from './entities/shipping-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingLog])],
  controllers: [ShippingLogsController],
  providers: [ShippingLogsService],
  exports: [ShippingLogsService],
})
export class ShippingLogsModule {}
