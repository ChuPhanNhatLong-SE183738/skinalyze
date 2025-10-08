import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkinAnalysisService } from './skin-analysis.service';
import { SkinAnalysisController } from './skin-analysis.controller';
import { SkinAnalysis } from './entities/skin-analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SkinAnalysis])],
  controllers: [SkinAnalysisController],
  providers: [SkinAnalysisService],
  exports: [SkinAnalysisService],
})
export class SkinAnalysisModule {}
