import { Expose } from 'class-transformer';

export class GalleryResponseDto {
  @Expose()
  id: number;

  @Expose()
  order: number;

  @Expose()
  url: string;

  @Expose()
  pet_id: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
