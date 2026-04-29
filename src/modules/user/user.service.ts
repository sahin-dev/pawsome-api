import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService, CACHE_KEYS } from "src/common/services/cache.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";
import { PaginatedResponseDto } from "src/common/dtos/paginated-response.dto";
import { buildPaginationMeta } from "src/common/utils/paginate.util";
import { UserRole } from "generated/prisma/enums";
import bcrypt from 'bcrypt';

@Injectable()
export class UserService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    async addUser(createUserDto: CreateUserDto) {
        try {
            // Check if email already exists
            const existingUser = await this.prismaService.user.findUnique({
                where: { email: createUserDto.email }
            });

            if (existingUser) {
                throw new BadRequestException('Email already registered');
            }

            const data = await this.prismaService.user.create({
                data: { ...createUserDto, role: UserRole.USER }
            });

            // Invalidate user list caches
            await this.cacheService.invalidateUser();

            return data;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create user');
        }
    }

    async getUserById(userId: number) {
        try {
            const cacheKey = CACHE_KEYS.USER.BY_ID(userId);

            return await this.cacheService.getOrSet(cacheKey, async () => {
                const user = await this.prismaService.user.findUnique({
                    where: { id: userId }
                });

                if (!user) {
                    throw new NotFoundException('User not found');
                }

                return user;
            }, this.cacheService.getTTL('medium'));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.log(error)
            throw new BadRequestException('Failed to retrieve user');
        }
    }

    async getProfile(userId: number) {
        try {
            const cacheKey = CACHE_KEYS.USER.PROFILE(userId);

            return await this.cacheService.getOrSet(cacheKey, async () => {
                const user = await this.getUserById(userId);
                // Remove password from profile
                const { password, ...profileWithoutPassword } = user;
                return profileWithoutPassword;
            }, this.cacheService.getTTL('medium'));
        } catch (error) {
            throw new BadRequestException('Failed to retrieve profile');
        }
    }

    async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
        try {
            const user = await this.getUserById(userId);

            // Verify current password
            const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

            if (!isPasswordValid) {
                throw new BadRequestException('Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

            const updatedUser = await this.prismaService.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            // Invalidate user caches
            await this.cacheService.invalidateUser(userId);

            return {
                message: 'Password changed successfully',
                id: updatedUser.id,
                email: updatedUser.email
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to change password');
        }
    }

    async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
        try {
            const user = await this.getUserById(userId);

            const updatedUser = await this.prismaService.user.update({
                where: { id: userId },
                data: updateProfileDto
            });

            // Invalidate user caches
            await this.cacheService.invalidateUser(userId);

            return updatedUser;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to update profile');
        }
    }

    async getAllUsers(paginationQueryDto: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
        try {
            const cacheKey = CACHE_KEYS.USER.ALL_USERS(paginationQueryDto.page, paginationQueryDto.limit);

            return await this.cacheService.getOrSet(cacheKey, async () => {
                const skip = paginationQueryDto.getSkip();

                const [users, total] = await Promise.all([
                    this.prismaService.user.findMany({
                        where: {
                            role: UserRole.USER
                        },
                        skip,
                        take: paginationQueryDto.limit,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                            is_email_verified: true,
                            is_blocked: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    }),
                    this.prismaService.user.count({
                        where: { role: UserRole.USER }
                    })
                ]);

                const pagination = buildPaginationMeta(total, paginationQueryDto.page, paginationQueryDto.limit);
                return new PaginatedResponseDto(users, pagination);
            }, this.cacheService.getTTL('long'));
        } catch (error) {
            throw new BadRequestException('Failed to retrieve users');
        }
    }

    async getAllSitters(paginationQueryDto: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
        try {
            const cacheKey = CACHE_KEYS.USER.ALL_SITTERS(paginationQueryDto.page, paginationQueryDto.limit);

            return await this.cacheService.getOrSet(cacheKey, async () => {
                const skip = paginationQueryDto.getSkip();

                const [sitters, total] = await Promise.all([
                    this.prismaService.user.findMany({
                        where: {
                            role: UserRole.SITTER
                        },
                        skip,
                        take: paginationQueryDto.limit,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                            is_email_verified: true,
                            is_blocked: true,
                            emergency_contact: true,
                            location_lat: true,
                            location_lng: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    }),
                    this.prismaService.user.count({
                        where: { role: UserRole.SITTER }
                    })
                ]);

                const pagination = buildPaginationMeta(total, paginationQueryDto.page, paginationQueryDto.limit);
                return new PaginatedResponseDto(sitters, pagination);
            }, this.cacheService.getTTL('long'));
        } catch (error) {
            throw new BadRequestException('Failed to retrieve sitters');
        }
    }

    // async getProfile(userId: number) {
    //     try {
    //         const cacheKey = CACHE_KEYS.USER.PROFILE(userId);

    //         return await this.cacheService.getOrSet(cacheKey, async () => {
    //             const user = await this.getUserById(userId);
    //             const { password, ...userWithoutPassword } = user;
    //             return userWithoutPassword;
    //         }, this.cacheService.getTTL('medium'));
    //     } catch (error) {
    //         if (error instanceof NotFoundException) {
    //             throw error;
    //         }
    //         throw new BadRequestException('Failed to retrieve profile');
    //     }
    // }
}