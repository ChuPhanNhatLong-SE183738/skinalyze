import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoadmapDetailsService } from './roadmap-details.service';
import { RoadmapDetailsController } from './roadmap-details.controller';
import { RoadmapDetail } from './entities/roadmap-detail.entity';
import { TreatmentRoadmap } from '../treatment-roadmaps/entities/treatment-roadmap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoadmapDetail, TreatmentRoadmap])],
  controllers: [RoadmapDetailsController],
  providers: [RoadmapDetailsService],
  exports: [RoadmapDetailsService],
})
export class RoadmapDetailsModule {}
