import { Request, Response, NextFunction } from "express";
import { TrainerController } from "../trainer.controller";
import { TrainerService, TrainerServiceError } from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => {
  const actual = jest.requireActual("../../services");
  return {
    ...actual,
    TrainerService: {
      getAllTrainers: jest.fn(),
      getTrainerById: jest.fn(),
      createTrainer: jest.fn(),
      updateTrainer: jest.fn(),
      deleteTrainer: jest.fn(),
    },
  };
});

describe("TrainerController", () => {
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
    jest.spyOn(ResponseHelper, "conflict");
  });

  const mockTrainer = {
    id: "trainer123",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    specialization: ["Cardio", "Strength"],
    bio: "Professional trainer",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("getAllTrainers", () => {
    it("should get all trainers successfully", async () => {
      const mockTrainers = [mockTrainer];
      (TrainerService.getAllTrainers as jest.Mock).mockResolvedValue(
        mockTrainers
      );

      await TrainerController.getAllTrainers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.getAllTrainers).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockTrainers,
        200
      );
    });

    it("should filter trainers by specialization", async () => {
      mockRequest.query = { specialization: "Cardio" };
      const mockTrainers = [mockTrainer];
      (TrainerService.getAllTrainers as jest.Mock).mockResolvedValue(
        mockTrainers
      );

      await TrainerController.getAllTrainers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.getAllTrainers).toHaveBeenCalledWith(
        expect.objectContaining({ specialization: "Cardio" })
      );
    });

    it("should filter trainers by isActive", async () => {
      mockRequest.query = { isActive: "true" };
      const mockTrainers = [mockTrainer];
      (TrainerService.getAllTrainers as jest.Mock).mockResolvedValue(
        mockTrainers
      );

      await TrainerController.getAllTrainers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.getAllTrainers).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it("should return validation error for invalid query", async () => {
      mockRequest.query = { isActive: "invalid" };

      await TrainerController.getAllTrainers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("getTrainerById", () => {
    it("should get trainer by ID successfully", async () => {
      mockRequest.params = { trainerId: "trainer123" };
      (TrainerService.getTrainerById as jest.Mock).mockResolvedValue(
        mockTrainer
      );

      await TrainerController.getTrainerById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.getTrainerById).toHaveBeenCalledWith("trainer123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockTrainer,
        200
      );
    });

    it("should return 404 when trainer not found", async () => {
      mockRequest.params = { trainerId: "nonexistent" };
      (TrainerService.getTrainerById as jest.Mock).mockRejectedValue(
        new TrainerServiceError("Trainer not found", "NOT_FOUND")
      );

      await TrainerController.getTrainerById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Trainer not found"
      );
    });

    it("should return validation error for missing trainerId", async () => {
      mockRequest.params = {};

      await TrainerController.getTrainerById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("createTrainer", () => {
    const createData = {
      name: "New Trainer",
      email: "new@example.com",
      phone: "+9876543210",
      specialization: ["Yoga"],
      bio: "New trainer bio",
    };

    it("should create trainer successfully", async () => {
      mockRequest.body = createData;
      (TrainerService.createTrainer as jest.Mock).mockResolvedValue({
        ...mockTrainer,
        ...createData,
      });

      await TrainerController.createTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.createTrainer).toHaveBeenCalledWith(createData);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ name: "New Trainer" }),
        201
      );
    });

    it("should return validation error for invalid data", async () => {
      mockRequest.body = { name: "Test" }; // missing required fields

      await TrainerController.createTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });

    it("should return 409 on conflict error", async () => {
      mockRequest.body = createData;
      (TrainerService.createTrainer as jest.Mock).mockRejectedValue(
        new TrainerServiceError("Email already exists", "CONFLICT")
      );

      await TrainerController.createTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.conflict).toHaveBeenCalledWith(
        mockResponse,
        "Email already exists"
      );
    });
  });

  describe("updateTrainer", () => {
    const updateData = {
      name: "Updated Trainer",
      bio: "Updated bio",
    };

    it("should update trainer successfully", async () => {
      mockRequest.params = { trainerId: "trainer123" };
      mockRequest.body = updateData;
      const updatedTrainer = { ...mockTrainer, ...updateData };
      (TrainerService.updateTrainer as jest.Mock).mockResolvedValue(
        updatedTrainer
      );

      await TrainerController.updateTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.updateTrainer).toHaveBeenCalledWith(
        "trainer123",
        updateData
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        updatedTrainer,
        200
      );
    });

    it("should return 404 when trainer not found", async () => {
      mockRequest.params = { trainerId: "nonexistent" };
      mockRequest.body = updateData;
      (TrainerService.updateTrainer as jest.Mock).mockRejectedValue(
        new TrainerServiceError("Trainer not found", "NOT_FOUND")
      );

      await TrainerController.updateTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Trainer not found"
      );
    });

    it("should return 409 on email conflict", async () => {
      mockRequest.params = { trainerId: "trainer123" };
      mockRequest.body = { email: "existing@example.com" };
      (TrainerService.updateTrainer as jest.Mock).mockRejectedValue(
        new TrainerServiceError("Email already exists", "CONFLICT")
      );

      await TrainerController.updateTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.conflict).toHaveBeenCalledWith(
        mockResponse,
        "Email already exists"
      );
    });
  });

  describe("deleteTrainer", () => {
    it("should delete trainer successfully", async () => {
      mockRequest.params = { trainerId: "trainer123" };
      (TrainerService.deleteTrainer as jest.Mock).mockResolvedValue(undefined);

      await TrainerController.deleteTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(TrainerService.deleteTrainer).toHaveBeenCalledWith("trainer123");
      expect(ResponseHelper.message).toHaveBeenCalledWith(
        mockResponse,
        "Trainer deleted successfully",
        200
      );
    });

    it("should return 404 when trainer not found", async () => {
      mockRequest.params = { trainerId: "nonexistent" };
      (TrainerService.deleteTrainer as jest.Mock).mockRejectedValue(
        new TrainerServiceError("Trainer not found", "NOT_FOUND")
      );

      await TrainerController.deleteTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Trainer not found"
      );
    });

    it("should return 409 if trainer has classes", async () => {
      mockRequest.params = { trainerId: "trainer123" };
      (TrainerService.deleteTrainer as jest.Mock).mockRejectedValue(
        new TrainerServiceError(
          "Cannot delete trainer with existing classes",
          "CONFLICT"
        )
      );

      await TrainerController.deleteTrainer(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.conflict).toHaveBeenCalledWith(
        mockResponse,
        "Cannot delete trainer with existing classes"
      );
    });
  });
});
