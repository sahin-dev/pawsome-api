import { Body, Controller, Post, Req, UsePipes } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dtos/register-user.dto";


@Controller("auth")
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post("register")
    async registerUser(@Body() registerUserDto:RegisterUserDto){

        const registeredUser = await this.authService.registerUser(registerUserDto)

        return registeredUser

    }
}