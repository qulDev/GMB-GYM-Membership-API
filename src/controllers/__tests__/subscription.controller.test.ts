import { Request, Response, NextFunction } from "express";
import { SubscriptionController } from "../subscription.controller";
import { SubscriptionService } from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => ({
  SubscriptionService: {
    createSubscription: jest.fn(),
    getCurrentSubscription: jest.fn(),
    getAllSubscriptions: jest.fn(),
    activateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

describe("SubscriptionController", () => {
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
    jest.spyOn(ResponseHelper, "message");
  });

  const mockSubscription = {
    id: "sub123",
    userId: "user123",
    membershipPlanId: "plan123",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-02-01"),
    status: "ACTIVE",
    membershipPlan: {
      id: "plan123",
      name: "Premium",
      price: 100000,
    },
  };

  describe("create", () => {
    it("should create subscription successfully", async () => {
      mockRequest.body = { membershipPlanId: "plan123" };
      (SubscriptionService.createSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      await SubscriptionController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionService.createSubscription).toHaveBeenCalledWith(
        "user123",
        "plan123"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockSubscription,
        201
      );
    });

    it("should call next with error if user not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.body = { membershipPlanId: "plan123" };

      await SubscriptionController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User is not authenticated" })
      );
    });

    it("should call next with error if membershipPlanId missing", async () => {
      mockRequest.body = {};

      await SubscriptionController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Membership plan ID is required" })
      );
    });

    it("should call next on service error", async () => {
      mockRequest.body = { membershipPlanId: "plan123" };
      const error = new Error("Plan not found");
      (SubscriptionService.createSubscription as jest.Mock).mockRejectedValue(
        error
      );

      await SubscriptionController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("current", () => {
    it("should get current subscription successfully", async () => {
      (
        SubscriptionService.getCurrentSubscription as jest.Mock
      ).mockResolvedValue(mockSubscription);

      await SubscriptionController.current(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionService.getCurrentSubscription).toHaveBeenCalledWith(
        "user123"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockSubscription,
        200
      );
    });

    it("should return null if no active subscription", async () => {
      (
        SubscriptionService.getCurrentSubscription as jest.Mock
      ).mockResolvedValue(null);

      await SubscriptionController.current(
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

    it("should call next with error if user not authenticated", async () => {
      mockRequest.user = undefined;

      await SubscriptionController.current(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User is not authenticated" })
      );
    });
  });

  describe("getAll", () => {
    it("should get all subscriptions successfully", async () => {
      const mockSubscriptions = [mockSubscription];
      (SubscriptionService.getAllSubscriptions as jest.Mock).mockResolvedValue(
        mockSubscriptions
      );

      await SubscriptionController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionService.getAllSubscriptions).toHaveBeenCalledWith({});
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockSubscriptions,
        200
      );
    });

    it("should get subscriptions with filters", async () => {
      mockRequest.query = { status: "ACTIVE", userId: "user123" };
      const mockSubscriptions = [mockSubscription];
      (SubscriptionService.getAllSubscriptions as jest.Mock).mockResolvedValue(
        mockSubscriptions
      );

      await SubscriptionController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionService.getAllSubscriptions).toHaveBeenCalledWith({
        status: "ACTIVE",
        userId: "user123",
      });
    });
  });

  describe("activate", () => {
    it("should activate subscription successfully", async () => {
      mockRequest.params = { id: "sub123" };
      const activatedSub = { ...mockSubscription, status: "ACTIVE" };
      (SubscriptionService.activateSubscription as jest.Mock).mockResolvedValue(
        activatedSub
      );

      await SubscriptionController.activate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionService.activateSubscription).toHaveBeenCalledWith(
        "sub123"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        activatedSub,
        200
      );
    });

    it("should call next on error", async () => {
      mockRequest.params = { id: "nonexistent" };
      const error = new Error("Subscription not found");
      (SubscriptionService.activateSubscription as jest.Mock).mockRejectedValue(
        error
      );

      await SubscriptionController.activate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("cancel", () => {
    it("should cancel subscription successfully", async () => {
      mockRequest.params = { id: "sub123" };
      (SubscriptionService.cancelSubscription as jest.Mock).mockResolvedValue(
        undefined
      );

      await SubscriptionController.cancel(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionService.cancelSubscription).toHaveBeenCalledWith(
        "sub123"
      );
      expect(ResponseHelper.message).toHaveBeenCalledWith(
        mockResponse,
        "Subscription canceled",
        200
      );
    });

    it("should call next on error", async () => {
      mockRequest.params = { id: "nonexistent" };
      const error = new Error("Subscription not found");
      (SubscriptionService.cancelSubscription as jest.Mock).mockRejectedValue(
        error
      );

      await SubscriptionController.cancel(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
