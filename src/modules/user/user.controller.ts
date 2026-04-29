import { Body, Controller, Get, Post, Put, Query, Request, UseGuards } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { UserRole } from "generated/prisma/enums";
import { TokenPayload } from "../auth/types/TokenPayload.type";

@Controller("users")
@UseGuards(RolesGuard)
export class UserController {

    constructor(private readonly userService: UserService) { }

    @Post()
    async addUser(@Body() createUserDto: CreateUserDto) {
        const data = await this.userService.addUser(createUserDto);
        return plainToClass(UserResponseDto, data, { excludeExtraneousValues: true });
    }

    @Get("profile")
    async getProfile(@Request() request: Request) {
        const payload = request['payload'] as TokenPayload;
        const profile = await this.userService.getProfile(payload.id);
        return plainToClass(UserResponseDto, profile, { excludeExtraneousValues: true });
    }

    @Put("profile")
    async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() request: Request) {
        const payload = request['payload'] as TokenPayload;
        const updatedProfile = await this.userService.updateProfile(payload.id, updateProfileDto);
        return plainToClass(UserResponseDto, updatedProfile, { excludeExtraneousValues: true });
    }

    @Post("change-password")
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() request: Request) {
        const payload = request['payload'] as TokenPayload;
        return await this.userService.changePassword(payload.id, changePasswordDto);
    }

    @Get("all-users")
    @Roles(UserRole.ADMIN)
    async getAllUsers(@Query() paginationQueryDto: PaginationQueryDto) {
        const pagination = new PaginationQueryDto(paginationQueryDto);
        const result = await this.userService.getAllUsers(pagination);
        return {
            ...result,
            data: plainToClass(UserResponseDto, result.data, { excludeExtraneousValues: true })
        };
    }

    @Get("all-sitters")
    @Roles(UserRole.ADMIN)
    async getAllSitters(@Query() paginationQueryDto: PaginationQueryDto) {
        const pagination = new PaginationQueryDto(paginationQueryDto);
        const result = await this.userService.getAllSitters(pagination);
        return {
            ...result,
            data: plainToClass(UserResponseDto, result.data, { excludeExtraneousValues: true })
        };
    }
}