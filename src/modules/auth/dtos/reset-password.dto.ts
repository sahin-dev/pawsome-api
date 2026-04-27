import { IsEmail, IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ConfirmPassword } from '../validator/confirm-password.validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Invalid email address!' })
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Validate(ConfirmPassword, ['password'])
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  confirmPassword: string;
}
