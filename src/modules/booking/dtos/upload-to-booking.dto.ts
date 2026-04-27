import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { UploadType } from 'generated/prisma/enums';

export class UploadToBookingDto {
  @IsEnum(UploadType)
  @IsNotEmpty()
  type: UploadType;

  @IsUrl()
  @ValidateIf((o) => o.type !== UploadType.TEXT || !o.text)
  @IsOptional()
  url?: string;

  @IsString()
  @ValidateIf((o) => o.type === UploadType.TEXT || !o.url)
  @IsOptional()
  text?: string;
}
