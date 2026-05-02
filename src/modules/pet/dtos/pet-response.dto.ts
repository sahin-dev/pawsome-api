import { Expose, Type } from "class-transformer"
import { PetType } from "generated/prisma/enums"
import { GalleryResponseDto } from "./gallery-response.dto"

export class PetResponseDto {
    
    @Expose()
    id: number

    @Expose()
    avatar:string

    @Expose()
    name: string

    @Expose()
    type: PetType
    
    @Expose()
    breed: string

    @Expose()
    age: number

    @Expose()
    size: number
    @Expose()
    @Type(() => GalleryResponseDto)
    gallery:GalleryResponseDto

    @Expose()
    medical_notes?: string

    @Expose()
    feeding_instructions?: string

    @Expose()
    behaviour_notes?: string

    @Expose()
    special_instructions?: string

    @Expose()
    ownerId: number

    @Expose()
    createdAt: Date

    @Expose()
    updatedAt: Date
}
