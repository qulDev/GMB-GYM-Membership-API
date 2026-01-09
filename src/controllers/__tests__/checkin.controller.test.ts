import { Request, Response, NextFunction } from "express";
import { CheckInController } from "../checkin.controller";
import { CheckInService } from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => ({
  CheckInService: {
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    getHistory: jest.fn(),
    getCurrentStatus: jest.fn(),
  },
}));

describe("CheckInController", () => {
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
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "unauthorized");
    jest.spyOn(ResponseHelper, "forbidden");
    jest.spyOn(ResponseHelper, "notFound");
  });

  const mockCheckIn = {
    id: "checkin123",
    userId: "user123",
    checkInTime: new Date("2024-01-15T10:00:00Z"),
    checkOutTime: null,
    duration: null,
  };

  describe("checkIn", () => {
    it("should check in user successfully", async () => {
      (CheckInService.checkIn as jest.Mock).mockResolvedValue(mockCheckIn);

      await CheckInController.checkIn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(CheckInService.checkIn).toHaveBeenCalledWith("user123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockCheckIn,
        201
      );
    });

    it("should return 401 if user not authenticated", async () => {
      mockRequest.user = undefined;

      await CheckInController.checkIn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "User is not authenticated"
      );
    });

    it("should return 403 if membership expired", async () => {
      const error = new Error(
        "Your membership has expired. Please renew your subscription."
      );
      (error as any).statusCode = 403;
      (CheckInService.checkIn as jest.Mock).mockRejectedValue(error);

      await CheckInController.checkIn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.forbidden).toHaveBeenCalledWith(
        mockResponse,
        "Your membership has expired. Please renew your subscription."
      );
    });

    it("should call next on unexpected error", async () => {
      const error = new Error("Unexpected error");
      (CheckInService.checkIn as jest.Mock).mockRejectedValue(error);

      await CheckInController.checkIn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("checkOut", () => {
    it("should check out user successfully", async () => {
      mockRequest.params = { checkInId: "checkin123" };
      const checkedOutRecord = {
        ...mockCheckIn,
        checkOutTime: new Date("2024-01-15T12:00:00Z"),
        duration: 7200,
      };
      (CheckInService.checkOut as jest.Mock).mockResolvedValue(
        checkedOutRecord
      );

      await CheckInController.checkOut(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(CheckInService.checkOut).toHaveBeenCalledWith(
        "checkin123",
        "user123"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        checkedOutRecord,
        200
      );
    });

    it("should return 401 if user not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.params = { checkInId: "checkin123" };

      await CheckInController.checkOut(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "User is not authenticated"
      );
    });

    it("should return 400 if checkInId is missing", async () => {
      mockRequest.params = {};

      await CheckInController.checkOut(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "VALIDATION_ERROR",
        "Check-in ID is required",
        400
      );
    });

    it("should return 404 if check-in not found", async () => {
      mockRequest.params = { checkInId: "nonexistent" };
      const error = new Error("Check-in record not found");
      (error as any).statusCode = 404;
      (CheckInService.checkOut as jest.Mock).mockRejectedValue(error);

      await CheckInController.checkOut(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Check-in record not found"
      );
    });

    it("should return 400 if already checked out", async () => {
      mockRequest.params = { checkInId: "checkin123" };
      const error = new Error("You have already checked out");
      (error as any).statusCode = 400;
      (CheckInService.checkOut as jest.Mock).mockRejectedValue(error);

      await CheckInController.checkOut(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        "You have already checked out",
        400
      );
    });
  });

  describe("getHistory", () => {
    it("should get check-in history successfully", async () => {
      const mockHistory = [mockCheckIn];
      (CheckInService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      await CheckInController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(CheckInService.getHistory).toHaveBeenCalledWith(
        "user123",
        undefined,
        undefined
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockHistory,
        200
      );
    });

    it("should get check-in history with date filters", async () => {
      mockRequest.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      const mockHistory = [mockCheckIn];
      (CheckInService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      await CheckInController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(CheckInService.getHistory).toHaveBeenCalledWith(
        "user123",
        "2024-01-01",
        "2024-01-31"
      );
      expect(ResponseHelper.success).toHaveBeenCalled();
    });

    it("should return 401 if user not authenticated", async () => {
      mockRequest.user = undefined;

      await CheckInController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "User is not authenticated"
      );
    });
  });

  describe("getCurrentStatus", () => {
    it("should get current status when checked in", async () => {
      const mockStatus = {
        isCheckedIn: true,
        currentCheckIn: mockCheckIn,
      };
      (CheckInService.getCurrentStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );

      await CheckInController.getCurrentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(CheckInService.getCurrentStatus).toHaveBeenCalledWith("user123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockStatus,
        200
      );
    });

    it("should get current status when not checked in", async () => {
      const mockStatus = {
        isCheckedIn: false,
        currentCheckIn: null,
      };
      (CheckInService.getCurrentStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );

      await CheckInController.getCurrentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockStatus,
        200
      );
    });

    it("should return 401 if user not authenticated", async () => {
      mockRequest.user = undefined;

      await CheckInController.getCurrentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "User is not authenticated"
      );
    });
  });
});
