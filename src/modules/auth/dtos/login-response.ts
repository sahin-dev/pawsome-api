import { Expose } from 'class-transformer';
import { UserRole } from 'generated/prisma/enums';

export class LoginResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  user: {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
  };
}
