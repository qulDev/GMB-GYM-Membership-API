import { ReportsRepository } from "../reports.repository";
import { prisma } from "../../config/database.config";
import { Prisma } from "../../generated/prisma";

jest.mock("../../config/database.config", () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
    },
    checkIn: {
      count: jest.fn(),
    },
    gymClass: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

describe("ReportsRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTotalMembers", () => {
    it("should return total members count", async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);

      const result = await ReportsRepository.getTotalMembers();

      expect(result).toBe(100);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: "USER" },
      });
    });

    it("should return 0 if no members", async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const result = await ReportsRepository.getTotalMembers();

      expect(result).toBe(0);
    });
  });

  describe("getActiveMembers", () => {
    it("should return active members count (with active subscription)", async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(50);

      const result = await ReportsRepository.getActiveMembers();

      expect(result).toBe(50);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          role: "USER",
          status: "ACTIVE",
          subscriptions: {
            some: {
              status: "ACTIVE",
              endDate: {
                gte: expect.any(Date),
              },
            },
          },
        },
      });
    });
  });

  describe("getTotalRevenue", () => {
    it("should return total revenue from successful payments", async () => {
      const mockDecimal = { toNumber: () => 5000000 } as Prisma.Decimal;
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: mockDecimal },
      });

      const result = await ReportsRepository.getTotalRevenue();

      expect(result).toBe(5000000);
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: { status: "SUCCESS" },
      });
    });

    it("should return 0 if no payments", async () => {
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await ReportsRepository.getTotalRevenue();

      expect(result).toBe(0);
    });
  });

  describe("getMonthlyRevenue", () => {
    it("should return monthly revenue for current month", async () => {
      const mockDecimal = { toNumber: () => 1000000 } as Prisma.Decimal;
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: mockDecimal },
      });

      const result = await ReportsRepository.getMonthlyRevenue();

      expect(result).toBe(1000000);
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          status: "SUCCESS",
          paidAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });
    });

    it("should return 0 if no monthly revenue", async () => {
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await ReportsRepository.getMonthlyRevenue();

      expect(result).toBe(0);
    });
  });

  describe("getTodayCheckIns", () => {
    it("should return today's check-ins count", async () => {
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(25);

      const result = await ReportsRepository.getTodayCheckIns();

      expect(result).toBe(25);
      expect(prisma.checkIn.count).toHaveBeenCalledWith({
        where: {
          checkInTime: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe("getPopularClasses", () => {
    it("should return top 5 popular classes by booked count", async () => {
      const mockClasses = [
        {
          id: "class1",
          name: "Yoga",
          type: "yoga",
          bookedCount: 50,
          capacity: 20,
        },
        {
          id: "class2",
          name: "CrossFit",
          type: "crossfit",
          bookedCount: 45,
          capacity: 15,
        },
      ];
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue(mockClasses);

      const result = await ReportsRepository.getPopularClasses();

      expect(result).toEqual(mockClasses);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { bookedCount: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          bookedCount: true,
          capacity: true,
        },
      });
    });

    it("should return empty array if no classes", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([]);

      const result = await ReportsRepository.getPopularClasses();

      expect(result).toEqual([]);
    });
  });

  describe("getRevenueByDateRange", () => {
    it("should return revenue report for date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const mockDecimal = { toNumber: () => 2000000 } as Prisma.Decimal;
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: mockDecimal },
      });

      const mockDailyRevenue = [
        {
          date: new Date("2024-01-15"),
          revenue: new Prisma.Decimal(500000),
          count: BigInt(5),
        },
        {
          date: new Date("2024-01-16"),
          revenue: new Prisma.Decimal(600000),
          count: BigInt(6),
        },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockDailyRevenue);

      const result = await ReportsRepository.getRevenueByDateRange(
        startDate,
        endDate
      );

      expect(result.totalRevenue).toBe(2000000);
      expect(result.dailyRevenue).toHaveLength(2);
      expect(result.dailyRevenue[0]).toEqual({
        date: mockDailyRevenue[0].date,
        revenue: 500000,
        transactionCount: 5,
      });
    });

    it("should return 0 total revenue if no payments in range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: null },
      });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await ReportsRepository.getRevenueByDateRange(
        startDate,
        endDate
      );

      expect(result.totalRevenue).toBe(0);
      expect(result.dailyRevenue).toEqual([]);
    });
  });

  describe("getAttendanceByDateRange", () => {
    it("should return attendance report for date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      (prisma.checkIn.count as jest.Mock).mockResolvedValue(310);

      const mockDailyAttendance = [
        {
          date: new Date("2024-01-15"),
          check_ins: BigInt(10),
          unique_members: BigInt(8),
        },
        {
          date: new Date("2024-01-16"),
          check_ins: BigInt(12),
          unique_members: BigInt(10),
        },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockDailyAttendance);

      const result = await ReportsRepository.getAttendanceByDateRange(
        startDate,
        endDate
      );

      expect(result.totalCheckIns).toBe(310);
      expect(result.averageCheckInsPerDay).toBeCloseTo(10, 1);
      expect(result.dailyAttendance).toHaveLength(2);
      expect(result.dailyAttendance[0]).toEqual({
        date: mockDailyAttendance[0].date,
        checkIns: 10,
        uniqueMembers: 8,
      });
    });

    it("should return 0 average if no check-ins", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      (prisma.checkIn.count as jest.Mock).mockResolvedValue(0);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await ReportsRepository.getAttendanceByDateRange(
        startDate,
        endDate
      );

      expect(result.totalCheckIns).toBe(0);
      expect(result.averageCheckInsPerDay).toBe(0);
      expect(result.dailyAttendance).toEqual([]);
    });
  });
});
