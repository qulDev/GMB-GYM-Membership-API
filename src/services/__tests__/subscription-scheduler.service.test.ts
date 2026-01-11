import { SubscriptionSchedulerService } from "../subscription-scheduler.service";
import { SubscriptionRepository } from "../../models/subscription.repository";
import { LogsService } from "../logs.service";
import { SubscriptionStatus } from "../../generated/prisma";

jest.mock("../../models/subscription.repository");
jest.mock("../logs.service");

describe("SubscriptionSchedulerService", () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    fullName: "Test User",
  };

  const mockMembershipPlan = {
    id: "plan123",
    name: "Premium Monthly",
  };

  const mockExpiredSubscription = {
    id: "sub123",
    userId: "user123",
    membershipPlanId: "plan123",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    status: "ACTIVE" as SubscriptionStatus,
    user: mockUser,
    membershipPlan: mockMembershipPlan,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("expireOverdueSubscriptions", () => {
    it("should expire overdue subscriptions and log each expiration", async () => {
      const expiredSubscriptions = [
        { ...mockExpiredSubscription, id: "sub1" },
        { ...mockExpiredSubscription, id: "sub2" },
        { ...mockExpiredSubscription, id: "sub3" },
      ];

      (SubscriptionRepository.findExpired as jest.Mock).mockResolvedValue(
        expiredSubscriptions
      );
      (SubscriptionRepository.expireMany as jest.Mock).mockResolvedValue({
        count: 3,
      });
      (LogsService.createLog as jest.Mock).mockResolvedValue({});

      const result =
        await SubscriptionSchedulerService.expireOverdueSubscriptions();

      expect(result).toEqual({
        expiredCount: 3,
        expiredSubscriptions: [
          {
            id: "sub1",
            userId: "user123",
            userEmail: "test@example.com",
            userName: "Test User",
            planName: "Premium Monthly",
            endDate: new Date("2024-01-31"),
          },
          {
            id: "sub2",
            userId: "user123",
            userEmail: "test@example.com",
            userName: "Test User",
            planName: "Premium Monthly",
            endDate: new Date("2024-01-31"),
          },
          {
            id: "sub3",
            userId: "user123",
            userEmail: "test@example.com",
            userName: "Test User",
            planName: "Premium Monthly",
            endDate: new Date("2024-01-31"),
          },
        ],
      });
      expect(SubscriptionRepository.findExpired).toHaveBeenCalledTimes(1);
      expect(SubscriptionRepository.expireMany).toHaveBeenCalledWith([
        "sub1",
        "sub2",
        "sub3",
      ]);
      expect(LogsService.createLog).toHaveBeenCalledTimes(3);
    });

    it("should return zero count when no subscriptions to expire", async () => {
      (SubscriptionRepository.findExpired as jest.Mock).mockResolvedValue([]);

      const result =
        await SubscriptionSchedulerService.expireOverdueSubscriptions();

      expect(result).toEqual({
        expiredCount: 0,
        expiredSubscriptions: [],
      });
      expect(SubscriptionRepository.expireMany).not.toHaveBeenCalled();
      expect(LogsService.createLog).not.toHaveBeenCalled();
    });

    it("should log expiration for each subscription with user and plan info", async () => {
      const expiredSubscriptions = [
        {
          ...mockExpiredSubscription,
          id: "sub1",
          user: { id: "user1", email: "user1@test.com", fullName: "User One" },
          membershipPlan: { id: "plan1", name: "Basic Plan" },
        },
      ];

      (SubscriptionRepository.findExpired as jest.Mock).mockResolvedValue(
        expiredSubscriptions
      );
      (SubscriptionRepository.expireMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (LogsService.createLog as jest.Mock).mockResolvedValue({});

      await SubscriptionSchedulerService.expireOverdueSubscriptions();

      expect(LogsService.createLog).toHaveBeenCalledWith({
        userId: "user1",
        action: "SUBSCRIPTION_EXPIRED",
        entity: "SUBSCRIPTION",
        entityId: "sub1",
        description: "Subscription for Basic Plan has expired",
        level: "INFO",
        metadata: {
          planName: "Basic Plan",
          endDate: expect.any(String),
        },
      });
    });

    it("should handle errors gracefully and continue with logging", async () => {
      const expiredSubscriptions = [{ ...mockExpiredSubscription, id: "sub1" }];

      (SubscriptionRepository.findExpired as jest.Mock).mockResolvedValue(
        expiredSubscriptions
      );
      (SubscriptionRepository.expireMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (LogsService.createLog as jest.Mock).mockRejectedValue(
        new Error("Logging failed")
      );

      const result =
        await SubscriptionSchedulerService.expireOverdueSubscriptions();

      // Should still return result even if logging fails
      expect(result.expiredCount).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });

    it("should propagate error when findExpired fails", async () => {
      const error = new Error("Database connection failed");
      (SubscriptionRepository.findExpired as jest.Mock).mockRejectedValue(
        error
      );

      await expect(
        SubscriptionSchedulerService.expireOverdueSubscriptions()
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getExpiringSoon", () => {
    it("should return subscriptions expiring within specified days", async () => {
      const expiringSubscriptions = [
        {
          ...mockExpiredSubscription,
          id: "sub1",
          endDate: new Date("2024-02-05"),
        },
        {
          ...mockExpiredSubscription,
          id: "sub2",
          endDate: new Date("2024-02-07"),
        },
      ];

      (SubscriptionRepository.findMany as jest.Mock).mockResolvedValue(
        expiringSubscriptions
      );

      const result = await SubscriptionSchedulerService.getExpiringSoon(7);

      expect(result.count).toBe(2);
      expect(result.subscriptions).toHaveLength(2);
      expect(SubscriptionRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ACTIVE",
        })
      );
    });

    it("should default to 7 days when no parameter provided", async () => {
      (SubscriptionRepository.findMany as jest.Mock).mockResolvedValue([]);

      const result = await SubscriptionSchedulerService.getExpiringSoon();

      expect(result.count).toBe(0);
      expect(result.subscriptions).toEqual([]);
    });

    it("should return empty array when no expiring subscriptions", async () => {
      (SubscriptionRepository.findMany as jest.Mock).mockResolvedValue([]);

      const result = await SubscriptionSchedulerService.getExpiringSoon(30);

      expect(result.count).toBe(0);
      expect(result.subscriptions).toEqual([]);
    });

    it("should handle repository errors", async () => {
      (SubscriptionRepository.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        SubscriptionSchedulerService.getExpiringSoon(7)
      ).rejects.toThrow("Database error");
    });
  });
});
