import { prisma } from "../config/database.config";
import { BookingStatus } from "../generated/prisma";

export class ClassBookingRepository {
  /**
   * Create a new class booking
   */
  static async create(userId: string, classId: string) {
    return prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.classBooking.create({
        data: {
          userId,
          classId,
          status: BookingStatus.CONFIRMED,
        },
        include: {
          gymClass: {
            include: {
              trainer: true,
            },
          },
        },
      });

      // Increment bookedCount
      await tx.gymClass.update({
        where: { id: classId },
        data: {
          bookedCount: { increment: 1 },
        },
      });

      return booking;
    });
  }

  /**
   * Find booking by user and class
   */
  static async findByUserAndClass(userId: string, classId: string) {
    return prisma.classBooking.findUnique({
      where: {
        userId_classId: { userId, classId },
      },
      include: {
        gymClass: true,
      },
    });
  }

  /**
   * Find booking by ID
   */
  static async findById(id: string) {
    return prisma.classBooking.findUnique({
      where: { id },
      include: {
        gymClass: {
          include: {
            trainer: true,
          },
        },
        user: true,
      },
    });
  }

  /**
   * Find booking by ID and user
   */
  static async findByIdAndUser(id: string, userId: string) {
    return prisma.classBooking.findFirst({
      where: { id, userId },
      include: {
        gymClass: {
          include: {
            trainer: true,
          },
        },
      },
    });
  }

  /**
   * Cancel booking (update status and decrement count)
   */
  static async cancel(id: string, classId: string) {
    return prisma.$transaction(async (tx) => {
      // Update booking status
      const booking = await tx.classBooking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
        include: {
          gymClass: {
            include: {
              trainer: true,
            },
          },
        },
      });

      // Decrement bookedCount
      await tx.gymClass.update({
        where: { id: classId },
        data: {
          bookedCount: { decrement: 1 },
        },
      });

      return booking;
    });
  }

  /**
   * Get user's bookings
   */
  static async findByUser(userId: string, status?: BookingStatus) {
    return prisma.classBooking.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        gymClass: {
          include: {
            trainer: true,
          },
        },
      },
      orderBy: { bookedAt: "desc" },
    });
  }

  /**
   * Get class bookings
   */
  static async findByClass(classId: string) {
    return prisma.classBooking.findMany({
      where: { classId, status: BookingStatus.CONFIRMED },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { bookedAt: "asc" },
    });
  }
}
