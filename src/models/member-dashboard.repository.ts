import { prisma } from "../config/database.config";
import { ClassStatus, BookingStatus } from "../generated/prisma";

export class MemberDashboardRepository {
  /**
   * Get active subscription for a user with membership plan details
   */
  static async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        membershipPlan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get total check-ins count for a user
   */
  static async getTotalCheckIns(userId: string): Promise<number> {
    return prisma.checkIn.count({
      where: { userId },
    });
  }

  /**
   * Get this month's check-ins count for a user
   */
  static async getThisMonthCheckIns(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return prisma.checkIn.count({
      where: {
        userId,
        checkInTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
  }

  /**
   * Get today's check-ins count for a user
   */
  static async getTodayCheckIns(userId: string): Promise<number> {
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
   * Get average check-in duration for a user (in minutes)
   */
  static async getAverageDuration(userId: string): Promise<number> {
    const result = await prisma.checkIn.aggregate({
      _avg: {
        duration: true,
      },
      where: {
        userId,
        duration: {
          not: null,
        },
      },
    });
    return Math.round(result._avg.duration || 0);
  }

  /**
   * Get recommended classes (upcoming scheduled classes with available slots)
   */
  static async getRecommendedClasses(userId: string, limit: number = 5) {
    const now = new Date();

    // Get classes that:
    // 1. Are scheduled (not cancelled, completed, etc.)
    // 2. Are in the future
    // 3. Have available slots
    // 4. User hasn't booked yet
    const bookedClassIds = await prisma.classBooking.findMany({
      where: {
        userId,
        status: BookingStatus.CONFIRMED,
      },
      select: {
        classId: true,
      },
    });

    const bookedIds = bookedClassIds.map((b) => b.classId);

    return prisma.gymClass.findMany({
      where: {
        status: ClassStatus.SCHEDULED,
        schedule: {
          gt: now,
        },
        id: {
          notIn: bookedIds,
        },
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
      orderBy: [
        { schedule: "asc" },
        { bookedCount: "desc" }, // Popular classes first
      ],
      take: limit,
    });
  }

  /**
   * Get user's upcoming booked classes
   */
  static async getUpcomingBookedClasses(userId: string, limit: number = 5) {
    const now = new Date();

    return prisma.classBooking.findMany({
      where: {
        userId,
        status: BookingStatus.CONFIRMED,
        gymClass: {
          schedule: {
            gt: now,
          },
          status: {
            in: [ClassStatus.SCHEDULED, ClassStatus.ONGOING],
          },
        },
      },
      include: {
        gymClass: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        gymClass: {
          schedule: "asc",
        },
      },
      take: limit,
    });
  }

  /**
   * Get recent check-in activity for a user
   */
  static async getRecentCheckIns(userId: string, limit: number = 5) {
    return prisma.checkIn.findMany({
      where: { userId },
      orderBy: {
        checkInTime: "desc",
      },
      take: limit,
    });
  }
}
