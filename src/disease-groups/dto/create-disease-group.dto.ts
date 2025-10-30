import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDiseaseGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}