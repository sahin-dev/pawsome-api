import { Transform } from "class-transformer"
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator"
import { PetType } from "generated/prisma/enums"

export class UpdatePetDto {

    @IsString()
    @IsOptional()
    name?: string

    @IsEnum(PetType)
    @IsOptional()
    type?: PetType

    @IsString()
    @IsOptional()
    breed?: string

    @IsNumber()
    @Min(0)
    @IsOptional()
    age?: number

    @IsNumber()
    @Min(0)
    @IsOptional()
    size?: number

    @IsString()
    @IsOptional()
    medical_notes?: string

    @IsString()
    @IsOptional()
    feeding_instructions?: string
    
    @IsString()
    @IsOptional()
    behaviour_notes?: string

    @IsString()
    @IsOptional()
    special_instructions?: string
}
