import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  emergency_contact?: string;

  @IsOptional()
  location_lat?: number;

  @IsOptional()
  location_lng?: number;
}
