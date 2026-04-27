import {
  IsNotEmpty,
  IsNumber,
  IsISO8601,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  serviceId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  petId: number;

  @IsISO8601()
  @IsNotEmpty()
  startedAt: string;

  @IsISO8601()
  @IsNotEmpty()
  endedAt: string;
}