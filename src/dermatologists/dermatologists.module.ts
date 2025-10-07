import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DermatologistsController } from './dermatologists.controller';
import { DermatologistsService } from './dermatologists.service';
import { Dermatologist } from './entities/dermatologist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dermatologist])],
  controllers: [DermatologistsController],
  providers: [DermatologistsService],
  exports: [DermatologistsService],
})
export class DermatologistsModule {}
