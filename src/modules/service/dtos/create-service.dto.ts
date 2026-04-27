import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ServiceStatus, DurationUnit } from 'generated/prisma/enums';
import { Transform } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.5)
  duration: number;

  @IsEnum(DurationUnit)
  @IsNotEmpty()
  durationUnit: DurationUnit;

  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}
