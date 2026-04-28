import { Expose } from 'class-transformer';
import { UserRole } from 'generated/prisma/enums';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  fullName: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  is_email_verified: boolean;

  @Expose()
  is_blocked: boolean;

  @Expose()
  emergency_contact?: string;

  @Expose()
  location_lat?: number;

  @Expose()
  location_lng?: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
