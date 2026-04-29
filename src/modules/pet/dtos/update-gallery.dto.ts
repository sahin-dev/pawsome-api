import {
  IsString,
  IsUrl,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class UpdateGalleryDto {
  @IsUrl()
  @IsOptional()
  url?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(3)
  order?: number;
}
