import { PaymentRepository } from "../payments.repository";
import { prisma } from "../../config/database.config";
import { Prisma } from "../../generated/prisma";

jest.mock("../../config/database.config", () => ({
  prisma: {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("PaymentRepository", () => {
  const mockPayment = {
    id: "payment123",
    userId: "user123",
    subscriptionId: "subscription123",
    amount: new Prisma.Decimal(500000),
    paymentMethod: null,
    status: "PENDING",
    midtransOrderId: "ORDER-123456",
    midtransTransactionId: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaidPayment = {
    ...mockPayment,
    status: "SUCCESS",
    midtransTransactionId: "TRX-789",
    paidAt: new Date("2024-01-15T12:00:00Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new payment", async () => {
      const paymentData = {
        userId: "user123",
        subscriptionId: "subscription123",
        amount: new Prisma.Decimal(500000),
        midtransOrderId: "ORDER-123456",
      };
      (prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);

      const result = await PaymentRepository.create(paymentData);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.create).toHaveBeenCalledWith({ data: paymentData });
    });
  });

  describe("findByOrderId", () => {
    it("should find payment by Midtrans order ID", async () => {
      const orderId = "ORDER-123456";
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const result = await PaymentRepository.findByOrderId(orderId);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { midtransOrderId: orderId },
      });
    });

    it("should return null if payment not found by order ID", async () => {
      const orderId = "NONEXISTENT-ORDER";
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await PaymentRepository.findByOrderId(orderId);

      expect(result).toBeNull();
    });
  });

  describe("markPaid", () => {
    it("should mark payment as paid with transaction ID", async () => {
      const paymentId = "payment123";
      const trxId = "TRX-789";
      (prisma.payment.update as jest.Mock).mockResolvedValue(mockPaidPayment);

      const result = await PaymentRepository.markPaid(paymentId, trxId);

      expect(result).toEqual(mockPaidPayment);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          midtransTransactionId: trxId,
          paidAt: expect.any(Date),
        },
      });
    });
  });

  describe("markFailed", () => {
    it("should mark payment as failed", async () => {
      const paymentId = "payment123";
      const failedPayment = { ...mockPayment, status: "FAILED" };
      (prisma.payment.update as jest.Mock).mockResolvedValue(failedPayment);

      const result = await PaymentRepository.markFailed(paymentId);

      expect(result).toEqual(failedPayment);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });
    });
  });

  describe("findByUser", () => {
    it("should find all payments for a user", async () => {
      const userId = "user123";
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        mockPayment,
        mockPaidPayment,
      ]);

      const result = await PaymentRepository.findByUser(userId);

      expect(result).toEqual([mockPayment, mockPaidPayment]);
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array if no payments found", async () => {
      const userId = "user-without-payments";
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await PaymentRepository.findByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should find payment by ID", async () => {
      const paymentId = "payment123";
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const result = await PaymentRepository.findById(paymentId);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
    });

    it("should return null if payment not found", async () => {
      const paymentId = "nonexistent";
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await PaymentRepository.findById(paymentId);

      expect(result).toBeNull();
    });
  });
});
