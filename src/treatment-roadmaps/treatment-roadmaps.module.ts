import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentRoadmapsService } from './treatment-roadmaps.service';
import { TreatmentRoadmapsController } from './treatment-roadmaps.controller';
import { TreatmentRoadmap } from './entities/treatment-roadmap.entity';
import { Dermatologist } from '../dermatologists/entities/dermatologist.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TreatmentRoadmap,
      Dermatologist,
      Customer,
      Appointment,
    ]),
  ],
  controllers: [TreatmentRoadmapsController],
  providers: [TreatmentRoadmapsService],
  exports: [TreatmentRoadmapsService],
})
export class TreatmentRoadmapsModule {}
