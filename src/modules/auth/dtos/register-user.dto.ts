import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, Matches, MinLength, Validate, ValidateBy } from "class-validator"
import { ConfirmPassword } from "../validator/confirm-password.validator"
import { Transform } from "class-transformer"

export class RegisterUserDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @Transform(({value})=> typeof value === 'string' ? value.trim():value)
    fullName:string

    @IsEmail({}, {message:"Invalid email address!"})
    @IsNotEmpty()
    @Transform(({value})=> typeof value === 'string' ? value.trim():value)
    email:string

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Transform(({value})=> typeof value === 'string' ? value.trim():value)
    password:string

    @IsString()
    @IsNotEmpty()
    @Validate(ConfirmPassword, ['password'])
    @Transform(({value})=> typeof value === 'string' ? value.trim():value)
    confirmPassword:string
}