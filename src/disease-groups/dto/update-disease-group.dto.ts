import { PartialType } from '@nestjs/mapped-types';
import { CreateDiseaseGroupDto } from './create-disease-group.dto';

export class UpdateDiseaseGroupDto extends PartialType(CreateDiseaseGroupDto) {}