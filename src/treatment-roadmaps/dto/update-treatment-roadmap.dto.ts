import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentRoadmapDto } from './create-treatment-roadmap.dto';

export class UpdateTreatmentRoadmapDto extends PartialType(
  CreateTreatmentRoadmapDto,
) {}
