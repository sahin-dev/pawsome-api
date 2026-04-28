import { IsString, IsNotEmpty, MinLength, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ConfirmPassword } from '../../auth/validator/confirm-password.validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Validate(ConfirmPassword, ['newPassword'])
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  confirmPassword: string;
}
