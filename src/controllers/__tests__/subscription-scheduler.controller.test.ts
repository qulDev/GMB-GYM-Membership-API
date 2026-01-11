import { Request, Response, NextFunction } from "express";
import { SubscriptionSchedulerController } from "../subscription-scheduler.controller";
import { SubscriptionSchedulerService } from "../../services/subscription-scheduler.service";

jest.mock("../../services/subscription-scheduler.service");

describe("SubscriptionSchedulerController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("triggerExpireCheck", () => {
    it("should trigger expiration check and return success result", async () => {
      const expireResult = {
        expiredCount: 5,
        expiredSubscriptions: [
          {
            id: "sub1",
            userId: "user1",
            userEmail: "user1@test.com",
            userName: "User One",
            planName: "Premium",
            endDate: new Date("2024-01-31"),
          },
        ],
      };
      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockResolvedValue(expireResult);

      await SubscriptionSchedulerController.triggerExpireCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        SubscriptionSchedulerService.expireOverdueSubscriptions
      ).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        code: 200,
        data: {
          message: "Expired 5 subscriptions",
          ...expireResult,
        },
      });
    });

    it("should return result even when no subscriptions expired", async () => {
      const expireResult = {
        expiredCount: 0,
        expiredSubscriptions: [],
      };
      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockResolvedValue(expireResult);

      await SubscriptionSchedulerController.triggerExpireCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        code: 200,
        data: {
          message: "Expired 0 subscriptions",
          ...expireResult,
        },
      });
    });

    it("should call next with error on unexpected exception", async () => {
      const error = new Error("Unexpected error");
      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockRejectedValue(error);

      await SubscriptionSchedulerController.triggerExpireCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getExpiringSoon", () => {
    it("should return subscriptions expiring within default 7 days", async () => {
      const expiringResult = {
        count: 2,
        subscriptions: [
          {
            id: "sub1",
            userId: "user1",
            userEmail: "user1@test.com",
            userName: "User One",
            planName: "Premium",
            endDate: new Date("2024-02-05"),
            daysRemaining: 5,
          },
        ],
      };
      (
        SubscriptionSchedulerService.getExpiringSoon as jest.Mock
      ).mockResolvedValue(expiringResult);

      await SubscriptionSchedulerController.getExpiringSoon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionSchedulerService.getExpiringSoon).toHaveBeenCalledWith(
        7
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        code: 200,
        data: expiringResult,
      });
    });

    it("should accept custom days parameter from query string", async () => {
      mockRequest.query = { days: "30" };
      const expiringResult = {
        count: 0,
        subscriptions: [],
      };
      (
        SubscriptionSchedulerService.getExpiringSoon as jest.Mock
      ).mockResolvedValue(expiringResult);

      await SubscriptionSchedulerController.getExpiringSoon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SubscriptionSchedulerService.getExpiringSoon).toHaveBeenCalledWith(
        30
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        code: 200,
        data: expiringResult,
      });
    });

    it("should return error for invalid days parameter", async () => {
      mockRequest.query = { days: "invalid" };

      await SubscriptionSchedulerController.getExpiringSoon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
        })
      );
    });

    it("should return error for days parameter out of range (negative)", async () => {
      mockRequest.query = { days: "-5" };

      await SubscriptionSchedulerController.getExpiringSoon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return error for days parameter over 90", async () => {
      mockRequest.query = { days: "100" };

      await SubscriptionSchedulerController.getExpiringSoon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should call next with error on service exception", async () => {
      const error = new Error("Service error");
      (
        SubscriptionSchedulerService.getExpiringSoon as jest.Mock
      ).mockRejectedValue(error);

      await SubscriptionSchedulerController.getExpiringSoon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
