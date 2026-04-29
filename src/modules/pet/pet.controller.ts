import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { AddPetDto } from "./dtos/addPet.dto";
import { UpdatePetDto } from "./dtos/update-pet.dto";
import { UploadGalleryDto } from "./dtos/upload-gallery.dto";
import { UpdateGalleryDto } from "./dtos/update-gallery.dto";
import { PetResponseDto } from "./dtos/pet-response.dto";
import { GalleryResponseDto } from "./dtos/gallery-response.dto";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";
import { PetService } from "./pet.service";
import { TokenPayload } from "../auth/types/TokenPayload.type";

@Controller('pets')
export class PetController {

    constructor(private readonly petService: PetService) { }

    // Pet CRUD Operations
    @Post()
    async addPet(@Body() addPetDto: AddPetDto, @Request() request: Request) {
        const payload = request['payload'] as TokenPayload;
        const createdPet = await this.petService.addPet(payload.id, addPetDto);
        return plainToClass(PetResponseDto, createdPet, { excludeExtraneousValues: true });
    }

    @Get()
    async getAllPets(
        @Request() request: Request,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        const payload = request['payload'] as TokenPayload;
        const result = await this.petService.getAllPets(
            payload.id,
            paginationQuery.page,
            paginationQuery.limit,
        );
        return {
            data: plainToClass(PetResponseDto, result.data, { excludeExtraneousValues: true }),
            pagination: result.pagination,
        };
    }

    @Get(':id')
    async getPetById(@Param('id') petId: string, @Request() request: Request) {
        const payload = request['payload'] as TokenPayload;
        const pet = await this.petService.getPetById(parseInt(petId), payload.id);
        return plainToClass(PetResponseDto, pet, { excludeExtraneousValues: true });
    }

    @Put(':id')
    async updatePet(
        @Param('id') petId: string,
        @Body() updatePetDto: UpdatePetDto,
        @Request() request: Request
    ) {
        const payload = request['payload'] as TokenPayload;
        const updatedPet = await this.petService.updatePet(parseInt(petId), payload.id, updatePetDto);
        return plainToClass(PetResponseDto, updatedPet, { excludeExtraneousValues: true });
    }

    @Delete(':id')
    async deletePet(@Param('id') petId: string, @Request() request: Request) {
        const payload = request['payload'] as TokenPayload;
        const deletedPet = await this.petService.deletePet(parseInt(petId), payload.id);
        return plainToClass(PetResponseDto, deletedPet, { excludeExtraneousValues: true });
    }

    // Gallery Operations
    @Post(':id/gallery')
    async uploadGallery(
        @Param('id') petId: string,
        @Body() uploadGalleryDto: UploadGalleryDto,
        @Request() request: Request
    ) {
        const payload = request['payload'] as TokenPayload;
        const gallery = await this.petService.uploadGallery(parseInt(petId), payload.id, uploadGalleryDto);
        return plainToClass(GalleryResponseDto, gallery, { excludeExtraneousValues: true });
    }

    @Get(':id/gallery')
    async getGallery(
        @Param('id') petId: string,
        @Request() request: Request,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        const payload = request['payload'] as TokenPayload;
        const result = await this.petService.getGallery(
            parseInt(petId),
            payload.id,
            paginationQuery.page,
            paginationQuery.limit,
        );
        return {
            data: plainToClass(GalleryResponseDto, result.data, { excludeExtraneousValues: true }),
            pagination: result.pagination,
        };
    }

    @Get(':id/gallery/:galleryId')
    async getGalleryById(
        @Param('id') petId: string,
        @Param('galleryId') galleryId: string,
        @Request() request: Request
    ) {
        const payload = request['payload'] as TokenPayload;
        const gallery = await this.petService.getGalleryById(parseInt(galleryId), parseInt(petId), payload.id);
        return plainToClass(GalleryResponseDto, gallery, { excludeExtraneousValues: true });
    }

    @Put(':id/gallery/:galleryId')
    async updateGallery(
        @Param('id') petId: string,
        @Param('galleryId') galleryId: string,
        @Body() updateGalleryDto: UpdateGalleryDto,
        @Request() request: Request
    ) {
        const payload = request['payload'] as TokenPayload;
        const gallery = await this.petService.updateGallery(parseInt(galleryId), parseInt(petId), payload.id, updateGalleryDto);
        return plainToClass(GalleryResponseDto, gallery, { excludeExtraneousValues: true });
    }

    @Delete(':id/gallery/:galleryId')
    async deleteGallery(
        @Param('id') petId: string,
        @Param('galleryId') galleryId: string,
        @Request() request: Request
    ) {
        const payload = request['payload'] as TokenPayload;
        const gallery = await this.petService.deleteGallery(parseInt(galleryId), parseInt(petId), payload.id);
        return plainToClass(GalleryResponseDto, gallery, { excludeExtraneousValues: true });
    }
}