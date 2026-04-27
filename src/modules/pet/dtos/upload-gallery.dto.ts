import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UploadGalleryDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;
}
