import { Request, Response, NextFunction } from "express";
import { GymClassController } from "../class.controller";
import { GymClassService } from "../../services/class.service";
import { ResponseHelper } from "../../utils";

jest.mock("../../services/class.service", () => ({
  GymClassService: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("GymClassController", () => {
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
        userId: "admin123",
        email: "admin@example.com",
        role: "ADMIN",
        type: "access" as const,
      },
    };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "message");
    jest.spyOn(ResponseHelper, "validationError");
    jest.spyOn(ResponseHelper, "notFound");
  });

  const mockClass = {
    id: "class123",
    name: "Morning Yoga",
    description: "Relaxing yoga session",
    type: "YOGA",
    trainerId: "trainer123",
    capacity: 20,
    schedule: {
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:00",
    },
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    trainer: {
      id: "trainer123",
      fullName: "John Doe",
    },
  };

  describe("getAll", () => {
    it("should get all classes successfully", async () => {
      const mockClasses = [mockClass];
      (GymClassService.getAll as jest.Mock).mockResolvedValue(mockClasses);

      await GymClassController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.getAll).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockClasses,
        200
      );
    });

    it("should filter classes by status", async () => {
      mockRequest.query = { status: "SCHEDULED" };
      const mockClasses = [mockClass];
      (GymClassService.getAll as jest.Mock).mockResolvedValue(mockClasses);

      await GymClassController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.getAll).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalled();
    });

    it("should filter classes by trainerId", async () => {
      mockRequest.query = { trainerId: "trainer123" };
      const mockClasses = [mockClass];
      (GymClassService.getAll as jest.Mock).mockResolvedValue(mockClasses);

      await GymClassController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ trainerId: "trainer123" })
      );
    });

    it("should return validation error for invalid query", async () => {
      mockRequest.query = { status: "INVALID_STATUS" };

      await GymClassController.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("detail", () => {
    it("should get class detail successfully", async () => {
      mockRequest.params = { id: "cm1234567890123456789012" }; // valid CUID
      (GymClassService.getById as jest.Mock).mockResolvedValue(mockClass);

      await GymClassController.detail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.getById).toHaveBeenCalledWith(
        "cm1234567890123456789012"
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockClass,
        200
      );
    });

    it("should return 404 when class not found", async () => {
      mockRequest.params = { id: "cm1234567890123456789012" };
      (GymClassService.getById as jest.Mock).mockRejectedValue(
        new Error("CLASS_NOT_FOUND")
      );

      await GymClassController.detail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Class not found"
      );
    });

    it("should return validation error for missing id", async () => {
      mockRequest.params = {};

      await GymClassController.detail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const createData = {
      name: "New Class",
      description: "New class description",
      type: "CARDIO",
      trainerId: "cm1234567890123456789012", // valid CUID
      capacity: 15,
      schedule: "2024-01-15T10:00:00.000Z", // valid ISO datetime
      duration: 60,
    };

    it("should create class successfully", async () => {
      mockRequest.body = createData;
      (GymClassService.create as jest.Mock).mockResolvedValue({
        ...mockClass,
        ...createData,
      });

      await GymClassController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.create).toHaveBeenCalledWith(createData);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ name: "New Class" }),
        201
      );
    });

    it("should return validation error for invalid data", async () => {
      mockRequest.body = { name: "Test" }; // missing required fields

      await GymClassController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });

    it("should return 400 on schedule conflict", async () => {
      mockRequest.body = createData;
      (GymClassService.create as jest.Mock).mockRejectedValue(
        new Error("Schedule conflict with existing class")
      );

      await GymClassController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        "Schedule conflict with existing class",
        400
      );
    });

    it("should call next on unexpected error", async () => {
      mockRequest.body = createData;
      const error = new Error("Unexpected error");
      (GymClassService.create as jest.Mock).mockRejectedValue(error);

      await GymClassController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("update", () => {
    const updateData = {
      name: "Updated Class",
      capacity: 25,
    };

    it("should update class successfully", async () => {
      mockRequest.params = { id: "cm1234567890123456789012" };
      mockRequest.body = updateData;
      const updatedClass = { ...mockClass, ...updateData };
      (GymClassService.update as jest.Mock).mockResolvedValue(updatedClass);

      await GymClassController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.update).toHaveBeenCalledWith(
        "cm1234567890123456789012",
        updateData
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        updatedClass,
        200
      );
    });

    it("should return 404 when class not found", async () => {
      mockRequest.params = { id: "cm1234567890123456789012" };
      mockRequest.body = updateData;
      (GymClassService.update as jest.Mock).mockRejectedValue(
        new Error("CLASS_NOT_FOUND")
      );

      await GymClassController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Class not found"
      );
    });
  });

  describe("delete", () => {
    it("should delete class successfully", async () => {
      mockRequest.params = { id: "cm1234567890123456789012" };
      (GymClassService.delete as jest.Mock).mockResolvedValue(undefined);

      await GymClassController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(GymClassService.delete).toHaveBeenCalledWith(
        "cm1234567890123456789012"
      );
      expect(ResponseHelper.message).toHaveBeenCalledWith(
        mockResponse,
        "Class deleted successfully",
        200
      );
    });

    it("should return 404 when class not found", async () => {
      mockRequest.params = { id: "cm1234567890123456789012" };
      (GymClassService.delete as jest.Mock).mockRejectedValue(
        new Error("CLASS_NOT_FOUND")
      );

      await GymClassController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Class not found"
      );
    });
  });
});
