import { PaymentService } from "../payments.service";
import { PaymentRepository, SubscriptionRepository } from "../../models";
import { snap } from "../../config/midtrans.config";
import { Prisma } from "../../generated/prisma";

jest.mock("../../models", () => ({
  PaymentRepository: {
    create: jest.fn(),
    findByOrderId: jest.fn(),
    markPaid: jest.fn(),
    markFailed: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
  },
  SubscriptionRepository: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../../config/midtrans.config", () => ({
  snap: {
    createTransaction: jest.fn(),
  },
}));

describe("PaymentService", () => {
  const mockMembershipPlan = {
    id: "plan123",
    name: "Premium",
    price: { toNumber: () => 500000 },
    duration: 30,
  };

  const mockSubscription = {
    id: "subscription123",
    userId: "user123",
    membershipPlanId: "plan123",
    status: "PENDING",
    membershipPlan: mockMembershipPlan,
  };

  const mockPayment = {
    id: "payment123",
    userId: "user123",
    subscriptionId: "subscription123",
    amount: new Prisma.Decimal(500000),
    status: "PENDING",
    midtransOrderId: "GYM-123-subscription123",
    midtransTransactionId: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSnapPayment", () => {
    it("should create snap payment successfully", async () => {
      const snapResponse = {
        token: "snap-token-123",
        redirect_url: "https://midtrans.com/redirect",
      };

      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (PaymentRepository.create as jest.Mock).mockResolvedValue(mockPayment);
      (snap.createTransaction as jest.Mock).mockResolvedValue(snapResponse);

      const result = await PaymentService.createSnapPayment(
        "user123",
        "subscription123"
      );

      expect(result).toEqual({
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        paymentId: mockPayment.id,
      });
      expect(SubscriptionRepository.findById).toHaveBeenCalledWith(
        "subscription123"
      );
      expect(PaymentRepository.create).toHaveBeenCalledWith({
        userId: "user123",
        subscriptionId: "subscription123",
        amount: expect.any(Prisma.Decimal),
        midtransOrderId: expect.stringMatching(/^GYM-\d+-subscription123$/),
      });
      expect(snap.createTransaction).toHaveBeenCalledWith({
        transaction_details: {
          order_id: expect.stringMatching(/^GYM-\d+-subscription123$/),
          gross_amount: 500000,
        },
      });
    });

    it("should throw error if subscription not found", async () => {
      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        PaymentService.createSnapPayment("user123", "nonexistent")
      ).rejects.toThrow("Subscription not found");
    });
  });

  describe("handleNotification", () => {
    it("should handle settlement notification and activate subscription", async () => {
      const notification = {
        order_id: "GYM-123-subscription123",
        transaction_status: "settlement",
        transaction_id: "TRX-789",
      };

      const subscriptionWithPlan = {
        ...mockSubscription,
        membershipPlan: { ...mockMembershipPlan, duration: 30 },
      };

      (PaymentRepository.findByOrderId as jest.Mock).mockResolvedValue(
        mockPayment
      );
      (PaymentRepository.markPaid as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: "SUCCESS",
      });
      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(
        subscriptionWithPlan
      );
      (SubscriptionRepository.update as jest.Mock).mockResolvedValue({
        ...subscriptionWithPlan,
        status: "ACTIVE",
      });

      await PaymentService.handleNotification(notification);

      expect(PaymentRepository.findByOrderId).toHaveBeenCalledWith(
        notification.order_id
      );
      expect(PaymentRepository.markPaid).toHaveBeenCalledWith(
        mockPayment.id,
        notification.transaction_id
      );
      expect(SubscriptionRepository.findById).toHaveBeenCalledWith(
        mockPayment.subscriptionId
      );
      expect(SubscriptionRepository.update).toHaveBeenCalledWith(
        mockSubscription.id,
        {
          status: "ACTIVE",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }
      );
    });

    it("should handle deny notification and mark payment as failed", async () => {
      const notification = {
        order_id: "GYM-123-subscription123",
        transaction_status: "deny",
      };

      (PaymentRepository.findByOrderId as jest.Mock).mockResolvedValue(
        mockPayment
      );
      (PaymentRepository.markFailed as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: "FAILED",
      });

      await PaymentService.handleNotification(notification);

      expect(PaymentRepository.markFailed).toHaveBeenCalledWith(mockPayment.id);
    });

    it("should handle cancel notification and mark payment as failed", async () => {
      const notification = {
        order_id: "GYM-123-subscription123",
        transaction_status: "cancel",
      };

      (PaymentRepository.findByOrderId as jest.Mock).mockResolvedValue(
        mockPayment
      );
      (PaymentRepository.markFailed as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: "FAILED",
      });

      await PaymentService.handleNotification(notification);

      expect(PaymentRepository.markFailed).toHaveBeenCalledWith(mockPayment.id);
    });

    it("should handle expire notification and mark payment as failed", async () => {
      const notification = {
        order_id: "GYM-123-subscription123",
        transaction_status: "expire",
      };

      (PaymentRepository.findByOrderId as jest.Mock).mockResolvedValue(
        mockPayment
      );
      (PaymentRepository.markFailed as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: "FAILED",
      });

      await PaymentService.handleNotification(notification);

      expect(PaymentRepository.markFailed).toHaveBeenCalledWith(mockPayment.id);
    });

    it("should do nothing if payment not found", async () => {
      const notification = {
        order_id: "INVALID-ORDER",
        transaction_status: "settlement",
      };

      (PaymentRepository.findByOrderId as jest.Mock).mockResolvedValue(null);

      await PaymentService.handleNotification(notification);

      expect(PaymentRepository.markPaid).not.toHaveBeenCalled();
      expect(PaymentRepository.markFailed).not.toHaveBeenCalled();
    });

    it("should not activate subscription if subscription not found after payment", async () => {
      const notification = {
        order_id: "GYM-123-subscription123",
        transaction_status: "settlement",
        transaction_id: "TRX-789",
      };

      (PaymentRepository.findByOrderId as jest.Mock).mockResolvedValue(
        mockPayment
      );
      (PaymentRepository.markPaid as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: "SUCCESS",
      });
      (SubscriptionRepository.findById as jest.Mock).mockResolvedValue(null);

      await PaymentService.handleNotification(notification);

      expect(SubscriptionRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("getHistory", () => {
    it("should get payment history for user", async () => {
      const mockPayments = [mockPayment];
      (PaymentRepository.findByUser as jest.Mock).mockResolvedValue(
        mockPayments
      );

      const result = await PaymentService.getHistory("user123");

      expect(result).toEqual(mockPayments);
      expect(PaymentRepository.findByUser).toHaveBeenCalledWith("user123");
    });

    it("should return empty array if no payments", async () => {
      (PaymentRepository.findByUser as jest.Mock).mockResolvedValue([]);

      const result = await PaymentService.getHistory("user123");

      expect(result).toEqual([]);
    });
  });

  describe("getDetail", () => {
    it("should get payment details by ID", async () => {
      (PaymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);

      const result = await PaymentService.getDetail("payment123");

      expect(result).toEqual(mockPayment);
      expect(PaymentRepository.findById).toHaveBeenCalledWith("payment123");
    });

    it("should return null if payment not found", async () => {
      (PaymentRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await PaymentService.getDetail("nonexistent");

      expect(result).toBeNull();
    });
  });
});
