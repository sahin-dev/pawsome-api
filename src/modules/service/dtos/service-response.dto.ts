import { Expose } from 'class-transformer';
import { ServiceStatus, DurationUnit } from 'generated/prisma/enums';

export class ServiceResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  icon: string;

  @Expose()
  description: string;

  @Expose()
  price: number;

  @Expose()
  duration: number;

  @Expose()
  durationUnit: DurationUnit;

  @Expose()
  status: ServiceStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
