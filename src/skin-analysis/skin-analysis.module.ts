import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SkinAnalysisController } from './skin-analysis.controller';
import { SkinAnalysisService } from './skin-analysis.service';
import { SkinAnalysis } from './entities/skin-analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SkinAnalysis]), ConfigModule],
  controllers: [SkinAnalysisController],
  providers: [SkinAnalysisService],
  exports: [SkinAnalysisService],
})
export class SkinAnalysisModule {}