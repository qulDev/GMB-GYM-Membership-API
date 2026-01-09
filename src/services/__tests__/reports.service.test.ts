import { ReportsService } from "../reports.service";
import { ReportsRepository } from "../../models";

jest.mock("../../models", () => ({
  ReportsRepository: {
    getTotalMembers: jest.fn(),
    getActiveMembers: jest.fn(),
    getTotalRevenue: jest.fn(),
    getMonthlyRevenue: jest.fn(),
    getTodayCheckIns: jest.fn(),
    getPopularClasses: jest.fn(),
    getRevenueByDateRange: jest.fn(),
    getAttendanceByDateRange: jest.fn(),
  },
}));

describe("ReportsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should get dashboard statistics successfully", async () => {
      const mockStats = {
        totalMembers: 100,
        activeMembers: 50,
        totalRevenue: 5000000,
        monthlyRevenue: 1000000,
        todayCheckIns: 25,
        popularClasses: [
          {
            id: "class1",
            name: "Yoga",
            type: "yoga",
            bookedCount: 50,
            capacity: 20,
          },
        ],
      };

      (ReportsRepository.getTotalMembers as jest.Mock).mockResolvedValue(
        mockStats.totalMembers
      );
      (ReportsRepository.getActiveMembers as jest.Mock).mockResolvedValue(
        mockStats.activeMembers
      );
      (ReportsRepository.getTotalRevenue as jest.Mock).mockResolvedValue(
        mockStats.totalRevenue
      );
      (ReportsRepository.getMonthlyRevenue as jest.Mock).mockResolvedValue(
        mockStats.monthlyRevenue
      );
      (ReportsRepository.getTodayCheckIns as jest.Mock).mockResolvedValue(
        mockStats.todayCheckIns
      );
      (ReportsRepository.getPopularClasses as jest.Mock).mockResolvedValue(
        mockStats.popularClasses
      );

      const result = await ReportsService.getDashboardStats();

      expect(result).toEqual(mockStats);
      expect(ReportsRepository.getTotalMembers).toHaveBeenCalled();
      expect(ReportsRepository.getActiveMembers).toHaveBeenCalled();
      expect(ReportsRepository.getTotalRevenue).toHaveBeenCalled();
      expect(ReportsRepository.getMonthlyRevenue).toHaveBeenCalled();
      expect(ReportsRepository.getTodayCheckIns).toHaveBeenCalled();
      expect(ReportsRepository.getPopularClasses).toHaveBeenCalled();
    });

    it("should throw INTERNAL error on failure", async () => {
      (ReportsRepository.getTotalMembers as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(ReportsService.getDashboardStats()).rejects.toMatchObject({
        message: "Failed to fetch dashboard statistics",
        code: "INTERNAL",
      });
    });
  });

  describe("getRevenueReport", () => {
    const mockRevenueData = {
      totalRevenue: 2000000,
      dailyRevenue: [
        { date: new Date("2024-01-15"), revenue: 500000, transactionCount: 5 },
        { date: new Date("2024-01-16"), revenue: 600000, transactionCount: 6 },
      ],
    };

    it("should get revenue report successfully", async () => {
      (ReportsRepository.getRevenueByDateRange as jest.Mock).mockResolvedValue(
        mockRevenueData
      );

      const result = await ReportsService.getRevenueReport({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.startDate).toBe("2024-01-01");
      expect(result.endDate).toBe("2024-01-31");
      expect(result.totalRevenue).toBe(2000000);
      expect(result.daily).toHaveLength(2);
      expect(result.daily[0]).toEqual({
        date: "2024-01-15",
        revenue: 500000,
        transactionCount: 5,
      });
      expect(ReportsRepository.getRevenueByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it("should throw BAD_REQUEST error if start date is after end date", async () => {
      await expect(
        ReportsService.getRevenueReport({
          startDate: "2024-01-31",
          endDate: "2024-01-01",
        })
      ).rejects.toMatchObject({
        message: "Start date must be before end date",
        code: "BAD_REQUEST",
      });
    });

    it("should throw INTERNAL error on failure", async () => {
      (ReportsRepository.getRevenueByDateRange as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        ReportsService.getRevenueReport({
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        })
      ).rejects.toMatchObject({
        message: "Failed to fetch revenue report",
        code: "INTERNAL",
      });
    });
  });

  describe("getAttendanceReport", () => {
    const mockAttendanceData = {
      totalCheckIns: 310,
      averageCheckInsPerDay: 10,
      dailyAttendance: [
        { date: new Date("2024-01-15"), checkIns: 10, uniqueMembers: 8 },
        { date: new Date("2024-01-16"), checkIns: 12, uniqueMembers: 10 },
      ],
    };

    it("should get attendance report successfully with date range", async () => {
      (
        ReportsRepository.getAttendanceByDateRange as jest.Mock
      ).mockResolvedValue(mockAttendanceData);

      const result = await ReportsService.getAttendanceReport({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      // Service converts dates to ISO format, timezone may affect the output
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(result.totalCheckIns).toBe(310);
      expect(result.averageCheckInsPerDay).toBe(10);
      expect(result.attendance).toHaveLength(2);
      expect(result.attendance[0]).toEqual({
        date: "2024-01-15",
        checkIns: 10,
        uniqueMembers: 8,
      });
    });

    it("should use default date range (last 30 days) if not provided", async () => {
      (
        ReportsRepository.getAttendanceByDateRange as jest.Mock
      ).mockResolvedValue(mockAttendanceData);

      const result = await ReportsService.getAttendanceReport({});

      expect(result.totalCheckIns).toBe(310);
      expect(ReportsRepository.getAttendanceByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it("should throw BAD_REQUEST error if start date is after end date", async () => {
      await expect(
        ReportsService.getAttendanceReport({
          startDate: "2024-01-31",
          endDate: "2024-01-01",
        })
      ).rejects.toMatchObject({
        message: "Start date must be before end date",
        code: "BAD_REQUEST",
      });
    });

    it("should throw INTERNAL error on failure", async () => {
      (
        ReportsRepository.getAttendanceByDateRange as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      await expect(
        ReportsService.getAttendanceReport({
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        })
      ).rejects.toMatchObject({
        message: "Failed to fetch attendance report",
        code: "INTERNAL",
      });
    });
  });
});
