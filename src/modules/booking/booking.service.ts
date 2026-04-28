import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, CACHE_KEYS } from 'src/common/services/cache.service';
import { CreateBookingDto } from './dtos/createBooking.dto';
import { AssignSitterDto } from './dtos/assign-sitter.dto';
import { UploadToBookingDto } from './dtos/upload-to-booking.dto';
import { Booking, BookingUploads } from 'generated/prisma/browser';
import { BookingStatus } from 'generated/prisma/enums';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { buildPaginationMeta } from 'src/common/utils/paginate.util';

@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async createBooking(
    userId: number,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    try {
      // Verify user owns the pet
      const pet = await this.prismaService.pet.findFirst({
        where: {
          id: createBookingDto.petId,
          ownerId: userId,
        },
      });

      if (!pet) {
        throw new ForbiddenException(
          'You do not own this pet or pet does not exist.',
        );
      }

      // Verify service exists
      const service = await this.prismaService.service.findUnique({
        where: { id: createBookingDto.serviceId },
      });

      if (!service) {
        throw new NotFoundException('Service does not exist.');
      }

      // Validate dates
      const startDate = new Date(createBookingDto.startedAt);
      const endDate = new Date(createBookingDto.endedAt);

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date.');
      }

      if (startDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past.');
      }

      const booking = await this.prismaService.booking.create({
        data: {
          serviceId: createBookingDto.serviceId,
          petId: createBookingDto.petId,
          startedAt: startDate,
          endedAt: endDate,
          status: BookingStatus.Pending,
        },
      });

      // Invalidate booking caches
      await this.cacheService.invalidateBooking(undefined, userId);

      return booking;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create booking.');
    }
  }

  async getBookingsByUser(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Booking>> {
    try {
      const cacheKey = CACHE_KEYS.BOOKING.BY_USER(userId, page, limit);

      return await this.cacheService.getOrSet(cacheKey, async () => {
        const skip = (page - 1) * limit;
        const where = {
          pet: {
            ownerId: userId,
          },
        };

        const [data, totalItems] = await Promise.all([
          this.prismaService.booking.findMany({
            where,
            include: {
              service: true,
              pet: true,
              sitter: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          this.prismaService.booking.count({ where }),
        ]);

        return new PaginatedResponseDto(
          data,
          buildPaginationMeta(totalItems, page, limit),
        );
      }, this.cacheService.getTTL('medium'));
    } catch (error) {
      throw new BadRequestException('Failed to retrieve bookings.');
    }
  }

  async getBookingById(bookingId: number, userId?: number): Promise<Booking> {
    try {
      const cacheKey = userId
        ? `${CACHE_KEYS.BOOKING.BY_ID(bookingId)}:user:${userId}`
        : CACHE_KEYS.BOOKING.BY_ID(bookingId);

      return await this.cacheService.getOrSet(cacheKey, async () => {
        const booking = await this.prismaService.booking.findUnique({
          where: { id: bookingId },
          include: {
            service: true,
            pet: true,
            sitter: true,
          },
        });

        if (!booking) {
          throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
        }

        // If userId provided, verify ownership (user must own the pet)
        if (userId) {
          const petOwner = await this.prismaService.pet.findFirst({
            where: {
              id: booking.petId,
              ownerId: userId,
            },
          });

          if (!petOwner) {
            throw new ForbiddenException(
              'You do not have access to this booking.',
            );
          }
        }

        return booking;
      }, this.cacheService.getTTL('medium'));
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve booking.');
    }
  }

  async assignSitter(
    bookingId: number,
    assignSitterDto: AssignSitterDto,
  ): Promise<Booking> {
    try {
      const booking = await this.getBookingById(bookingId);

      // Verify booking is still Pending
      if (booking.status !== BookingStatus.Pending) {
        throw new BadRequestException(
          `Cannot assign sitter to booking with status: ${booking.status}`,
        );
      }

      // Verify sitter exists and has SITTER role
      const sitter = await this.prismaService.user.findUnique({
        where: { id: assignSitterDto.sitterId },
      });

      if (!sitter || sitter.role !== 'SITTER') {
        throw new NotFoundException('Sitter not found or invalid role.');
      }

      // Update booking with sitter and change status to Confirmed
      const updatedBooking = await this.prismaService.booking.update({
        where: { id: bookingId },
        data: {
          sitterId: assignSitterDto.sitterId,
          status: BookingStatus.Confirmed,
        },
        include: {
          service: true,
          pet: true,
          sitter: true,
        },
      });

      // Invalidate booking caches
      await this.cacheService.invalidateBooking(bookingId, undefined, assignSitterDto.sitterId);

      return updatedBooking;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to assign sitter.');
    }
  }

  async cancelBooking(bookingId: number): Promise<Booking> {
    try {
      const booking = await this.getBookingById(bookingId);

      // Can only cancel Pending or Confirmed bookings
      if (
        booking.status !== BookingStatus.Pending &&
        booking.status !== BookingStatus.Confirmed
      ) {
        throw new BadRequestException(
          `Cannot cancel booking with status: ${booking.status}`,
        );
      }

      const cancelledBooking = await this.prismaService.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.Cancelled },
        include: {
          service: true,
          pet: true,
          sitter: true,
        },
      });

      // Invalidate booking caches
      await this.cacheService.invalidateBooking(bookingId, undefined, cancelledBooking.sitterId || undefined);

      return cancelledBooking;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel booking.');
    }
  }

  async startBooking(bookingId: number, sitterId: number): Promise<Booking> {
    try {
      const booking = await this.getBookingById(bookingId);

      // Verify sitter is assigned to this booking
      if (booking.sitterId !== sitterId) {
        throw new ForbiddenException(
          'You are not assigned to this booking.',
        );
      }

      // Verify booking is Confirmed
      if (booking.status !== BookingStatus.Confirmed) {
        throw new BadRequestException(
          `Cannot start booking with status: ${booking.status}. Booking must be Confirmed.`,
        );
      }

      const startedBooking = await this.prismaService.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.In_Progress },
        include: {
          service: true,
          pet: true,
          sitter: true,
        },
      });

      // Invalidate booking caches
      await this.cacheService.invalidateBooking(bookingId, undefined, sitterId);

      return startedBooking;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to start booking.');
    }
  }

  async completeBooking(
    bookingId: number,
    sitterId: number,
  ): Promise<Booking> {
    try {
      const booking = await this.getBookingById(bookingId);

      // Verify sitter is assigned to this booking
      if (booking.sitterId !== sitterId) {
        throw new ForbiddenException(
          'You are not assigned to this booking.',
        );
      }

      // Verify booking is In_Progress
      if (booking.status !== BookingStatus.In_Progress) {
        throw new BadRequestException(
          `Cannot complete booking with status: ${booking.status}. Booking must be In_Progress.`,
        );
      }

      const completedBooking = await this.prismaService.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.Completed },
        include: {
          service: true,
          pet: true,
          sitter: true,
        },
      });

      // Invalidate booking caches
      await this.cacheService.invalidateBooking(bookingId, undefined, sitterId);

      return completedBooking;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to complete booking.');
    }
  }

  async uploadToBooking(
    bookingId: number,
    sitterId: number,
    uploadToBookingDto: UploadToBookingDto,
  ): Promise<BookingUploads> {
    try {
      const booking = await this.getBookingById(bookingId);

      // Verify sitter is assigned to this booking
      if (booking.sitterId !== sitterId) {
        throw new ForbiddenException(
          'You are not assigned to this booking.',
        );
      }

      // Can only upload while booking is In_Progress
      if (booking.status !== BookingStatus.In_Progress) {
        throw new BadRequestException(
          `Cannot upload to booking with status: ${booking.status}. Booking must be In_Progress.`,
        );
      }

      const upload = await this.prismaService.bookingUploads.create({
        data: {
          bookingId,
          ...uploadToBookingDto,
        },
      });

      // Invalidate booking uploads cache
      await this.cacheService.invalidateBooking(bookingId);

      return upload;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to upload to booking.');
    }
  }

  async getUploadsForBooking(bookingId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<BookingUploads>> {
    try {
      const cacheKey = CACHE_KEYS.BOOKING.UPLOADS(bookingId, page, limit);

      return await this.cacheService.getOrSet(cacheKey, async () => {
        // Verify booking exists
        await this.getBookingById(bookingId);

        const skip = (page - 1) * limit;
        const where = { bookingId };

        const [data, totalItems] = await Promise.all([
          this.prismaService.bookingUploads.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          this.prismaService.bookingUploads.count({ where }),
        ]);

        return new PaginatedResponseDto(
          data,
          buildPaginationMeta(totalItems, page, limit),
        );
      }, this.cacheService.getTTL('short'));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve uploads.');
    }
  }

  async getBookingsBySitter(sitterId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponseDto<Booking>> {
    try {
      const cacheKey = CACHE_KEYS.BOOKING.BY_SITTER(sitterId, page, limit);

      return await this.cacheService.getOrSet(cacheKey, async () => {
        const skip = (page - 1) * limit;
        const where = { sitterId };

        const [data, totalItems] = await Promise.all([
          this.prismaService.booking.findMany({
            where,
            include: {
              service: true,
              pet: true,
              sitter: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          this.prismaService.booking.count({ where }),
        ]);

        return new PaginatedResponseDto(
          data,
          buildPaginationMeta(totalItems, page, limit),
        );
      }, this.cacheService.getTTL('medium'));
    } catch (error) {
      throw new BadRequestException('Failed to retrieve bookings.');
    }
  }

  async getSitterLocationForBooking(
    bookingId: number,
    userId: number,
  ): Promise<Booking> {
    try {
      const booking = await this.getBookingById(bookingId, userId);

      // Verify booking is In_Progress for live tracking
      if (booking.status !== BookingStatus.In_Progress) {
        throw new BadRequestException(
          'Sitter location is only available while booking is In_Progress.',
        );
      }

      // In a real app, this would return sitter's GPS coordinates
      // For now, we return the booking with sitter details
      return booking;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to retrieve sitter location.',
      );
    }
  }
}
