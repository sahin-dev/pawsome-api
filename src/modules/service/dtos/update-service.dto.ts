import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ServiceStatus, DurationUnit } from 'generated/prisma/enums';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  duration?: number;

  @IsEnum(DurationUnit)
  @IsOptional()
  durationUnit?: DurationUnit;

  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}
