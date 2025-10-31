import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseGroupsService } from './disease-groups.service';
import { DiseaseGroupsController } from './disease-groups.controller';
import { DiseaseGroup } from './entities/disease-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiseaseGroup])],
  controllers: [DiseaseGroupsController],
  providers: [DiseaseGroupsService],
  exports: [DiseaseGroupsService],
})
export class DiseaseGroupsModule {}