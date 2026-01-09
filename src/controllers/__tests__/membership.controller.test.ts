import { Request, Response, NextFunction } from "express";
import { MembershipPlanController } from "../membership.controller";
import {
  MembershipPlanService,
  MembershipPlanServiceError,
} from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => {
  const actual = jest.requireActual("../../services");
  return {
    ...actual,
    MembershipPlanService: {
      getAllPlans: jest.fn(),
      getPlanById: jest.fn(),
      createPlan: jest.fn(),
      updatePlan: jest.fn(),
      deletePlan: jest.fn(),
    },
  };
});

describe("MembershipPlanController", () => {
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
    jest.spyOn(ResponseHelper, "validationError");
    jest.spyOn(ResponseHelper, "notFound");
    jest.spyOn(ResponseHelper, "internalError");
  });

  const mockPlan = {
    id: "plan123",
    name: "Premium",
    description: "Premium membership plan",
    price: 100000,
    durationInDays: 30,
    maxCheckInsPerDay: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("getAllPlans", () => {
    it("should get all plans successfully", async () => {
      const mockPlans = [mockPlan];
      (MembershipPlanService.getAllPlans as jest.Mock).mockResolvedValue(
        mockPlans
      );

      await MembershipPlanController.getAllPlans(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MembershipPlanService.getAllPlans).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockPlans,
        200
      );
    });

    it("should filter plans by isActive", async () => {
      mockRequest.query = { active: "true" };
      const mockPlans = [mockPlan];
      (MembershipPlanService.getAllPlans as jest.Mock).mockResolvedValue(
        mockPlans
      );

      await MembershipPlanController.getAllPlans(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MembershipPlanService.getAllPlans).toHaveBeenCalled();
    });

    it("should call next on service error", async () => {
      const error = new Error("Database error");
      (MembershipPlanService.getAllPlans as jest.Mock).mockRejectedValue(error);

      await MembershipPlanController.getAllPlans(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPlanById", () => {
    it("should get plan by ID successfully", async () => {
      mockRequest.params = { id: "plan123" };
      (MembershipPlanService.getPlanById as jest.Mock).mockResolvedValue(
        mockPlan
      );

      await MembershipPlanController.getPlanById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MembershipPlanService.getPlanById).toHaveBeenCalledWith("plan123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockPlan,
        200
      );
    });

    it("should return 404 when plan not found", async () => {
      mockRequest.params = { id: "nonexistent" };
      (MembershipPlanService.getPlanById as jest.Mock).mockRejectedValue(
        new MembershipPlanServiceError("Plan not found", "NOT_FOUND")
      );

      await MembershipPlanController.getPlanById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Plan not found"
      );
    });

    it("should return validation error for missing id", async () => {
      mockRequest.params = {};

      await MembershipPlanController.getPlanById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("createPlan", () => {
    const createData = {
      name: "New Plan",
      description: "New membership plan",
      price: 150000,
      duration: 30,
      features: ["Feature 1"],
      maxCheckInsPerDay: 3,
    };

    it("should create plan successfully", async () => {
      mockRequest.body = createData;
      (MembershipPlanService.createPlan as jest.Mock).mockResolvedValue({
        ...mockPlan,
        ...createData,
      });

      await MembershipPlanController.createPlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Schema adds isActive: true by default
      expect(MembershipPlanService.createPlan).toHaveBeenCalledWith({
        ...createData,
        isActive: true,
      });
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ name: "New Plan" }),
        201
      );
    });

    it("should return validation error for invalid data", async () => {
      mockRequest.body = { name: "Test" }; // missing required fields

      await MembershipPlanController.createPlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });

    it("should return 400 on bad request error", async () => {
      mockRequest.body = createData;
      (MembershipPlanService.createPlan as jest.Mock).mockRejectedValue(
        new MembershipPlanServiceError(
          "Plan name already exists",
          "BAD_REQUEST"
        )
      );

      await MembershipPlanController.createPlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        "Plan name already exists",
        400
      );
    });
  });

  describe("updatePlan", () => {
    const updateData = {
      name: "Updated Plan",
      price: 200000,
    };

    it("should update plan successfully", async () => {
      mockRequest.params = { id: "plan123" };
      mockRequest.body = updateData;
      const updatedPlan = { ...mockPlan, ...updateData };
      (MembershipPlanService.updatePlan as jest.Mock).mockResolvedValue(
        updatedPlan
      );

      await MembershipPlanController.updatePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MembershipPlanService.updatePlan).toHaveBeenCalledWith(
        "plan123",
        updateData
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        updatedPlan,
        200
      );
    });

    it("should return 404 when plan not found", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.body = updateData;
      (MembershipPlanService.updatePlan as jest.Mock).mockRejectedValue(
        new MembershipPlanServiceError("Plan not found", "NOT_FOUND")
      );

      await MembershipPlanController.updatePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Plan not found"
      );
    });
  });

  describe("deletePlan", () => {
    it("should delete plan successfully", async () => {
      mockRequest.params = { id: "plan123" };
      (MembershipPlanService.deletePlan as jest.Mock).mockResolvedValue(
        mockPlan
      );

      await MembershipPlanController.deletePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(MembershipPlanService.deletePlan).toHaveBeenCalledWith("plan123");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should return 404 when plan not found", async () => {
      mockRequest.params = { id: "nonexistent" };
      (MembershipPlanService.deletePlan as jest.Mock).mockRejectedValue(
        new MembershipPlanServiceError("Plan not found", "NOT_FOUND")
      );

      await MembershipPlanController.deletePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Plan not found"
      );
    });
  });
});
