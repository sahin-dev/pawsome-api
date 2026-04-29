import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService, CACHE_KEYS } from "src/common/services/cache.service";
import { AddPetDto } from "./dtos/addPet.dto";
import { UpdatePetDto } from "./dtos/update-pet.dto";
import { UploadGalleryDto } from "./dtos/upload-gallery.dto";
import { UpdateGalleryDto } from "./dtos/update-gallery.dto";
import { Pet, Gallery } from "generated/prisma/browser";
import { PaginatedResponseDto } from "src/common/dtos/paginated-response.dto";
import { buildPaginationMeta } from "src/common/utils/paginate.util";

@Injectable()
export class PetService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    async addPet(ownerId: number, addPetDto: AddPetDto): Promise<Pet> {
        try {
            const createdPet = await this.prismaService.pet.create({
                data: {
                    ...addPetDto,
                    owner: { connect: { id: ownerId } }
                }
            });

            // Invalidate owner's pet list caches
            await this.cacheService.invalidatePet(undefined, ownerId);

            return createdPet;
        } catch (error) {
            throw new BadRequestException('Failed to create pet. Please check your input.');
        }
    }

    async getPetById(petId: number, ownerId: number): Promise<Pet> {
        const cacheKey = `${CACHE_KEYS.PET.BY_ID(petId)}:owner:${ownerId}`;

        return await this.cacheService.getOrSet(cacheKey, async () => {
            const pet = await this.prismaService.pet.findFirst({
                where: {
                    id: petId,
                    ownerId: ownerId
                }
            });

            if (!pet) {
                throw new NotFoundException(`Pet with ID ${petId} not found.`);
            }

            return pet;
        }, this.cacheService.getTTL('medium'));
    }

    async getAllPets(ownerId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Pet>> {
        const cacheKey = CACHE_KEYS.PET.LIST(ownerId, page, limit);

        return await this.cacheService.getOrSet(cacheKey, async () => {
            const skip = (page - 1) * limit;
            const where = { ownerId };

            const [data, totalItems] = await Promise.all([
                this.prismaService.pet.findMany({
                    where,
                    skip,
                    take: limit,
                }),
                this.prismaService.pet.count({ where }),
            ]);

            return new PaginatedResponseDto(
                data,
                buildPaginationMeta(totalItems, page, limit),
            );
        }, this.cacheService.getTTL('medium'));
    }

    async updatePet(petId: number, ownerId: number, updatePetDto: UpdatePetDto): Promise<Pet> {
        const pet = await this.getPetById(petId, ownerId);

        if (!pet) {
            throw new NotFoundException(`Pet with ID ${petId} not found.`);
        }

        try {
            const updatedPet = await this.prismaService.pet.update({
                where: { id: petId },
                data: updatePetDto
            });

            // Invalidate pet caches
            await this.cacheService.invalidatePet(petId, ownerId);

            return updatedPet;
        } catch (error) {
            throw new BadRequestException('Failed to update pet. Please check your input.');
        }
    }

    async deletePet(petId: number, ownerId: number): Promise<Pet> {
        const pet = await this.getPetById(petId, ownerId);
        if (!pet) {
            throw new NotFoundException(`Pet with ID ${petId} not found.`);
        }

        try {
            const deletedPet = await this.prismaService.pet.delete({
                where: { id: petId }
            });

            // Invalidate pet caches
            await this.cacheService.invalidatePet(petId, ownerId);

            return deletedPet;
        } catch (error) {
            console.log(error)
            throw new BadRequestException('Failed to delete pet.');
        }
    }

    // Gallery methods
    async uploadGallery(petId: number, ownerId: number, uploadGalleryDto: UploadGalleryDto): Promise<Gallery> {
        try {
            // Verify user owns the pet
            const pet = await this.getPetById(petId, ownerId);
            if (!pet) {
                throw new NotFoundException(`Pet with ID ${petId} not found.`);
            }

            // Get the highest order number to auto-increment
            const slimilarOrderFound = await this.prismaService.gallery.findFirst({
                where: { pet_id: petId, order: uploadGalleryDto.order},
                orderBy: { order: 'desc' }
            });

            if(slimilarOrderFound){
                await this.cacheService.invalidateGallery(petId, slimilarOrderFound.id);
                return this.updateGallery(slimilarOrderFound.id, petId, ownerId, uploadGalleryDto)
            }


            const gallery = await this.prismaService.gallery.create({
                data: {
                    url: uploadGalleryDto.url,
                    order: uploadGalleryDto.order,
                    pet_id: petId
                }
            });

            // Invalidate gallery caches
            await this.cacheService.invalidateGallery(petId);

            return gallery;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to upload gallery image.');
        }
    }

    async updateGallery(galleryId: number, petId: number, ownerId: number, updateGalleryDto: UpdateGalleryDto): Promise<Gallery> {
        try {
            // Verify user owns the pet
            const pet = await this.getPetById(petId, ownerId);
            if (!pet) {
                throw new NotFoundException(`Pet with ID ${petId} not found.`);
            }

            // Verify gallery image exists and belongs to the pet
            const gallery = await this.prismaService.gallery.findFirst({
                where: {
                    id: galleryId,
                    pet_id: petId
                }
            });

            if (!gallery) {
                throw new NotFoundException(`Gallery image not found for this pet.`);
            }

            const updatedGallery = await this.prismaService.gallery.update({
                where: { id: galleryId },
                data: updateGalleryDto
            });

            // Invalidate gallery caches
            await this.cacheService.invalidateGallery(petId, galleryId);

            return updatedGallery;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to update gallery image.');
        }
    }

    async deleteGallery(galleryId: number, petId: number, ownerId: number): Promise<Gallery> {
        try {
            // Verify user owns the pet
            const pet = await this.getPetById(petId, ownerId);
            if (!pet) {
                throw new NotFoundException(`Pet with ID ${petId} not found.`);
            }

            // Verify gallery image exists and belongs to the pet
            const gallery = await this.prismaService.gallery.findFirst({
                where: {
                    id: galleryId,
                    pet_id: petId
                }
            });

            if (!gallery) {
                throw new NotFoundException(`Gallery image not found for this pet.`);
            }

            const deletedGallery = await this.prismaService.gallery.delete({
                where: { id: galleryId }
            });

            // Invalidate gallery caches
            await this.cacheService.invalidateGallery(petId, galleryId);

            return deletedGallery;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to delete gallery image.');
        }
    }

    async getGallery(petId: number, ownerId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Gallery>> {
        try {
            const cacheKey = CACHE_KEYS.PET.GALLERY(petId, page, limit);

            return await this.cacheService.getOrSet(cacheKey, async () => {
                // Verify user owns the pet
                const pet = await this.getPetById(petId, ownerId);
                if (!pet) {
                    throw new NotFoundException(`Pet with ID ${petId} not found.`);
                }

                const skip = (page - 1) * limit;
                const where = { pet_id: petId };

                const [data, totalItems] = await Promise.all([
                    this.prismaService.gallery.findMany({
                        where,
                        orderBy: { order: 'asc' },
                        skip,
                        take: limit,
                    }),
                    this.prismaService.gallery.count({ where }),
                ]);

                return new PaginatedResponseDto(
                    data,
                    buildPaginationMeta(totalItems, page, limit),
                );
            }, this.cacheService.getTTL('medium'));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve gallery images.');
        }
    }

    async getGalleryById(galleryId: number, petId: number, ownerId: number): Promise<Gallery> {
        try {
            const cacheKey = CACHE_KEYS.PET.GALLERY_ITEM(petId, galleryId);

            return await this.cacheService.getOrSet(cacheKey, async () => {
                // Verify user owns the pet
                const pet = await this.getPetById(petId, ownerId);
                if (!pet) {
                    throw new NotFoundException(`Pet with ID ${petId} not found.`);
                }

                const gallery = await this.prismaService.gallery.findFirst({
                    where: {
                        id: galleryId,
                        pet_id: petId
                    }
                });

                if (!gallery) {
                    throw new NotFoundException(`Gallery image not found for this pet.`);
                }

                return gallery;
            }, this.cacheService.getTTL('medium'));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve gallery image.');
        }
    }
}