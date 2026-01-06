import { ReportsRepository } from "../models";
import {
  DashboardStats,
  RevenueReport,
  AttendanceReport,
  RevenueQueryParams,
  AttendanceQueryParams,
} from "../types";

export class ReportsServiceError extends Error {
  constructor(
    message: string,
    public code: "BAD_REQUEST" | "NOT_FOUND" | "INTERNAL"
  ) {
    super(message);
    this.name = "ReportsServiceError";
  }
}

export class ReportsService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all dashboard data in parallel for better performance
      const [
        totalMembers,
        activeMembers,
        totalRevenue,
        monthlyRevenue,
        todayCheckIns,
        popularClasses,
      ] = await Promise.all([
        ReportsRepository.getTotalMembers(),
        ReportsRepository.getActiveMembers(),
        ReportsRepository.getTotalRevenue(),
        ReportsRepository.getMonthlyRevenue(),
        ReportsRepository.getTodayCheckIns(),
        ReportsRepository.getPopularClasses(),
      ]);

      return {
        totalMembers,
        activeMembers,
        totalRevenue,
        monthlyRevenue,
        todayCheckIns,
        popularClasses,
      };
    } catch (error) {
      throw new ReportsServiceError(
        "Failed to fetch dashboard statistics",
        "INTERNAL"
      );
    }
  }

  /**
   * Get revenue report
   */
  static async getRevenueReport(
    params: RevenueQueryParams
  ): Promise<RevenueReport> {
    try {
      const startDate = new Date(params.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Validate date range
      if (startDate > endDate) {
        throw new ReportsServiceError(
          "Start date must be before end date",
          "BAD_REQUEST"
        );
      }

      const { totalRevenue, dailyRevenue } =
        await ReportsRepository.getRevenueByDateRange(startDate, endDate);

      return {
        startDate: params.startDate,
        endDate: params.endDate,
        totalRevenue,
        daily: dailyRevenue.map((item) => ({
          date: item.date.toISOString().split("T")[0],
          revenue: item.revenue,
          transactionCount: item.transactionCount,
        })),
      };
    } catch (error) {
      if (error instanceof ReportsServiceError) {
        throw error;
      }
      throw new ReportsServiceError(
        "Failed to fetch revenue report",
        "INTERNAL"
      );
    }
  }

  /**
   * Get attendance report
   */
  static async getAttendanceReport(
    params: AttendanceQueryParams
  ): Promise<AttendanceReport> {
    try {
      // Default to last 30 days if no dates provided
      const endDate = params.endDate ? new Date(params.endDate) : new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = params.startDate
        ? new Date(params.startDate)
        : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      startDate.setHours(0, 0, 0, 0);

      // Validate date range
      if (startDate > endDate) {
        throw new ReportsServiceError(
          "Start date must be before end date",
          "BAD_REQUEST"
        );
      }

      const { totalCheckIns, averageCheckInsPerDay, dailyAttendance } =
        await ReportsRepository.getAttendanceByDateRange(startDate, endDate);

      return {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        totalCheckIns,
        averageCheckInsPerDay,
        attendance: dailyAttendance.map((item) => ({
          date: item.date.toISOString().split("T")[0],
          checkIns: item.checkIns,
          uniqueMembers: item.uniqueMembers,
        })),
      };
    } catch (error) {
      if (error instanceof ReportsServiceError) {
        throw error;
      }
      throw new ReportsServiceError(
        "Failed to fetch attendance report",
        "INTERNAL"
      );
    }
  }
}
