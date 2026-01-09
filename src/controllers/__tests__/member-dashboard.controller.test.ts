import { Request, Response, NextFunction } from "express";
import { MemberDashboardController } from "../member-dashboard.controller";
import {
  MemberDashboardService,
  MemberDashboardServiceError,
} from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => {
  const actual = jest.requireActual("../../services");
  return {
    ...actual,
    MemberDashboardService: {
      getDashboardStats: jest.fn(),
    },
  };
});

describe("MemberDashboardController", () => {
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
        email: "user@example.com",
        role: "USER",
        type: "access" as const,
      },
    };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "notFound");
    jest.spyOn(ResponseHelper, "unauthorized");
    jest.spyOn(ResponseHelper, "internalError");
  });

  describe("getDashboard", () => {
    const mockDashboardStats = {
      subscription: {
        id: "sub123",
        planName: "Gold Plan",
        status: "ACTIVE",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-02-01T00:00:00.000Z",
        daysRemaining: 15,
        features: ["Gym Access", "Pool Access"],
        maxCheckInsPerDay: 2,
      },
      checkInStats: {
        totalCheckIns: 50,
        thisMonthCheckIns: 10,
        todayCheckIns: 1,
        remainingCheckInsToday: 1,
        averageDurationMinutes: 60,
      },
      recommendedClasses: [
        {
          id: "class1",
          name: "Morning Yoga",
          description: "Relaxing yoga session",
          type: "yoga",
          schedule: "2024-01-20T08:00:00.000Z",
          duration: 60,
          capacity: 20,
          bookedCount: 15,
          availableSlots: 5,
          trainer: {
            id: "trainer1",
            name: "John Doe",
            specialization: ["yoga"],
          },
          isBookable: true,
        },
      ],
      upcomingBookedClasses: [
        {
          id: "class2",
          bookingId: "booking1",
          name: "Boxing Basics",
          type: "boxing",
          schedule: "2024-01-22T10:00:00.000Z",
          duration: 45,
          status: "SCHEDULED",
          trainer: {
            id: "trainer2",
            name: "Mike",
          },
        },
      ],
      recentActivity: [
        {
          id: "checkin1",
          checkInTime: "2024-01-15T09:00:00.000Z",
          checkOutTime: "2024-01-15T10:30:00.000Z",
          duration: 90,
        },
      ],
    };

    it("should get member dashboard successfully", async () => {
      (MemberDashboardService.getDashboardStats as jest.Mock).mockResolvedValue(
        mockDashboardStats
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MemberDashboardService.getDashboardStats).toHaveBeenCalledWith(
        "user123"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockDashboardStats,
        200
      );
    });

    it("should return 401 when user is not authenticated", async () => {
      mockRequest.user = undefined;

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "User not authenticated"
      );
      expect(MemberDashboardService.getDashboardStats).not.toHaveBeenCalled();
    });

    it("should return 401 when userId is missing from user object", async () => {
      mockRequest.user = {
        email: "user@example.com",
        role: "USER",
        type: "access" as const,
      } as any;

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "User not authenticated"
      );
    });

    it("should return 404 on NOT_FOUND error", async () => {
      (MemberDashboardService.getDashboardStats as jest.Mock).mockRejectedValue(
        new MemberDashboardServiceError("User not found", "NOT_FOUND")
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "User not found"
      );
    });

    it("should return 403 on FORBIDDEN error", async () => {
      (MemberDashboardService.getDashboardStats as jest.Mock).mockRejectedValue(
        new MemberDashboardServiceError("Access denied", "FORBIDDEN")
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "FORBIDDEN",
        "Access denied",
        403
      );
    });

    it("should return 500 on INTERNAL error", async () => {
      (MemberDashboardService.getDashboardStats as jest.Mock).mockRejectedValue(
        new MemberDashboardServiceError("Database error", "INTERNAL")
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Database error"
      );
    });

    it("should call next on unexpected error", async () => {
      const unexpectedError = new Error("Unexpected error");
      (MemberDashboardService.getDashboardStats as jest.Mock).mockRejectedValue(
        unexpectedError
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });

    it("should handle dashboard with null subscription", async () => {
      const dashboardWithNullSub = {
        ...mockDashboardStats,
        subscription: null,
      };

      (MemberDashboardService.getDashboardStats as jest.Mock).mockResolvedValue(
        dashboardWithNullSub
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        dashboardWithNullSub,
        200
      );
    });

    it("should handle dashboard with empty arrays", async () => {
      const emptyDashboard = {
        subscription: null,
        checkInStats: {
          totalCheckIns: 0,
          thisMonthCheckIns: 0,
          todayCheckIns: 0,
          remainingCheckInsToday: 0,
          averageDurationMinutes: 0,
        },
        recommendedClasses: [],
        upcomingBookedClasses: [],
        recentActivity: [],
      };

      (MemberDashboardService.getDashboardStats as jest.Mock).mockResolvedValue(
        emptyDashboard
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        emptyDashboard,
        200
      );
    });

    it("should work with admin user accessing their dashboard", async () => {
      mockRequest.user = {
        userId: "admin123",
        email: "admin@example.com",
        role: "ADMIN",
        type: "access" as const,
      };

      (MemberDashboardService.getDashboardStats as jest.Mock).mockResolvedValue(
        mockDashboardStats
      );

      await MemberDashboardController.getDashboard(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MemberDashboardService.getDashboardStats).toHaveBeenCalledWith(
        "admin123"
      );
      expect(ResponseHelper.success).toHaveBeenCalled();
    });
  });
});
