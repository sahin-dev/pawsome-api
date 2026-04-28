import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dtos/create-service.dto';
import { UpdateServiceDto } from './dtos/update-service.dto';
import { Service } from 'generated/prisma/browser';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { buildPaginationMeta } from 'src/common/utils/paginate.util';

@Injectable()
export class ServiceService {
  constructor(private readonly prismaService: PrismaService) {}

  async createService(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const service = await this.prismaService.service.create({
        data: createServiceDto,
      });
      return service;
    } catch (error) {
      throw new BadRequestException('Failed to create service. Please check your input.');
    }
  }

  async getAllServices(page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Service>> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalItems] = await Promise.all([
        this.prismaService.service.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prismaService.service.count(),
      ]);

      const pagination = buildPaginationMeta(totalItems, page, limit);
      return new PaginatedResponseDto(data, pagination);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve services.');
    }
  }

  async getServiceById(id: number): Promise<Service> {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${id} not found.`);
      }

      return service;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve service.');
    }
  }

  async getActiveServices(page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Service>> {
    try {
      const skip = (page - 1) * limit;
      const where = { status: 'ACTIVE' as const };

      const [data, totalItems] = await Promise.all([
        this.prismaService.service.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prismaService.service.count({ where }),
      ]);

      const pagination = buildPaginationMeta(totalItems, page, limit);
      return new PaginatedResponseDto(data, pagination);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve active services.');
    }
  }

  async updateService(id: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
    try {
      // Verify service exists
      await this.getServiceById(id);

      const updatedService = await this.prismaService.service.update({
        where: { id },
        data: updateServiceDto,
      });
      return updatedService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update service. Please check your input.');
    }
  }

  async deleteService(id: number): Promise<Service> {
    try {
      // Verify service exists
      await this.getServiceById(id);

      const deletedService = await this.prismaService.service.delete({
        where: { id },
      });
      return deletedService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete service.');
    }
  }
}
