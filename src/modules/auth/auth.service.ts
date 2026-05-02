import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, Logger, Inject } from "@nestjs/common";
import { SmtpProvider } from "src/common/providers/smtp.provider";
import { CacheService } from "src/common/services/cache.service";
import { CreateUserDto } from "../user/dtos/create-user.dto";
import { UserService } from "../user/user.service";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { LoginUserDto } from "./dtos/login-user.dto";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { VerifyOtpDto } from "./dtos/verify-otp.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { PrismaService } from "../prisma/prisma.service";
import bcrypt from 'bcrypt'
import { createReadStream } from 'fs'
import jwt from 'jsonwebtoken'
import { JwtService } from "@nestjs/jwt";
import jwtConfig from "src/config/jwt.config";
import type{ ConfigType } from "@nestjs/config";

@Injectable()
export class AuthService {

    private otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();
    private logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly smtpSrevice: SmtpProvider,
        private readonly prismaService: PrismaService,
        private readonly cacheService: CacheService,
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConfigOptions:ConfigType<typeof jwtConfig>
    ) { }

    async registerUser(registerUserDto: RegisterUserDto) {
        try {
            // Check if email already exists
            const existingUser = await this.prismaService.user.findUnique({
                where: { email: registerUserDto.email }
            });

            if (existingUser) {
                throw new BadRequestException('Email already registered');
            }

            const exisitingUserWithPhone = await this.prismaService.user.findUnique({where:{phone:registerUserDto.phone}})

            if(exisitingUserWithPhone){
                throw new BadRequestException("Phone already registered")
            }

            const hashedPassword = await this.hash(registerUserDto.password);

            const createUserDto: CreateUserDto = {
                first_name: registerUserDto.firstName,
                last_name:registerUserDto.lastName,
                email: registerUserDto.email,
                phone: registerUserDto.phone,
                password: hashedPassword
            }

            const createdUser = await this.userService.addUser(createUserDto);
            this.sendWelcomeMail(createdUser.email);

            return {
                id: createdUser.id,
                first_name: createdUser.first_name,
                last_name:createdUser.last_name,
                email: createdUser.email,
                phone:createdUser.phone,
                role: createdUser.role,
                createdAt: createdUser.createdAt,
                updatedAt: createdUser.updatedAt
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to register user');
        }
    }

    async login(loginUserDto: LoginUserDto) {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { email: loginUserDto.email }
            });

            if (!user) {
                throw new UnauthorizedException('Invalid email or password');
            }

            const isPasswordValid = await this.comparePasswords(loginUserDto.password, user.password);

            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid email or password');
            }

            if (user.is_blocked) {
                throw new UnauthorizedException('User account is blocked');
            }
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            }
            
            const accessToken = await this.jwtService.signAsync(payload, 
                {secret:this.jwtConfigOptions.jwt_secret, expiresIn:this.jwtConfigOptions.expires_in});

            return {
                accessToken,
                user: user
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error('Login error', error);
            throw new BadRequestException('Login failed');
        }
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { email: forgotPasswordDto.email }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const otp = this.generateOtp();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

            this.otpStore.set(forgotPasswordDto.email, { otp, expiresAt });

            // Send OTP via email
            this.sendOtpEmail(user.email, otp);

            return {
                message: 'OTP sent to your email',
                email: user.email
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to process forgot password request');
        }
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        try {
            const storedOtpData = this.otpStore.get(verifyOtpDto.email);

            if (!storedOtpData) {
                throw new BadRequestException('No OTP request found for this email');
            }

            if (Date.now() > storedOtpData.expiresAt) {
                this.otpStore.delete(verifyOtpDto.email);
                throw new BadRequestException('OTP has expired');
            }

            if (storedOtpData.otp !== verifyOtpDto.otp) {
                throw new BadRequestException('Invalid OTP');
            }

            // Mark as verified by removing from store (will be used for reset password)
            return {
                message: 'OTP verified successfully',
                email: verifyOtpDto.email
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('OTP verification failed');
        }
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        try {
            const storedOtpData = this.otpStore.get(resetPasswordDto.email);

            if (!storedOtpData) {
                throw new BadRequestException('No valid OTP verification found. Please request password reset again');
            }

            const user = await this.prismaService.user.findUnique({
                where: { email: resetPasswordDto.email }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const hashedPassword = await this.hash(resetPasswordDto.password);

            const updatedUser = await this.prismaService.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            // Clear OTP from store
            this.otpStore.delete(resetPasswordDto.email);

            // Invalidate user caches after password reset
            await this.cacheService.invalidateUser(user.id);

            return {
                message: 'Password reset successfully',
                id: updatedUser.id,
                email: updatedUser.email
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to reset password');
        }
    }

    async sendWelcomeMail(to: string) {
        try {
            const welcomeFileStream = createReadStream(process.cwd() + "/src/templates/welcome.template.html");
            
            this.smtpSrevice.sendMail({
                to,
                subject: "Welcome to PAWSOME!",
                html: welcomeFileStream
            });
        } catch (error) {
            console.error('Error sending welcome email:', error);
            // Don't throw error, just log it
        }
    }

    private sendOtpEmail(to: string, otp: string) {
        try {
            this.smtpSrevice.sendMail({
                to,
                subject: "PAWSOME - Password Reset OTP",
                html: `
                    <h1>Password Reset Request</h1>
                    <p>Your OTP for password reset is: <strong>${otp}</strong></p>
                    <p>This OTP is valid for 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        } catch (error) {
            console.error('Error sending OTP email:', error);
            // Don't throw error, just log it
        }
    }

    async hash(data: string): Promise<string> {
        return await bcrypt.hash(data, 10);
    }

    private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private generateToken(user: any): string {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                email_verified: user.is_email_verified
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }
}