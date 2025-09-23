import { IsEmail, IsString, MinLength, IsOptional, IsDateString, IsArray, IsUrl } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsUrl({}, { message: 'photoUrl must be a valid URL' })
  photoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  address?: string[];
}