import { prisma } from "../config/database.config";
import { Prisma } from "../generated/prisma";

export class ReportsRepository {
  /**
   * Get total members count
   */
  static async getTotalMembers(): Promise<number> {
    return prisma.user.count({
      where: {
        role: "USER",
      },
    });
  }

  /**
   * Get active members count (members with active subscription)
   */
  static async getActiveMembers(): Promise<number> {
    const now = new Date();
    return prisma.user.count({
      where: {
        role: "USER",
        status: "ACTIVE",
        subscriptions: {
          some: {
            status: "ACTIVE",
            endDate: {
              gte: now,
            },
          },
        },
      },
    });
  }

  /**
   * Get total revenue (all successful payments)
   */
  static async getTotalRevenue(): Promise<number> {
    const result = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "SUCCESS",
      },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  /**
   * Get monthly revenue (current month)
   */
  static async getMonthlyRevenue(): Promise<number> {
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

    const result = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "SUCCESS",
        paidAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  /**
   * Get today's check-ins count
   */
  static async getTodayCheckIns(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  /**
   * Get popular classes (top 5 by booked count)
   */
  static async getPopularClasses() {
    return prisma.gymClass.findMany({
      take: 5,
      orderBy: {
        bookedCount: "desc",
      },
      select: {
        id: true,
        name: true,
        type: true,
        bookedCount: true,
        capacity: true,
      },
    });
  }

  /**
   * Get revenue report for date range
   */
  static async getRevenueByDateRange(startDate: Date, endDate: Date) {
    // Get total revenue for the period
    const totalResult = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "SUCCESS",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get daily revenue breakdown using raw query
    const dailyRevenue = await prisma.$queryRaw<
      Array<{ date: Date; revenue: Prisma.Decimal; count: bigint }>
    >`
      SELECT 
        DATE(paid_at) as date,
        SUM(amount) as revenue,
        COUNT(*) as count
      FROM payments
      WHERE status = 'SUCCESS'
        AND paid_at >= ${startDate}
        AND paid_at <= ${endDate}
      GROUP BY DATE(paid_at)
      ORDER BY date ASC
    `;

    return {
      totalRevenue: totalResult._sum.amount?.toNumber() || 0,
      dailyRevenue: dailyRevenue.map((item) => ({
        date: item.date,
        revenue: Number(item.revenue),
        transactionCount: Number(item.count),
      })),
    };
  }

  /**
   * Get attendance report for date range
   */
  static async getAttendanceByDateRange(startDate: Date, endDate: Date) {
    // Get total check-ins for the period
    const totalCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get daily attendance breakdown using raw query
    const dailyAttendance = await prisma.$queryRaw<
      Array<{ date: Date; check_ins: bigint; unique_members: bigint }>
    >`
      SELECT 
        DATE(check_in_time) as date,
        COUNT(*) as check_ins,
        COUNT(DISTINCT user_id) as unique_members
      FROM check_ins
      WHERE check_in_time >= ${startDate}
        AND check_in_time <= ${endDate}
      GROUP BY DATE(check_in_time)
      ORDER BY date ASC
    `;

    // Calculate number of days in range
    const daysDiff =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const averageCheckInsPerDay = daysDiff > 0 ? totalCheckIns / daysDiff : 0;

    return {
      totalCheckIns,
      averageCheckInsPerDay: Math.round(averageCheckInsPerDay * 100) / 100,
      dailyAttendance: dailyAttendance.map((item) => ({
        date: item.date,
        checkIns: Number(item.check_ins),
        uniqueMembers: Number(item.unique_members),
      })),
    };
  }
}
