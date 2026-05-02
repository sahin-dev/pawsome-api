import { Expose } from 'class-transformer';
import { UserRole } from 'generated/prisma/enums';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  avatar:string

  @Expose()
  first_name: string;
  
  @Expose()
  last_name:string

  @Expose()
  email: string;

  @Expose()
  phone:string

  @Expose()
  role: UserRole;

  @Expose()
  is_email_verified: boolean;

  @Expose()
  is_blocked: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
