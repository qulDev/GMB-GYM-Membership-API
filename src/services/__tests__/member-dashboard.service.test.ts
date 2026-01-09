import {
  MemberDashboardService,
  MemberDashboardServiceError,
} from "../member-dashboard.service";
import { MemberDashboardRepository } from "../../models";

jest.mock("../../models", () => ({
  MemberDashboardRepository: {
    getActiveSubscription: jest.fn(),
    getTotalCheckIns: jest.fn(),
    getThisMonthCheckIns: jest.fn(),
    getTodayCheckIns: jest.fn(),
    getAverageDuration: jest.fn(),
    getRecommendedClasses: jest.fn(),
    getUpcomingBookedClasses: jest.fn(),
    getRecentCheckIns: jest.fn(),
  },
}));

describe("MemberDashboardService", () => {
  const mockUserId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    const mockSubscription = {
      id: "sub123",
      status: "ACTIVE",
      startDate: new Date("2024-01-01"),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      membershipPlan: {
        id: "plan123",
        name: "Gold Plan",
        features: ["Gym Access", "Pool Access"],
        maxCheckInsPerDay: 2,
      },
    };

    const mockRecommendedClasses = [
      {
        id: "class1",
        name: "Morning Yoga",
        description: "Start your day with relaxing yoga",
        type: "yoga",
        schedule: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 60,
        capacity: 20,
        bookedCount: 15,
        trainer: {
          id: "trainer1",
          name: "John Doe",
          specialization: ["yoga", "pilates"],
        },
      },
    ];

    const mockBookedClasses = [
      {
        id: "booking1",
        gymClass: {
          id: "class2",
          name: "Boxing Basics",
          type: "boxing",
          schedule: new Date(Date.now() + 48 * 60 * 60 * 1000),
          duration: 45,
          status: "SCHEDULED",
          trainer: {
            id: "trainer2",
            name: "Mike Tyson",
          },
        },
      },
    ];

    const mockRecentCheckIns = [
      {
        id: "checkin1",
        checkInTime: new Date(),
        checkOutTime: new Date(),
        duration: 90,
      },
    ];

    it("should get dashboard stats successfully with active subscription", async () => {
      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(mockSubscription);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(50);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(10);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(1);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(60);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue(mockRecommendedClasses);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue(mockBookedClasses);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue(mockRecentCheckIns);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.subscription).not.toBeNull();
      expect(result.subscription?.planName).toBe("Gold Plan");
      expect(result.subscription?.features).toEqual([
        "Gym Access",
        "Pool Access",
      ]);
      expect(result.subscription?.daysRemaining).toBeGreaterThan(0);

      expect(result.checkInStats.totalCheckIns).toBe(50);
      expect(result.checkInStats.thisMonthCheckIns).toBe(10);
      expect(result.checkInStats.todayCheckIns).toBe(1);
      expect(result.checkInStats.remainingCheckInsToday).toBe(1); // 2 max - 1 today
      expect(result.checkInStats.averageDurationMinutes).toBe(60);

      expect(result.recommendedClasses).toHaveLength(1);
      expect(result.recommendedClasses[0].name).toBe("Morning Yoga");
      expect(result.recommendedClasses[0].availableSlots).toBe(5); // 20 capacity - 15 booked

      expect(result.upcomingBookedClasses).toHaveLength(1);
      expect(result.upcomingBookedClasses[0].name).toBe("Boxing Basics");

      expect(result.recentActivity).toHaveLength(1);
    });

    it("should get dashboard stats with null subscription", async () => {
      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(null);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.subscription).toBeNull();
      expect(result.checkInStats.remainingCheckInsToday).toBe(0);
      expect(result.recommendedClasses).toEqual([]);
      expect(result.upcomingBookedClasses).toEqual([]);
      expect(result.recentActivity).toEqual([]);
    });

    it("should calculate remaining check-ins correctly", async () => {
      const subscriptionWithHighLimit = {
        ...mockSubscription,
        membershipPlan: {
          ...mockSubscription.membershipPlan,
          maxCheckInsPerDay: 5,
        },
      };

      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(subscriptionWithHighLimit);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(10);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(5);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(3);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(45);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.checkInStats.remainingCheckInsToday).toBe(2); // 5 max - 3 today
    });

    it("should not have negative remaining check-ins", async () => {
      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(mockSubscription);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(100);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(30);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(5); // More than max (2)
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(60);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.checkInStats.remainingCheckInsToday).toBe(0); // Should not be negative
    });

    it("should handle expired subscription (0 days remaining)", async () => {
      const expiredSubscription = {
        ...mockSubscription,
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(expiredSubscription);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.subscription?.daysRemaining).toBe(0);
    });

    it("should handle subscription with null endDate", async () => {
      const subscriptionNoEndDate = {
        ...mockSubscription,
        endDate: null,
      };

      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(subscriptionNoEndDate);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.subscription?.daysRemaining).toBe(0);
      expect(result.subscription?.endDate).toBeNull();
    });

    it("should process recommended classes with isBookable flag", async () => {
      const classesWithVariedCapacity = [
        {
          id: "class1",
          name: "Full Class",
          description: null,
          type: "yoga",
          schedule: new Date(),
          duration: 60,
          capacity: 10,
          bookedCount: 10, // Full
          trainer: { id: "t1", name: "Trainer", specialization: [] },
        },
        {
          id: "class2",
          name: "Available Class",
          description: "Some description",
          type: "cardio",
          schedule: new Date(),
          duration: 45,
          capacity: 20,
          bookedCount: 5,
          trainer: { id: "t2", name: "Trainer 2", specialization: ["cardio"] },
        },
      ];

      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(null);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue(classesWithVariedCapacity);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.recommendedClasses[0].isBookable).toBe(false); // Full class
      expect(result.recommendedClasses[0].availableSlots).toBe(0);
      expect(result.recommendedClasses[1].isBookable).toBe(true); // Has slots
      expect(result.recommendedClasses[1].availableSlots).toBe(15);
    });

    it("should process recent activity with null checkOutTime", async () => {
      const checkInsWithNull = [
        {
          id: "c1",
          checkInTime: new Date(),
          checkOutTime: null,
          duration: null,
        },
        {
          id: "c2",
          checkInTime: new Date(),
          checkOutTime: new Date(),
          duration: 60,
        },
      ];

      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(null);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(2);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(2);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(2);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(30);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue(checkInsWithNull);

      const result = await MemberDashboardService.getDashboardStats(mockUserId);

      expect(result.recentActivity[0].checkOutTime).toBeNull();
      expect(result.recentActivity[0].duration).toBeNull();
      expect(result.recentActivity[1].checkOutTime).not.toBeNull();
      expect(result.recentActivity[1].duration).toBe(60);
    });

    it("should throw INTERNAL error on database failure", async () => {
      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockRejectedValue(new Error("Database connection failed"));

      await expect(
        MemberDashboardService.getDashboardStats(mockUserId)
      ).rejects.toMatchObject({
        message: "Failed to fetch member dashboard statistics",
        code: "INTERNAL",
      });
    });

    it("should rethrow MemberDashboardServiceError", async () => {
      const serviceError = new MemberDashboardServiceError(
        "Custom error",
        "NOT_FOUND"
      );
      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockRejectedValue(serviceError);

      await expect(
        MemberDashboardService.getDashboardStats(mockUserId)
      ).rejects.toMatchObject({
        message: "Custom error",
        code: "NOT_FOUND",
      });
    });

    it("should call all repository methods with correct userId", async () => {
      (
        MemberDashboardRepository.getActiveSubscription as jest.Mock
      ).mockResolvedValue(null);
      (
        MemberDashboardRepository.getTotalCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getThisMonthCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getTodayCheckIns as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getAverageDuration as jest.Mock
      ).mockResolvedValue(0);
      (
        MemberDashboardRepository.getRecommendedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getUpcomingBookedClasses as jest.Mock
      ).mockResolvedValue([]);
      (
        MemberDashboardRepository.getRecentCheckIns as jest.Mock
      ).mockResolvedValue([]);

      await MemberDashboardService.getDashboardStats(mockUserId);

      expect(
        MemberDashboardRepository.getActiveSubscription
      ).toHaveBeenCalledWith(mockUserId);
      expect(MemberDashboardRepository.getTotalCheckIns).toHaveBeenCalledWith(
        mockUserId
      );
      expect(
        MemberDashboardRepository.getThisMonthCheckIns
      ).toHaveBeenCalledWith(mockUserId);
      expect(MemberDashboardRepository.getTodayCheckIns).toHaveBeenCalledWith(
        mockUserId
      );
      expect(MemberDashboardRepository.getAverageDuration).toHaveBeenCalledWith(
        mockUserId
      );
      expect(
        MemberDashboardRepository.getRecommendedClasses
      ).toHaveBeenCalledWith(mockUserId);
      expect(
        MemberDashboardRepository.getUpcomingBookedClasses
      ).toHaveBeenCalledWith(mockUserId);
      expect(MemberDashboardRepository.getRecentCheckIns).toHaveBeenCalledWith(
        mockUserId
      );
    });
  });
});
