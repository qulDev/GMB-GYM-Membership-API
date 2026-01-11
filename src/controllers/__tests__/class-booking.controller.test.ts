import { Request, Response, NextFunction } from "express";
import { ClassBookingController } from "../class-booking.controller";
import { ClassBookingService } from "../../services/class-booking.service";
import { ResponseHelper } from "../../utils";
import { BookingStatus } from "../../generated/prisma";

// Mock dependencies
jest.mock("../../services/class-booking.service", () => {
  // Create error class inside module factory
  class MockClassBookingServiceError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = "ClassBookingServiceError";
    }
  }
  return {
    ClassBookingService: {
      bookClass: jest.fn(),
      cancelBooking: jest.fn(),
      getUserBookings: jest.fn(),
      getClassParticipants: jest.fn(),
    },
    ClassBookingServiceError: MockClassBookingServiceError,
  };
});

// Re-import after mock
const { ClassBookingServiceError } = jest.requireMock(
  "../../services/class-booking.service"
);

jest.mock("../../utils", () => ({
  ResponseHelper: {
    success: jest.fn(),
    error: jest.fn(),
    unauthorized: jest.fn(),
    notFound: jest.fn(),
    forbidden: jest.fn(),
  },
}));

describe("ClassBookingController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: {
        userId: "user1",
        email: "test@test.com",
        role: "USER" as any,
        type: "access",
      },
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  const mockBooking = {
    id: "booking1",
    userId: "user1",
    classId: "class1",
    status: BookingStatus.CONFIRMED,
    bookedAt: new Date(),
    gymClass: {
      id: "class1",
      name: "Yoga Class",
      trainer: { id: "trainer1", name: "John" },
    },
  };

  describe("book", () => {
    it("should book a class successfully", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.bookClass as jest.Mock).mockResolvedValue(
        mockBooking
      );

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ClassBookingService.bookClass).toHaveBeenCalledWith(
        "user1",
        "class1"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockRes,
        mockBooking,
        201
      );
    });

    it("should return 401 if user not authenticated", async () => {
      mockReq.user = undefined;

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockRes,
        "Authentication required"
      );
    });

    it("should return 400 if classId not provided", async () => {
      mockReq.params = {};

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        "VALIDATION_ERROR",
        "Class ID is required",
        400
      );
    });

    it("should return 404 if class not found", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.bookClass as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError("Class not found", "NOT_FOUND")
      );

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockRes,
        "Class not found"
      );
    });

    it("should return 403 if user has no subscription", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.bookClass as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError(
          "You need an active subscription",
          "FORBIDDEN"
        )
      );

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.forbidden).toHaveBeenCalledWith(
        mockRes,
        "You need an active subscription"
      );
    });

    it("should return 409 if already booked", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.bookClass as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError(
          "You have already booked this class",
          "CONFLICT"
        )
      );

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        "CONFLICT",
        "You have already booked this class",
        409
      );
    });

    it("should return 400 for bad request errors", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.bookClass as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError("Class has already started", "BAD_REQUEST")
      );

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        "BAD_REQUEST",
        "Class has already started",
        400
      );
    });

    it("should call next for unknown errors", async () => {
      mockReq.params = { classId: "class1" };
      const error = new Error("Unknown error");
      (ClassBookingService.bookClass as jest.Mock).mockRejectedValue(error);

      await ClassBookingController.book(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("cancel", () => {
    it("should cancel a booking successfully", async () => {
      mockReq.params = { classId: "class1" };
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      (ClassBookingService.cancelBooking as jest.Mock).mockResolvedValue(
        cancelledBooking
      );

      await ClassBookingController.cancel(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ClassBookingService.cancelBooking).toHaveBeenCalledWith(
        "user1",
        "class1"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockRes,
        cancelledBooking,
        200
      );
    });

    it("should return 401 if user not authenticated", async () => {
      mockReq.user = undefined;

      await ClassBookingController.cancel(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockRes,
        "Authentication required"
      );
    });

    it("should return 400 if classId not provided", async () => {
      mockReq.params = {};

      await ClassBookingController.cancel(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        "VALIDATION_ERROR",
        "Class ID is required",
        400
      );
    });

    it("should return 404 if booking not found", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.cancelBooking as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError("Booking not found", "NOT_FOUND")
      );

      await ClassBookingController.cancel(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockRes,
        "Booking not found"
      );
    });

    it("should return 400 if already cancelled", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.cancelBooking as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError("Already cancelled", "BAD_REQUEST")
      );

      await ClassBookingController.cancel(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        "BAD_REQUEST",
        "Already cancelled",
        400
      );
    });
  });

  describe("myBookings", () => {
    it("should get user bookings", async () => {
      (ClassBookingService.getUserBookings as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      await ClassBookingController.myBookings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ClassBookingService.getUserBookings).toHaveBeenCalledWith(
        "user1",
        undefined
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockRes,
        [mockBooking],
        200
      );
    });

    it("should filter by status", async () => {
      mockReq.query = { status: "confirmed" };
      (ClassBookingService.getUserBookings as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      await ClassBookingController.myBookings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ClassBookingService.getUserBookings).toHaveBeenCalledWith(
        "user1",
        "confirmed"
      );
    });

    it("should return 401 if not authenticated", async () => {
      mockReq.user = undefined;

      await ClassBookingController.myBookings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockRes,
        "Authentication required"
      );
    });
  });

  describe("participants", () => {
    it("should get class participants", async () => {
      mockReq.params = { classId: "class1" };
      const participants = [
        { ...mockBooking, user: { id: "user1", fullName: "Test" } },
      ];
      (ClassBookingService.getClassParticipants as jest.Mock).mockResolvedValue(
        participants
      );

      await ClassBookingController.participants(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ClassBookingService.getClassParticipants).toHaveBeenCalledWith(
        "class1"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockRes,
        participants,
        200
      );
    });

    it("should return 400 if classId not provided", async () => {
      mockReq.params = {};

      await ClassBookingController.participants(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockRes,
        "VALIDATION_ERROR",
        "Class ID is required",
        400
      );
    });

    it("should return 404 if class not found", async () => {
      mockReq.params = { classId: "class1" };
      (ClassBookingService.getClassParticipants as jest.Mock).mockRejectedValue(
        new ClassBookingServiceError("Class not found", "NOT_FOUND")
      );

      await ClassBookingController.participants(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockRes,
        "Class not found"
      );
    });
  });
});
