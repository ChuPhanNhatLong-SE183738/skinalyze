import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseasesService } from './diseases.service';
import { DiseasesController } from './diseases.controller';
import { Disease } from './entities/disease.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Disease])],
  controllers: [DiseasesController],
  providers: [DiseasesService],
  exports: [DiseasesService],
})
export class DiseasesModule {}