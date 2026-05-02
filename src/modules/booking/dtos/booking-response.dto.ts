import { Expose, Type } from 'class-transformer';
import { BookingStatus } from 'generated/prisma/enums';
import { PetResponseDto } from 'src/modules/pet/dtos/pet-response.dto';
import { ServiceResponseDto } from 'src/modules/service/dtos/service-response.dto';

export class BookingResponseDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => ServiceResponseDto)
  service: ServiceResponseDto;

  @Expose()
  @Type(() => PetResponseDto)
  pet: PetResponseDto;

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
