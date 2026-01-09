import { MembershipPlanRepository } from "../membership.repository";
import { prisma } from "../../config/database.config";

jest.mock("../../config/database.config", () => ({
  prisma: {
    membershipPlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("MembershipPlanRepository", () => {
  const mockMembershipPlan = {
    id: "plan123",
    name: "Premium Monthly",
    description: "Premium monthly membership",
    price: 500000,
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

  describe("create", () => {
    it("should create a new membership plan with all fields", async () => {
      const createData = {
        name: "Premium Monthly",
        description: "Premium monthly membership",
        price: 500000,
        duration: 30,
        features: ["Unlimited gym access", "Personal trainer", "Locker"],
        maxCheckInsPerDay: 2,
        isActive: true,
      };
      (prisma.membershipPlan.create as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      const result = await MembershipPlanRepository.create(createData);

      expect(result).toEqual(mockMembershipPlan);
      expect(prisma.membershipPlan.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          duration: createData.duration,
          price: createData.price,
          features: createData.features,
          maxCheckInsPerDay: createData.maxCheckInsPerDay,
          isActive: createData.isActive,
        },
      });
    });

    it("should create membership plan with default values", async () => {
      const createData = {
        name: "Basic Plan",
        price: 200000,
        duration: 30,
        features: ["Gym access"],
      };
      (prisma.membershipPlan.create as jest.Mock).mockResolvedValue({
        ...mockMembershipPlan,
        ...createData,
        maxCheckInsPerDay: 1,
        isActive: true,
      });

      await MembershipPlanRepository.create(createData);

      expect(prisma.membershipPlan.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: undefined,
          duration: createData.duration,
          price: createData.price,
          features: createData.features,
          maxCheckInsPerDay: 1, // default
          isActive: true, // default
        },
      });
    });
  });

  describe("findById", () => {
    it("should find membership plan by ID", async () => {
      const planId = "plan123";
      (prisma.membershipPlan.findUnique as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      const result = await MembershipPlanRepository.findById(planId);

      expect(result).toEqual(mockMembershipPlan);
      expect(prisma.membershipPlan.findUnique).toHaveBeenCalledWith({
        where: { id: planId },
      });
    });

    it("should return null if plan not found", async () => {
      const planId = "nonexistent";
      (prisma.membershipPlan.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await MembershipPlanRepository.findById(planId);

      expect(result).toBeNull();
    });
  });

  describe("findByName", () => {
    it("should find membership plan by name (case insensitive)", async () => {
      const name = "Premium";
      (prisma.membershipPlan.findFirst as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      const result = await MembershipPlanRepository.findByName(name);

      expect(result).toEqual(mockMembershipPlan);
      expect(prisma.membershipPlan.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
      });
    });

    it("should return null if plan not found by name", async () => {
      const name = "Nonexistent Plan";
      (prisma.membershipPlan.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await MembershipPlanRepository.findByName(name);

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should find all membership plans without options", async () => {
      (prisma.membershipPlan.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanRepository.findMany();

      expect(result).toEqual([mockMembershipPlan]);
      expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { price: "asc" },
      });
    });

    it("should find membership plans with search option", async () => {
      const options = { search: "Premium" };
      (prisma.membershipPlan.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanRepository.findMany(options);

      expect(result).toEqual([mockMembershipPlan]);
      expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "Premium", mode: "insensitive" } },
            { description: { contains: "Premium", mode: "insensitive" } },
          ],
        },
        orderBy: { price: "asc" },
      });
    });

    it("should find membership plans with isActive filter", async () => {
      const options = { isActive: true };
      (prisma.membershipPlan.findMany as jest.Mock).mockResolvedValue([
        mockMembershipPlan,
      ]);

      const result = await MembershipPlanRepository.findMany(options);

      expect(result).toEqual([mockMembershipPlan]);
      expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { price: "asc" },
      });
    });

    it("should find inactive membership plans", async () => {
      const options = { isActive: false };
      (prisma.membershipPlan.findMany as jest.Mock).mockResolvedValue([]);

      await MembershipPlanRepository.findMany(options);

      expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: false },
        orderBy: { price: "asc" },
      });
    });
  });

  describe("update", () => {
    it("should update membership plan", async () => {
      const planId = "plan123";
      const updateData = {
        name: "Updated Plan",
        price: 600000,
      };
      const updatedPlan = { ...mockMembershipPlan, ...updateData };
      (prisma.membershipPlan.update as jest.Mock).mockResolvedValue(
        updatedPlan
      );

      const result = await MembershipPlanRepository.update(planId, updateData);

      expect(result).toEqual(updatedPlan);
      expect(prisma.membershipPlan.update).toHaveBeenCalledWith({
        where: { id: planId },
        data: updateData,
      });
    });
  });

  describe("delete", () => {
    it("should delete membership plan", async () => {
      const planId = "plan123";
      (prisma.membershipPlan.delete as jest.Mock).mockResolvedValue(
        mockMembershipPlan
      );

      const result = await MembershipPlanRepository.delete(planId);

      expect(result).toEqual(mockMembershipPlan);
      expect(prisma.membershipPlan.delete).toHaveBeenCalledWith({
        where: { id: planId },
      });
    });
  });
});
