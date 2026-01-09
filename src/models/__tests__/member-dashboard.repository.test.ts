import { MemberDashboardRepository } from "../member-dashboard.repository";
import { prisma } from "../../config/database.config";
import { ClassStatus, BookingStatus } from "../../generated/prisma";

jest.mock("../../config/database.config", () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
    },
    checkIn: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    classBooking: {
      findMany: jest.fn(),
    },
    gymClass: {
      findMany: jest.fn(),
    },
  },
}));

describe("MemberDashboardRepository", () => {
  const mockUserId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveSubscription", () => {
    it("should return active subscription with membership plan", async () => {
      const mockSubscription = {
        id: "sub123",
        userId: mockUserId,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        membershipPlan: {
          id: "plan123",
          name: "Gold",
          features: ["Feature 1", "Feature 2"],
          maxCheckInsPerDay: 2,
        },
      };

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await MemberDashboardRepository.getActiveSubscription(
        mockUserId
      );

      expect(result).toEqual(mockSubscription);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: "ACTIVE",
        },
        include: {
          membershipPlan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return null if no active subscription", async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await MemberDashboardRepository.getActiveSubscription(
        mockUserId
      );

      expect(result).toBeNull();
    });
  });

  describe("getTotalCheckIns", () => {
    it("should return total check-ins count", async () => {
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(50);

      const result = await MemberDashboardRepository.getTotalCheckIns(
        mockUserId
      );

      expect(result).toBe(50);
      expect(prisma.checkIn.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it("should return 0 if no check-ins", async () => {
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(0);

      const result = await MemberDashboardRepository.getTotalCheckIns(
        mockUserId
      );

      expect(result).toBe(0);
    });
  });

  describe("getThisMonthCheckIns", () => {
    it("should return this month check-ins count", async () => {
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(10);

      const result = await MemberDashboardRepository.getThisMonthCheckIns(
        mockUserId
      );

      expect(result).toBe(10);
      expect(prisma.checkIn.count).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          checkInTime: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });
    });
  });

  describe("getTodayCheckIns", () => {
    it("should return today check-ins count", async () => {
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(1);

      const result = await MemberDashboardRepository.getTodayCheckIns(
        mockUserId
      );

      expect(result).toBe(1);
      expect(prisma.checkIn.count).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          checkInTime: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe("getAverageDuration", () => {
    it("should return average check-in duration", async () => {
      (prisma.checkIn.aggregate as jest.Mock).mockResolvedValue({
        _avg: { duration: 45.6 },
      });

      const result = await MemberDashboardRepository.getAverageDuration(
        mockUserId
      );

      expect(result).toBe(46); // Rounded
      expect(prisma.checkIn.aggregate).toHaveBeenCalledWith({
        _avg: { duration: true },
        where: {
          userId: mockUserId,
          duration: { not: null },
        },
      });
    });

    it("should return 0 if no duration data", async () => {
      (prisma.checkIn.aggregate as jest.Mock).mockResolvedValue({
        _avg: { duration: null },
      });

      const result = await MemberDashboardRepository.getAverageDuration(
        mockUserId
      );

      expect(result).toBe(0);
    });
  });

  describe("getRecommendedClasses", () => {
    it("should return recommended classes excluding already booked", async () => {
      const mockBookedClasses = [{ classId: "class1" }, { classId: "class2" }];
      const mockClasses = [
        {
          id: "class3",
          name: "Yoga",
          description: "Relaxing yoga",
          type: "yoga",
          schedule: new Date(Date.now() + 24 * 60 * 60 * 1000),
          duration: 60,
          capacity: 20,
          bookedCount: 15,
          status: ClassStatus.SCHEDULED,
          trainer: {
            id: "trainer1",
            name: "John",
            specialization: ["yoga"],
          },
        },
      ];

      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue(
        mockBookedClasses
      );
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue(mockClasses);

      const result = await MemberDashboardRepository.getRecommendedClasses(
        mockUserId
      );

      expect(result).toEqual(mockClasses);
      expect(prisma.classBooking.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: BookingStatus.CONFIRMED,
        },
        select: {
          classId: true,
        },
      });
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: {
          status: ClassStatus.SCHEDULED,
          schedule: { gt: expect.any(Date) },
          id: { notIn: ["class1", "class2"] },
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
        orderBy: [{ schedule: "asc" }, { bookedCount: "desc" }],
        take: 5,
      });
    });

    it("should return classes with custom limit", async () => {
      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([]);

      await MemberDashboardRepository.getRecommendedClasses(mockUserId, 10);

      expect(prisma.gymClass.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it("should return empty array if no classes available", async () => {
      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([]);

      const result = await MemberDashboardRepository.getRecommendedClasses(
        mockUserId
      );

      expect(result).toEqual([]);
    });
  });

  describe("getUpcomingBookedClasses", () => {
    it("should return upcoming booked classes", async () => {
      const mockBookings = [
        {
          id: "booking1",
          userId: mockUserId,
          status: BookingStatus.CONFIRMED,
          gymClass: {
            id: "class1",
            name: "Boxing",
            type: "boxing",
            schedule: new Date(Date.now() + 48 * 60 * 60 * 1000),
            duration: 45,
            status: ClassStatus.SCHEDULED,
            trainer: {
              id: "trainer2",
              name: "Mike",
            },
          },
        },
      ];

      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue(
        mockBookings
      );

      const result = await MemberDashboardRepository.getUpcomingBookedClasses(
        mockUserId
      );

      expect(result).toEqual(mockBookings);
      expect(prisma.classBooking.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: BookingStatus.CONFIRMED,
          gymClass: {
            schedule: { gt: expect.any(Date) },
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
        take: 5,
      });
    });

    it("should return booked classes with custom limit", async () => {
      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue([]);

      await MemberDashboardRepository.getUpcomingBookedClasses(mockUserId, 3);

      expect(prisma.classBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        })
      );
    });
  });

  describe("getRecentCheckIns", () => {
    it("should return recent check-ins", async () => {
      const mockCheckIns = [
        {
          id: "checkin1",
          userId: mockUserId,
          checkInTime: new Date(),
          checkOutTime: new Date(),
          duration: 60,
        },
        {
          id: "checkin2",
          userId: mockUserId,
          checkInTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          checkOutTime: null,
          duration: null,
        },
      ];

      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue(mockCheckIns);

      const result = await MemberDashboardRepository.getRecentCheckIns(
        mockUserId
      );

      expect(result).toEqual(mockCheckIns);
      expect(prisma.checkIn.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: {
          checkInTime: "desc",
        },
        take: 5,
      });
    });

    it("should return check-ins with custom limit", async () => {
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([]);

      await MemberDashboardRepository.getRecentCheckIns(mockUserId, 10);

      expect(prisma.checkIn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it("should return empty array if no check-ins", async () => {
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([]);

      const result = await MemberDashboardRepository.getRecentCheckIns(
        mockUserId
      );

      expect(result).toEqual([]);
    });
  });
});
