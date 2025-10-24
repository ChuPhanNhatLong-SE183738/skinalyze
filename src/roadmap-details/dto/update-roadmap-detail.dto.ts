import { PartialType } from '@nestjs/swagger';
import { CreateRoadmapDetailDto } from './create-roadmap-detail.dto';

export class UpdateRoadmapDetailDto extends PartialType(
  CreateRoadmapDetailDto,
) {}
