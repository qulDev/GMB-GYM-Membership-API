import { SubscriptionService } from "../subscription.service";
import { SubscriptionRepository, MembershipPlanRepository } from "../../models";
import { SubscriptionStatus } from "../../generated/prisma";

jest.mock("../../models", () => ({
  SubscriptionRepository: {
    create: jest.fn(),
    findActiveByUser: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    activate: jest.fn(),
    cancel: jest.fn(),
  },
  MembershipPlanRepository: {
    findById: jest.fn(),
  },
}));

describe("SubscriptionService", () => {
  const mockMembershipPlan = {
    id: "plan123",
    name: "Premium Monthly",
    price: { toNumber: () => 500000 },
    duration: 30,
    features: ["Unlimited access"],
    isActive: true,
  };

  const mockSubscription = {
    id: "subscription123",
    userId: "user123",
    membershipPlanId: "plan123",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    status: "ACTIVE" as SubscriptionStatus,
    membershipPlan: mockMembershipPlan,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSubscription", () => {
    it("should create subscription successfully", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        null
      );
      (SubscriptionRepository.create as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await SubscriptionService.createSubscription(
        "user123",
        "plan123"
      );

      expect(result).toEqual(mockSubscription);
      expect(MembershipPlanRepository.findById).toHaveBeenCalledWith("plan123");
      expect(SubscriptionRepository.findActiveByUser).toHaveBeenCalledWith(
        "user123"
      );
      expect(SubscriptionRepository.create).toHaveBeenCalledWith({
        userId: "user123",
        membershipPlanId: "plan123",
        status: "PENDING",
      });
    });

    it("should throw error if plan not found", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        SubscriptionService.createSubscription("user123", "nonexistent")
      ).rejects.toThrow("Membership plan not available");
    });

    it("should throw error if plan is inactive", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue({
        ...mockMembershipPlan,
        isActive: false,
      });

      await expect(
        SubscriptionService.createSubscription("user123", "plan123")
      ).rejects.toThrow("Membership plan not available");
    });

    it("should throw error if user already has active subscription", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      await expect(
        SubscriptionService.createSubscription("user123", "plan123")
      ).rejects.toThrow("You already have an active subscription");
    });
  });

  describe("getCurrentSubscription", () => {
    it("should return current active subscription", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await SubscriptionService.getCurrentSubscription(
        "user123"
      );

      expect(result).toEqual(mockSubscription);
      expect(SubscriptionRepository.findActiveByUser).toHaveBeenCalledWith(
        "user123"
      );
    });

    it("should return null if no active subscription", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        null
      );

      const result = await SubscriptionService.getCurrentSubscription(
        "user123"
      );

      expect(result).toBeNull();
    });
  });

  describe("getAllSubscriptions", () => {
    it("should get all subscriptions without filters", async () => {
      (SubscriptionRepository.findMany as jest.Mock).mockResolvedValue([
        mockSubscription,
      ]);

      const result = await SubscriptionService.getAllSubscriptions({});

      expect(result).toEqual([mockSubscription]);
      expect(SubscriptionRepository.findMany).toHaveBeenCalledWith({});
    });

    it("should filter subscriptions by status", async () => {
      (SubscriptionRepository.findMany as jest.Mock).mockResolvedValue([
        mockSubscription,
      ]);

      const result = await SubscriptionService.getAllSubscriptions({
        status: "ACTIVE",
      });

      expect(result).toEqual([mockSubscription]);
      expect(SubscriptionRepository.findMany).toHaveBeenCalledWith({
        status: "ACTIVE",
      });
    });

    it("should filter subscriptions by userId", async () => {
      (SubscriptionRepository.findMany as jest.Mock).mockResolvedValue([
        mockSubscription,
      ]);

      const result = await SubscriptionService.getAllSubscriptions({
        userId: "user123",
      });

      expect(result).toEqual([mockSubscription]);
      expect(SubscriptionRepository.findMany).toHaveBeenCalledWith({
        userId: "user123",
      });
    });
  });

  describe("activateSubscription", () => {
    it("should activate subscription successfully", async () => {
      const subscriptionWithPlan = {
        ...mockSubscription,
        membershipPlan: { ...mockMembershipPlan, duration: 30 },
      };
      const activatedSubscription = {
        ...subscriptionWithPlan,
        status: "ACTIVE",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      };

      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(
        subscriptionWithPlan
      );
      (SubscriptionRepository.update as jest.Mock).mockResolvedValue(
        activatedSubscription
      );

      const result = await SubscriptionService.activateSubscription(
        "subscription123"
      );

      expect(result).toEqual(activatedSubscription);
      expect(SubscriptionRepository.findById).toHaveBeenCalledWith(
        "subscription123"
      );
      expect(SubscriptionRepository.update).toHaveBeenCalledWith(
        "subscription123",
        {
          status: "ACTIVE",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }
      );
    });

    it("should throw error if subscription not found", async () => {
      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        SubscriptionService.activateSubscription("nonexistent")
      ).rejects.toThrow("Subscription not found");
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel subscription successfully", async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };

      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (SubscriptionRepository.update as jest.Mock).mockResolvedValue(
        cancelledSubscription
      );

      const result = await SubscriptionService.cancelSubscription(
        "subscription123"
      );

      expect(result).toEqual(cancelledSubscription);
      expect(SubscriptionRepository.findById).toHaveBeenCalledWith(
        "subscription123"
      );
      expect(SubscriptionRepository.update).toHaveBeenCalledWith(
        "subscription123",
        {
          status: SubscriptionStatus.CANCELLED,
        }
      );
    });

    it("should throw error if subscription not found", async () => {
      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        SubscriptionService.cancelSubscription("nonexistent")
      ).rejects.toThrow("Subscription not found");
    });

    it("should throw error if subscription already cancelled", async () => {
      const alreadyCancelled = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(
        alreadyCancelled
      );

      await expect(
        SubscriptionService.cancelSubscription("subscription123")
      ).rejects.toThrow("Subscription already canceled");
    });
  });

  describe("cancelUserSubscription", () => {
    it("should cancel user's active subscription successfully", async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };

      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (SubscriptionRepository.update as jest.Mock).mockResolvedValue(
        cancelledSubscription
      );

      const result = await SubscriptionService.cancelUserSubscription(
        "user123"
      );

      expect(result).toEqual(cancelledSubscription);
      expect(SubscriptionRepository.findActiveByUser).toHaveBeenCalledWith(
        "user123"
      );
      expect(SubscriptionRepository.update).toHaveBeenCalledWith(
        "subscription123",
        {
          status: SubscriptionStatus.CANCELLED,
        }
      );
    });

    it("should throw error if no active subscription found", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        SubscriptionService.cancelUserSubscription("user123")
      ).rejects.toThrow("No active subscription found");
    });

    it("should throw error if subscription already cancelled", async () => {
      const alreadyCancelled = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        alreadyCancelled
      );

      await expect(
        SubscriptionService.cancelUserSubscription("user123")
      ).rejects.toThrow("Subscription already canceled");
    });

    it("should throw error if subscription is expired", async () => {
      const expiredSub = {
        ...mockSubscription,
        status: SubscriptionStatus.EXPIRED,
      };
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        expiredSub
      );

      await expect(
        SubscriptionService.cancelUserSubscription("user123")
      ).rejects.toThrow("Cannot cancel an expired subscription");
    });

    it("should throw error if subscription is pending", async () => {
      const pendingSub = {
        ...mockSubscription,
        status: SubscriptionStatus.PENDING,
      };
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        pendingSub
      );

      await expect(
        SubscriptionService.cancelUserSubscription("user123")
      ).rejects.toThrow("Cannot cancel a pending subscription");
    });
  });
});
