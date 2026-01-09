import {
  MembershipPlanService,
  MembershipPlanServiceError,
} from "../membership.service";
import { MembershipPlanRepository } from "../../models";
import { Prisma } from "../../generated/prisma";

jest.mock("../../models", () => ({
  MembershipPlanRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("MembershipPlanService", () => {
  const mockMembershipPlan = {
    id: "plan123",
    name: "Premium Monthly",
    description: "Premium monthly membership",
    price: new Prisma.Decimal(500000),
    duration: 30,
    features: ["Unlimited gym access", "Personal trainer", "Locker"],
    maxCheckInsPerDay: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllPlans", () => {
    it("should get all plans without filters", async () => {
      (MembershipPlanRepository.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanService.getAllPlans({});

      expect(result).toEqual([mockMembershipPlan]);
      expect(MembershipPlanRepository.findMany).toHaveBeenCalledWith({});
    });

    it("should filter plans by active status", async () => {
      (MembershipPlanRepository.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanService.getAllPlans({ active: true });

      expect(result).toEqual([mockMembershipPlan]);
      expect(MembershipPlanRepository.findMany).toHaveBeenCalledWith({
        isActive: true,
      });
    });

    it("should filter plans by duration", async () => {
      (MembershipPlanRepository.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanService.getAllPlans({ duration: 30 });

      expect(result).toEqual([mockMembershipPlan]);
      expect(MembershipPlanRepository.findMany).toHaveBeenCalledWith({
        duration: 30,
      });
    });

    it("should search plans by name", async () => {
      (MembershipPlanRepository.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanService.getAllPlans({
        search: "Premium",
      });

      expect(result).toEqual([mockMembershipPlan]);
      expect(MembershipPlanRepository.findMany).toHaveBeenCalledWith({
        name: {
          contains: "Premium",
          mode: "insensitive",
        },
      });
    });
  });

  describe("getPlanById", () => {
    it("should get plan by ID successfully", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      const result = await MembershipPlanService.getPlanById("plan123");

      expect(result).toEqual(mockMembershipPlan);
      expect(MembershipPlanRepository.findById).toHaveBeenCalledWith("plan123");
    });

    it("should throw NOT_FOUND error if plan not found", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        MembershipPlanService.getPlanById("nonexistent")
      ).rejects.toThrow(MembershipPlanServiceError);
      await expect(
        MembershipPlanService.getPlanById("nonexistent")
      ).rejects.toMatchObject({
        message: "Membership plan not found",
        code: "NOT_FOUND",
      });
    });
  });

  describe("createPlan", () => {
    const createInput = {
      name: "Premium Monthly",
      description: "Premium monthly membership",
      price: 500000,
      duration: 30,
      features: ["Unlimited gym access", "Personal trainer", "Locker"],
      maxCheckInsPerDay: 2,
      isActive: true,
    };

    it("should create plan successfully", async () => {
      (MembershipPlanRepository.findByName as jest.Mock).mockResolvedValue(
        null
      );
      (MembershipPlanRepository.create as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      const result = await MembershipPlanService.createPlan(createInput);

      expect(result).toEqual(mockMembershipPlan);
      expect(MembershipPlanRepository.findByName).toHaveBeenCalledWith(
        createInput.name
      );
      expect(MembershipPlanRepository.create).toHaveBeenCalledWith({
        name: createInput.name,
        description: createInput.description,
        duration: createInput.duration,
        price: expect.any(Number),
        features: createInput.features,
        maxCheckInsPerDay: createInput.maxCheckInsPerDay,
        isActive: createInput.isActive,
      });
    });

    it("should create plan with default values", async () => {
      const minimalInput = {
        name: "Basic",
        price: 100000,
        duration: 30,
        features: ["Gym access"],
      };

      (MembershipPlanRepository.findByName as jest.Mock).mockResolvedValue(
        null
      );
      (MembershipPlanRepository.create as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      await MembershipPlanService.createPlan(minimalInput);

      expect(MembershipPlanRepository.create).toHaveBeenCalledWith({
        name: minimalInput.name,
        description: undefined,
        duration: minimalInput.duration,
        price: expect.any(Number),
        features: minimalInput.features,
        maxCheckInsPerDay: 1, // default
        isActive: true, // default
      });
    });

    it("should throw CONFLICT error if plan name already exists", async () => {
      (MembershipPlanRepository.findByName as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      await expect(
        MembershipPlanService.createPlan(createInput)
      ).rejects.toMatchObject({
        message: "Membership plan with this name already exists",
        code: "CONFLICT",
      });
    });
  });

  describe("updatePlan", () => {
    const updateInput = {
      name: "Updated Plan",
      price: 600000,
    };

    it("should update plan successfully", async () => {
      const updatedPlan = { ...mockMembershipPlan, ...updateInput };
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );
      (MembershipPlanRepository.findByName as jest.Mock).mockResolvedValue(
        null
      );
      (MembershipPlanRepository.update as jest.Mock).mockResolvedValue(
        updatedPlan
      );

      const result = await MembershipPlanService.updatePlan(
        "plan123",
        updateInput
      );

      expect(result).toEqual(updatedPlan);
      expect(MembershipPlanRepository.findById).toHaveBeenCalledWith("plan123");
      expect(MembershipPlanRepository.update).toHaveBeenCalledWith("plan123", {
        name: updateInput.name,
        description: undefined,
        duration: undefined,
        price: expect.any(Number),
        features: undefined,
        maxCheckInsPerDay: undefined,
        isActive: undefined,
      });
    });

    it("should throw NOT_FOUND error if plan not found", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        MembershipPlanService.updatePlan("nonexistent", updateInput)
      ).rejects.toMatchObject({
        message: "Membership plan not found",
        code: "NOT_FOUND",
      });
    });

    it("should throw CONFLICT error if new name already exists", async () => {
      const existingPlanWithName = {
        ...mockMembershipPlan,
        id: "different123",
        name: "Updated Plan",
      };
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );
      (MembershipPlanRepository.findByName as jest.Mock).mockResolvedValue(
        existingPlanWithName
      );

      await expect(
        MembershipPlanService.updatePlan("plan123", updateInput)
      ).rejects.toMatchObject({
        message: "Membership plan with this name already exists",
        code: "CONFLICT",
      });
    });

    it("should allow updating with same name", async () => {
      const sameNameUpdate = { name: "Premium Monthly" };
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );
      (MembershipPlanRepository.update as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      await MembershipPlanService.updatePlan("plan123", sameNameUpdate);

      expect(MembershipPlanRepository.findByName).not.toHaveBeenCalled();
    });
  });

  describe("deletePlan", () => {
    it("should delete (deactivate) plan successfully", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );
      (MembershipPlanRepository.update as jest.Mock).mockResolvedValue({
        ...mockMembershipPlan,
        isActive: false,
      });

      await MembershipPlanService.deletePlan("plan123");

      expect(MembershipPlanRepository.findById).toHaveBeenCalledWith("plan123");
      expect(MembershipPlanRepository.update).toHaveBeenCalledWith("plan123", {
        isActive: false,
      });
    });

    it("should throw NOT_FOUND error if plan not found", async () => {
      (MembershipPlanRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        MembershipPlanService.deletePlan("nonexistent")
      ).rejects.toMatchObject({
        message: "Membership plan not found",
        code: "NOT_FOUND",
      });
    });
  });
});
