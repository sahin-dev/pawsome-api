import {
  IsString,
  IsUrl,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateGalleryDto {
  @IsUrl()
  @IsOptional()
  url?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;
}
