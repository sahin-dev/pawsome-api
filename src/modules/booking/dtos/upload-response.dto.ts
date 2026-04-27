import { Expose } from 'class-transformer';
import { UploadType } from 'generated/prisma/enums';

export class UploadResponseDto {
  @Expose()
  id: number;

  @Expose()
  bookingId: number;

  @Expose()
  url?: string;

  @Expose()
  text?: string;

  @Expose()
  type: UploadType;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
