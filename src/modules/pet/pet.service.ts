import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddPetDto } from "./dtos/addPet.dto";
import { UpdatePetDto } from "./dtos/update-pet.dto";
import { UploadGalleryDto } from "./dtos/upload-gallery.dto";
import { UpdateGalleryDto } from "./dtos/update-gallery.dto";
import { Pet, Gallery } from "generated/prisma/browser";
import { PaginatedResponseDto } from "src/common/dtos/paginated-response.dto";
import { buildPaginationMeta } from "src/common/utils/paginate.util";

@Injectable()
export class PetService {

    constructor(private readonly prismaService: PrismaService) { }

    async addPet(ownerId: number, addPetDto: AddPetDto): Promise<Pet> {
        try {
            const createdPet = await this.prismaService.pet.create({
                data: {
                    ...addPetDto,
                    owner: { connect: { id: ownerId } }
                }
            });
            return createdPet;
        } catch (error) {
            throw new BadRequestException('Failed to create pet. Please check your input.');
        }
    }

    async getPetById(petId: number, ownerId: number): Promise<Pet> {
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
    }

    async getAllPets(ownerId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Pet>> {
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

        return {
            data,
            pagination: buildPaginationMeta(totalItems, page, limit),
        };
    }

    async updatePet(petId: number, ownerId: number, updatePetDto: UpdatePetDto): Promise<Pet> {
        const pet = await this.getPetById(petId, ownerId);

        if(!pet){
            throw new NotFoundException(`Pet with ID ${petId} not found.`);
        }

        try {
            const updatedPet = await this.prismaService.pet.update({
                where: { id: petId },
                data: updatePetDto
            });
            return updatedPet;
        } catch (error) {
            throw new BadRequestException('Failed to update pet. Please check your input.');
        }
    }

    async deletePet(petId: number, ownerId: number): Promise<Pet> {
        const pet = await this.getPetById(petId, ownerId);
        if(!pet){
            throw new NotFoundException(`Pet with ID ${petId} not found.`);
        }

        try {
            const deletedPet = await this.prismaService.pet.delete({
                where: { id: petId }
            });
            return deletedPet;
        } catch (error) {
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
            const lastImage = await this.prismaService.gallery.findFirst({
                where: { pet_id: petId },
                orderBy: { order: 'desc' }
            });

            const nextOrder = lastImage ? lastImage.order + 1 : 0;

            const gallery = await this.prismaService.gallery.create({
                data: {
                    url: uploadGalleryDto.url,
                    order: uploadGalleryDto.order ?? nextOrder,
                    pet_id: petId
                }
            });

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

            return {
                data,
                pagination: buildPaginationMeta(totalItems, page, limit),
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve gallery images.');
        }
    }

    async getGalleryById(galleryId: number, petId: number, ownerId: number): Promise<Gallery> {
        try {
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
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to retrieve gallery image.');
        }
    }
}