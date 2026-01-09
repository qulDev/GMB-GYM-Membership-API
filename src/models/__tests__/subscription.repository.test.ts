import { SubscriptionRepository } from "../subscription.repository";
import { prisma } from "../../config/database.config";
import { SubscriptionStatus } from "../../generated/prisma";

jest.mock("../../config/database.config", () => ({
  prisma: {
    subscription: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("SubscriptionRepository", () => {
  const mockMembershipPlan = {
    id: "plan123",
    name: "Premium Monthly",
    price: 500000,
    duration: 30,
    features: ["Unlimited access"],
  };

  const mockUser = {
    id: "user123",
    email: "test@example.com",
    fullName: "Test User",
  };

  const mockSubscription = {
    id: "subscription123",
    userId: "user123",
    membershipPlanId: "plan123",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    status: "ACTIVE" as SubscriptionStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscriptionWithPlan = {
    ...mockSubscription,
    membershipPlan: mockMembershipPlan,
  };

  const mockSubscriptionWithRelations = {
    ...mockSubscription,
    membershipPlan: mockMembershipPlan,
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new subscription", async () => {
      const subscriptionData = {
        userId: "user123",
        membershipPlanId: "plan123",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        status: "PENDING" as SubscriptionStatus,
      };
      (prisma.subscription.create as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await SubscriptionRepository.create(subscriptionData);

      expect(result).toEqual(mockSubscription);
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: subscriptionData,
      });
    });

    it("should create subscription with minimal data", async () => {
      const subscriptionData = {
        userId: "user123",
        membershipPlanId: "plan123",
      };
      (prisma.subscription.create as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await SubscriptionRepository.create(subscriptionData);

      expect(result).toEqual(mockSubscription);
    });
  });

  describe("findActiveByUser", () => {
    it("should find active subscription for user with membership plan", async () => {
      const userId = "user123";
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(
        mockSubscriptionWithPlan
      );

      const result = await SubscriptionRepository.findActiveByUser(userId);

      expect(result).toEqual(mockSubscriptionWithPlan);
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          status: "ACTIVE",
        },
        include: {
          membershipPlan: true,
        },
      });
    });

    it("should return null if no active subscription", async () => {
      const userId = "user123";
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await SubscriptionRepository.findActiveByUser(userId);

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find subscription by ID with relations", async () => {
      const subscriptionId = "subscription123";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(
        mockSubscriptionWithRelations
      );

      const result = await SubscriptionRepository.findById(subscriptionId);

      expect(result).toEqual(mockSubscriptionWithRelations);
      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        include: {
          membershipPlan: true,
          user: true,
        },
      });
    });

    it("should return null if subscription not found", async () => {
      const subscriptionId = "nonexistent";
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await SubscriptionRepository.findById(subscriptionId);

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should find subscriptions with where clause", async () => {
      const where = { userId: "user123" };
      (prisma.subscription.findMany as jest.Mock).mockResolvedValue([
        mockSubscriptionWithRelations,
      ]);

      const result = await SubscriptionRepository.findMany(where);

      expect(result).toEqual([mockSubscriptionWithRelations]);
      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          membershipPlan: true,
          user: true,
        },
      });
    });

    it("should return empty array if no subscriptions found", async () => {
      const where = { userId: "unknown-user" };
      (prisma.subscription.findMany as jest.Mock).mockResolvedValue([]);

      const result = await SubscriptionRepository.findMany(where);

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update subscription", async () => {
      const subscriptionId = "subscription123";
      const updateData = { status: "EXPIRED" as SubscriptionStatus };
      const updatedSubscription = { ...mockSubscription, ...updateData };
      (prisma.subscription.update as jest.Mock).mockResolvedValue(
        updatedSubscription
      );

      const result = await SubscriptionRepository.update(
        subscriptionId,
        updateData
      );

      expect(result).toEqual(updatedSubscription);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: updateData,
      });
    });
  });

  describe("activate", () => {
    it("should activate subscription with start and end dates", async () => {
      const subscriptionId = "subscription123";
      const activatedSubscription = {
        ...mockSubscription,
        status: "ACTIVE" as SubscriptionStatus,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      };
      (prisma.subscription.update as jest.Mock).mockResolvedValue(
        activatedSubscription
      );

      const result = await SubscriptionRepository.activate(subscriptionId);

      expect(result).toEqual(activatedSubscription);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
      });
    });
  });

  describe("cancel", () => {
    it("should cancel subscription", async () => {
      const subscriptionId = "subscription123";
      const cancelledSubscription = {
        ...mockSubscription,
        status: "CANCELLED" as SubscriptionStatus,
      };
      (prisma.subscription.update as jest.Mock).mockResolvedValue(
        cancelledSubscription
      );

      const result = await SubscriptionRepository.cancel(subscriptionId);

      expect(result).toEqual(cancelledSubscription);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    });
  });
});
