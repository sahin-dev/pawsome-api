import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dtos/createBooking.dto';
import { AssignSitterDto } from './dtos/assign-sitter.dto';
import { UploadToBookingDto } from './dtos/upload-to-booking.dto';
import { BookingResponseDto } from './dtos/booking-response.dto';
import { UploadResponseDto } from './dtos/upload-response.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'generated/prisma/enums';
import { TokenPayload } from '../auth/types/TokenPayload.type';

@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // User creates a booking
  @Post()
  @Roles(UserRole.USER, UserRole.SITTER)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Request() request: Request,
  ) {
    const payload = request['payload'] as TokenPayload;
    const booking = await this.bookingService.createBooking(
      payload.id,
      createBookingDto,
    );
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  // User gets their bookings
  @Get()
  @Roles(UserRole.USER, UserRole.SITTER)
  async getBookingsByUser(
    @Request() request: Request,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const payload = request['payload'] as TokenPayload;
    const result = await this.bookingService.getBookingsByUser(
      payload.id,
      paginationQuery.page,
      paginationQuery.limit,
    );
    return {
      data: plainToClass(BookingResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      pagination: result.pagination,
    };
  }

  // Get single booking by ID (user who owns pet can access)
  @Get(':id')
  @Roles(UserRole.USER, UserRole.SITTER)
  async getBookingById(
    @Param('id') bookingId: string,
    @Request() request: Request,
  ) {
    const payload = request['payload'] as TokenPayload;
    const booking = await this.bookingService.getBookingById(
      parseInt(bookingId),
      payload.id,
    );
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  // Admin assigns sitter to booking
  @Post(':id/assign-sitter')
  @Roles(UserRole.ADMIN)
  async assignSitter(
    @Param('id') bookingId: string,
    @Body() assignSitterDto: AssignSitterDto,
  ) {
    const booking = await this.bookingService.assignSitter(
      parseInt(bookingId),
      assignSitterDto,
    );
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  // Admin cancels booking
  @Post(':id/cancel')
  @Roles(UserRole.ADMIN)
  async cancelBooking(@Param('id') bookingId: string) {
    const booking = await this.bookingService.cancelBooking(parseInt(bookingId));
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  // Sitter starts booking
  @Post(':id/start')
  @Roles(UserRole.SITTER)
  async startBooking(
    @Param('id') bookingId: string,
    @Request() request: Request,
  ) {
    const payload = request['payload'] as TokenPayload;
    const booking = await this.bookingService.startBooking(
      parseInt(bookingId),
      payload.id,
    );
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  // Sitter completes booking
  @Post(':id/complete')
  @Roles(UserRole.SITTER)
  async completeBooking(
    @Param('id') bookingId: string,
    @Request() request: Request,
  ) {
    const payload = request['payload'] as TokenPayload;
    const booking = await this.bookingService.completeBooking(
      parseInt(bookingId),
      payload.id,
    );
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  // Sitter uploads video/image/text to booking (only while In_Progress)
  @Post(':id/upload')
  @Roles(UserRole.SITTER)
  async uploadToBooking(
    @Param('id') bookingId: string,
    @Body() uploadToBookingDto: UploadToBookingDto,
    @Request() request: Request,
  ) {
    const payload = request['payload'] as TokenPayload;
    const upload = await this.bookingService.uploadToBooking(
      parseInt(bookingId),
      payload.id,
      uploadToBookingDto,
    );
    return plainToClass(UploadResponseDto, upload, {
      excludeExtraneousValues: true,
    });
  }

  // Get all uploads for a booking (user or sitter can view)
  @Get(':id/uploads')
  @Roles(UserRole.USER, UserRole.SITTER)
  async getUploadsForBooking(
    @Param('id') bookingId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const result = await this.bookingService.getUploadsForBooking(
      parseInt(bookingId),
      paginationQuery.page,
      paginationQuery.limit,
    );
    return {
      data: plainToClass(UploadResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      pagination: result.pagination,
    };
  }

  // Get sitter's bookings (sitter for their own, admin for all)
  @Get('sitter/:sitterId')
  @Roles(UserRole.SITTER, UserRole.ADMIN)
  async getBookingsBySitter(
    @Param('sitterId') sitterId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const result = await this.bookingService.getBookingsBySitter(
      parseInt(sitterId),
      paginationQuery.page,
      paginationQuery.limit,
    );
    return {
      data: plainToClass(BookingResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      pagination: result.pagination,
    };
  }

  // User live tracks sitter location during In_Progress booking
  @Get(':id/sitter-location')
  @Roles(UserRole.USER)
  async getSitterLocationForBooking(
    @Param('id') bookingId: string,
    @Request() request: Request,
  ) {
    const payload = request['payload'] as TokenPayload;
    const booking = await this.bookingService.getSitterLocationForBooking(
      parseInt(bookingId),
      payload.id,
    );
    return plainToClass(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }
}
