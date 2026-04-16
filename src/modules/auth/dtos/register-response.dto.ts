import { Expose } from "class-transformer"
import { UserRole } from "generated/prisma/enums"

export class RegisterResponseDto {
    
    @Expose()
    fullName:string

    @Expose()
    email:string

    @Expose()
    role:UserRole
    
    @Expose()
    createdAt:Date

    @Expose()
    updatedAt:Date

}