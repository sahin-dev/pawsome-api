import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class UploadGalleryDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3)
  order: number;
}
