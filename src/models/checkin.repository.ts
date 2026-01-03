import { prisma } from "../config/database.config";

export class CheckInRepository {
  /**
   * Create a new check-in record
   */
  static create(userId: string) {
    return prisma.checkIn.create({
      data: {
        userId,
        checkInTime: new Date(),
      },
    });
  }

  /**
   * Find check-in by ID
   */
  static findById(id: string) {
    return prisma.checkIn.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find current active check-in (no checkout yet) for a user
   */
  static findActiveByUser(userId: string) {
    return prisma.checkIn.findFirst({
      where: {
        userId,
        checkOutTime: null,
      },
      orderBy: {
        checkInTime: "desc",
      },
    });
  }

  /**
   * Get check-in history for a user with optional date filters
   */
  static findByUser(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) {
        where.checkInTime.gte = startDate;
      }
      if (endDate) {
        // Set endDate to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.checkInTime.lte = endOfDay;
      }
    }

    return prisma.checkIn.findMany({
      where,
      orderBy: {
        checkInTime: "desc",
      },
    });
  }

  /**
   * Count today's check-ins for a user
   */
  static async countTodayCheckIns(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.checkIn.count({
      where: {
        userId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  /**
   * Update check-in with checkout time and duration
   */
  static checkout(id: string, checkOutTime: Date, duration: number) {
    return prisma.checkIn.update({
      where: { id },
      data: {
        checkOutTime,
        duration,
      },
    });
  }

  /**
   * Find check-in by ID and user ID (for security)
   */
  static findByIdAndUser(id: string, userId: string) {
    return prisma.checkIn.findFirst({
      where: {
        id,
        userId,
      },
    });
  }
}
