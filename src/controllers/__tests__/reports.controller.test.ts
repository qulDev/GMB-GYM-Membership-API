import { Request, Response, NextFunction } from "express";
import { ReportsController } from "../reports.controller";
import { ReportsService, ReportsServiceError } from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => {
  const actual = jest.requireActual("../../services");
  return {
    ...actual,
    ReportsService: {
      getDashboardStats: jest.fn(),
      getRevenueReport: jest.fn(),
      getAttendanceReport: jest.fn(),
    },
  };
});

describe("ReportsController", () => {
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
      user: { userId: "admin123", email: "admin@example.com", role: "ADMIN", type: "access" as const },
    };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "validationError");
    jest.spyOn(ResponseHelper, "internalError");
  });

  describe("getDashboard", () => {
    const mockDashboardStats = {
      totalMembers: 100,
      activeMembers: 80,
      totalRevenue: 10000000,
      monthlyRevenue: 2000000,
      todayCheckIns: 25,
      popularClasses: [
        { id: "class1", name: "Yoga", bookingsCount: 50 },
        { id: "class2", name: "Cardio", bookingsCount: 45 },
      ],
    };

    it("should get dashboard statistics successfully", async () => {
      (ReportsService.getDashboardStats as jest.Mock).mockResolvedValue(
        mockDashboardStats
      );

      await ReportsController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ReportsService.getDashboardStats).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockDashboardStats,
        200
      );
    });

    it("should return 500 on internal error", async () => {
      (ReportsService.getDashboardStats as jest.Mock).mockRejectedValue(
        new ReportsServiceError("Failed to fetch dashboard stats", "INTERNAL")
      );

      await ReportsController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch dashboard stats"
      );
    });

    it("should call next on unexpected error", async () => {
      const error = new Error("Unexpected error");
      (ReportsService.getDashboardStats as jest.Mock).mockRejectedValue(error);

      await ReportsController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getRevenue", () => {
    const mockRevenueReport = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      totalRevenue: 5000000,
      daily: [
        { date: "2024-01-15", revenue: 500000, transactionCount: 5 },
        { date: "2024-01-16", revenue: 600000, transactionCount: 6 },
      ],
    };

    it("should get revenue report successfully", async () => {
      mockRequest.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      (ReportsService.getRevenueReport as jest.Mock).mockResolvedValue(
        mockRevenueReport
      );

      await ReportsController.getRevenue(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ReportsService.getRevenueReport).toHaveBeenCalledWith({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockRevenueReport,
        200
      );
    });

    it("should return validation error for missing dates", async () => {
      mockRequest.query = {}; // missing required dates

      await ReportsController.getRevenue(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });

    it("should return 400 on bad request", async () => {
      mockRequest.query = { startDate: "2024-01-31", endDate: "2024-01-01" }; // invalid range
      (ReportsService.getRevenueReport as jest.Mock).mockRejectedValue(
        new ReportsServiceError("Start date must be before end date", "BAD_REQUEST")
      );

      await ReportsController.getRevenue(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        "Start date must be before end date",
        400
      );
    });

    it("should return 500 on internal error", async () => {
      mockRequest.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      (ReportsService.getRevenueReport as jest.Mock).mockRejectedValue(
        new ReportsServiceError("Failed to fetch revenue report", "INTERNAL")
      );

      await ReportsController.getRevenue(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch revenue report"
      );
    });
  });

  describe("getAttendance", () => {
    const mockAttendanceReport = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      totalCheckIns: 500,
      averageCheckInsPerDay: 16,
      attendance: [
        { date: "2024-01-15", checkIns: 20, uniqueMembers: 18 },
        { date: "2024-01-16", checkIns: 22, uniqueMembers: 20 },
      ],
    };

    it("should get attendance report successfully with date range", async () => {
      mockRequest.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      (ReportsService.getAttendanceReport as jest.Mock).mockResolvedValue(
        mockAttendanceReport
      );

      await ReportsController.getAttendance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ReportsService.getAttendanceReport).toHaveBeenCalledWith({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockAttendanceReport,
        200
      );
    });

    it("should get attendance report with default dates if not provided", async () => {
      mockRequest.query = {}; // optional dates
      (ReportsService.getAttendanceReport as jest.Mock).mockResolvedValue(
        mockAttendanceReport
      );

      await ReportsController.getAttendance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ReportsService.getAttendanceReport).toHaveBeenCalledWith({});
      expect(ResponseHelper.success).toHaveBeenCalled();
    });

    it("should return 400 on bad request", async () => {
      mockRequest.query = { startDate: "2024-01-31", endDate: "2024-01-01" };
      (ReportsService.getAttendanceReport as jest.Mock).mockRejectedValue(
        new ReportsServiceError("Start date must be before end date", "BAD_REQUEST")
      );

      await ReportsController.getAttendance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        "Start date must be before end date",
        400
      );
    });

    it("should return 500 on internal error", async () => {
      mockRequest.query = {};
      (ReportsService.getAttendanceReport as jest.Mock).mockRejectedValue(
        new ReportsServiceError("Failed to fetch attendance report", "INTERNAL")
      );

      await ReportsController.getAttendance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Failed to fetch attendance report"
      );
    });
  });
});
