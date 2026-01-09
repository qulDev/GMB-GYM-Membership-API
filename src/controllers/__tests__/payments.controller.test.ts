import { Request, Response, NextFunction } from "express";
import { PaymentController } from "../payments.controller";
import { PaymentService } from "../../services/payments.service";
import { ResponseHelper } from "../../utils/response.helper";
import crypto from "crypto";

jest.mock("../../services/payments.service", () => ({
  PaymentService: {
    createSnapPayment: jest.fn(),
    handleNotification: jest.fn(),
    getHistory: jest.fn(),
    getDetail: jest.fn(),
  },
}));

describe("PaymentController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: "user123",
        email: "test@example.com",
        role: "USER",
        type: "access" as const,
      },
    };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
  });

  const mockPayment = {
    id: "payment123",
    orderId: "ORDER-123",
    userId: "user123",
    subscriptionId: "sub123",
    amount: 100000,
    status: "PENDING",
    createdAt: new Date(),
  };

  describe("processPayment", () => {
    it("should create snap payment successfully", async () => {
      mockRequest.params = { subscriptionId: "sub123" };
      const mockResult = {
        snapToken: "snap-token-123",
        redirectUrl: "https://midtrans.com/pay/123",
      };
      (PaymentService.createSnapPayment as jest.Mock).mockResolvedValue(
        mockResult
      );

      await PaymentController.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(PaymentService.createSnapPayment).toHaveBeenCalledWith(
        "user123",
        "sub123"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        201
      );
    });

    it("should call next on error", async () => {
      mockRequest.params = { subscriptionId: "sub123" };
      const error = new Error("Subscription not found");
      (PaymentService.createSnapPayment as jest.Mock).mockRejectedValue(error);

      await PaymentController.processPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("midtransNotification", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, MIDTRANS_SERVER_KEY: "test-server-key" };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should handle valid midtrans notification", async () => {
      const notification = {
        order_id: "ORDER-123",
        status_code: "200",
        gross_amount: "100000.00",
        transaction_status: "settlement",
        signature_key: "",
      };

      // Generate valid signature
      const raw =
        notification.order_id +
        notification.status_code +
        notification.gross_amount +
        process.env.MIDTRANS_SERVER_KEY;
      notification.signature_key = crypto
        .createHash("sha512")
        .update(raw)
        .digest("hex");

      mockRequest.body = Buffer.from(JSON.stringify(notification));
      (PaymentService.handleNotification as jest.Mock).mockResolvedValue(
        undefined
      );

      await PaymentController.midtransNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(PaymentService.handleNotification).toHaveBeenCalledWith(
        notification
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(mockResponse, 200);
    });

    it("should reject notification with invalid signature", async () => {
      const notification = {
        order_id: "ORDER-123",
        status_code: "200",
        gross_amount: "100000.00",
        transaction_status: "settlement",
        signature_key: "invalid-signature",
      };

      mockRequest.body = Buffer.from(JSON.stringify(notification));

      await PaymentController.midtransNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: "INVALID SIGNATURE" });
      expect(PaymentService.handleNotification).not.toHaveBeenCalled();
    });
  });

  describe("history", () => {
    it("should get payment history successfully", async () => {
      const mockHistory = [mockPayment];
      (PaymentService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      await PaymentController.history(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(PaymentService.getHistory).toHaveBeenCalledWith("user123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockHistory,
        200
      );
    });

    it("should return empty array if no payments", async () => {
      (PaymentService.getHistory as jest.Mock).mockResolvedValue([]);

      await PaymentController.history(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        [],
        200
      );
    });

    it("should call next on error", async () => {
      const error = new Error("Database error");
      (PaymentService.getHistory as jest.Mock).mockRejectedValue(error);

      await PaymentController.history(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("detail", () => {
    it("should get payment detail successfully", async () => {
      mockRequest.params = { id: "payment123" };
      (PaymentService.getDetail as jest.Mock).mockResolvedValue(mockPayment);

      await PaymentController.detail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(PaymentService.getDetail).toHaveBeenCalledWith("payment123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockPayment,
        200
      );
    });

    it("should return null if payment not found", async () => {
      mockRequest.params = { id: "nonexistent" };
      (PaymentService.getDetail as jest.Mock).mockResolvedValue(null);

      await PaymentController.detail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        200
      );
    });

    it("should call next on error", async () => {
      mockRequest.params = { id: "payment123" };
      const error = new Error("Database error");
      (PaymentService.getDetail as jest.Mock).mockRejectedValue(error);

      await PaymentController.detail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
