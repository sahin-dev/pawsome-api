import { Expose, Type } from 'class-transformer';
import { BookingStatus } from 'generated/prisma/enums';

export class BookingResponseDto {
  @Expose()
  id: number;

  @Expose()
  serviceId: number;

  @Expose()
  petId: number;

  @Expose()
  sitterId?: number;

  @Expose()
  startedAt: Date;

  @Expose()
  endedAt: Date;

  @Expose()
  status: BookingStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
