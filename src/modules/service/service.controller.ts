import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dtos/create-service.dto';
import { UpdateServiceDto } from './dtos/update-service.dto';
import { ServiceResponseDto } from './dtos/service-response.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'generated/prisma/enums';

@Controller('services')
@UseGuards(RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createService(@Body() createServiceDto: CreateServiceDto) {
    const createdService = await this.serviceService.createService(
      createServiceDto,
    );
    return plainToClass(ServiceResponseDto, createdService, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async getAllServices(@Query() paginationQuery: PaginationQueryDto) {
    const result = await this.serviceService.getAllServices(
      paginationQuery.page,
      paginationQuery.limit,
    );
    return {
      data: plainToClass(ServiceResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      pagination: result.pagination,
    };
  }

  @Get('active')
  async getActiveServices(@Query() paginationQuery: PaginationQueryDto) {
    const result = await this.serviceService.getActiveServices(
      paginationQuery.page,
      paginationQuery.limit,
    );
    return {
      data: plainToClass(ServiceResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  async getServiceById(@Param('id') id: string) {
    const service = await this.serviceService.getServiceById(parseInt(id));
    return plainToClass(ServiceResponseDto, service, {
      excludeExtraneousValues: true,
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const updatedService = await this.serviceService.updateService(
      parseInt(id),
      updateServiceDto,
    );
    return plainToClass(ServiceResponseDto, updatedService, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteService(@Param('id') id: string) {
    const deletedService = await this.serviceService.deleteService(
      parseInt(id),
    );
    return plainToClass(ServiceResponseDto, deletedService, {
      excludeExtraneousValues: true,
    });
  }
}
