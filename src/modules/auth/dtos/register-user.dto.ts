import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, Matches, MinLength, Validate, ValidateBy } from "class-validator"
import { ConfirmPassword } from "../validator/confirm-password.validator"

export class RegisterUserDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    fullName:string

    @IsEmail({}, {message:"Invalid email address!"})
    @IsNotEmpty()
    email:string

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password:string

    @IsString()
    @IsNotEmpty()
    @Validate(ConfirmPassword, ['password'])
    confirmPassword:string
}