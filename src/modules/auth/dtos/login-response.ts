import { Expose, Type } from 'class-transformer';
import { UserRole } from 'generated/prisma/enums';
import { UserResponseDto } from 'src/modules/user/dtos/user-response.dto';

export class LoginResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  @Type(() => UserResponseDto)
  user:UserResponseDto
}
