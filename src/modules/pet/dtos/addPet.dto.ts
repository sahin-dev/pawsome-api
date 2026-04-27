import { Transform } from "class-transformer"
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator"
import { PetType } from "generated/prisma/enums"

export class AddPetDto {

    @IsNotEmpty()
    @IsString()
    name: string

    @IsEnum(PetType)
    @IsNotEmpty()
    type: PetType

    @IsString()
    @IsNotEmpty()
    breed: string

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    age: number

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    size: number

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