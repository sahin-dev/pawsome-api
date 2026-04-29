import { Body, Controller, Post } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { LoginUserDto } from "./dtos/login-user.dto";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { VerifyOtpDto } from "./dtos/verify-otp.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { RegisterResponseDto } from "./dtos/register-response.dto";
import { LoginResponseDto } from "./dtos/login-response";
import { Public } from "src/common/decorators/public.decorator";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    @Public()
    async registerUser(@Body() registerUserDto: RegisterUserDto) {
        const registeredUser = await this.authService.registerUser(registerUserDto);
        return plainToClass(RegisterResponseDto, registeredUser, { excludeExtraneousValues: true });
    }

    @Post("login")
    @Public()
    async login(@Body() loginUserDto: LoginUserDto) {
        const result = await this.authService.login(loginUserDto);
        return plainToClass(LoginResponseDto, result, { excludeExtraneousValues: true });
    }

    @Post("forgot-password")
    @Public()
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return await this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post("verify-otp")
    @Public()
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return await this.authService.verifyOtp(verifyOtpDto);
    }

    @Post("reset-password")
    @Public()
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return await this.authService.resetPassword(resetPasswordDto);
    }
}