import { TrainerRepository } from "../trainer.repository";
import { prisma } from "../../config/database.config";

jest.mock("../../config/database.config", () => ({
  prisma: {
    trainer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    gymClass: {
      count: jest.fn(),
    },
  },
}));

describe("TrainerRepository", () => {
  const mockTrainer = {
    id: "trainer123",
    name: "John Trainer",
    email: "trainer@example.com",
    phone: "+1234567890",
    specialization: ["Yoga", "Pilates"],
    bio: "Experienced yoga instructor",
    certifications: ["Yoga Alliance RYT-200", "CPR"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new trainer with all fields", async () => {
      const createData = {
        name: "John Trainer",
        email: "trainer@example.com",
        phone: "+1234567890",
        specialization: ["Yoga", "Pilates"],
        bio: "Experienced yoga instructor",
        certifications: ["Yoga Alliance RYT-200", "CPR"],
      };
      (prisma.trainer.create as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerRepository.create(createData);

      expect(result).toEqual(mockTrainer);
      expect(prisma.trainer.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          email: createData.email,
          phone: createData.phone,
          specialization: createData.specialization,
          bio: createData.bio,
          certifications: createData.certifications,
        },
      });
    });

    it("should create trainer with default empty certifications", async () => {
      const createData = {
        name: "Jane Trainer",
        email: "jane@example.com",
        specialization: ["CrossFit"],
      };
      (prisma.trainer.create as jest.Mock).mockResolvedValue({
        ...mockTrainer,
        ...createData,
        certifications: [],
      });

      await TrainerRepository.create(createData);

      expect(prisma.trainer.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          email: createData.email,
          phone: undefined,
          specialization: createData.specialization,
          bio: undefined,
          certifications: [],
        },
      });
    });
  });

  describe("findById", () => {
    it("should find trainer by ID", async () => {
      const trainerId = "trainer123";
      (prisma.trainer.findUnique as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerRepository.findById(trainerId);

      expect(result).toEqual(mockTrainer);
      expect(prisma.trainer.findUnique).toHaveBeenCalledWith({
        where: { id: trainerId },
      });
    });

    it("should return null if trainer not found", async () => {
      const trainerId = "nonexistent";
      (prisma.trainer.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await TrainerRepository.findById(trainerId);

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find trainer by email", async () => {
      const email = "trainer@example.com";
      (prisma.trainer.findUnique as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerRepository.findByEmail(email);

      expect(result).toEqual(mockTrainer);
      expect(prisma.trainer.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it("should return null if trainer not found by email", async () => {
      const email = "nonexistent@example.com";
      (prisma.trainer.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await TrainerRepository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should find all trainers without options", async () => {
      (prisma.trainer.findMany as jest.Mock).mockResolvedValue([mockTrainer]);

      const result = await TrainerRepository.findMany();

      expect(result).toEqual([mockTrainer]);
      expect(prisma.trainer.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: "asc" },
      });
    });

    it("should find trainers with search option", async () => {
      const options = { search: "John" };
      (prisma.trainer.findMany as jest.Mock).mockResolvedValue([mockTrainer]);

      const result = await TrainerRepository.findMany(options);

      expect(result).toEqual([mockTrainer]);
      expect(prisma.trainer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "John", mode: "insensitive" } },
            { bio: { contains: "John", mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
      });
    });

    it("should find trainers with specialization filter", async () => {
      const options = { specialization: "Yoga" };
      (prisma.trainer.findMany as jest.Mock).mockResolvedValue([mockTrainer]);

      const result = await TrainerRepository.findMany(options);

      expect(result).toEqual([mockTrainer]);
      expect(prisma.trainer.findMany).toHaveBeenCalledWith({
        where: {
          specialization: { has: "Yoga" },
        },
        orderBy: { name: "asc" },
      });
    });

    it("should find trainers with isActive filter", async () => {
      const options = { isActive: true };
      (prisma.trainer.findMany as jest.Mock).mockResolvedValue([mockTrainer]);

      const result = await TrainerRepository.findMany(options);

      expect(result).toEqual([mockTrainer]);
      expect(prisma.trainer.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    });

    it("should find inactive trainers", async () => {
      const options = { isActive: false };
      (prisma.trainer.findMany as jest.Mock).mockResolvedValue([]);

      await TrainerRepository.findMany(options);

      expect(prisma.trainer.findMany).toHaveBeenCalledWith({
        where: { isActive: false },
        orderBy: { name: "asc" },
      });
    });

    it("should combine multiple filter options", async () => {
      const options = {
        search: "John",
        specialization: "Yoga",
        isActive: true,
      };
      (prisma.trainer.findMany as jest.Mock).mockResolvedValue([mockTrainer]);

      await TrainerRepository.findMany(options);

      expect(prisma.trainer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "John", mode: "insensitive" } },
            { bio: { contains: "John", mode: "insensitive" } },
          ],
          specialization: { has: "Yoga" },
          isActive: true,
        },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("update", () => {
    it("should update trainer", async () => {
      const trainerId = "trainer123";
      const updateData = {
        name: "Updated Name",
        bio: "Updated bio",
      };
      const updatedTrainer = { ...mockTrainer, ...updateData };
      (prisma.trainer.update as jest.Mock).mockResolvedValue(updatedTrainer);

      const result = await TrainerRepository.update(trainerId, updateData);

      expect(result).toEqual(updatedTrainer);
      expect(prisma.trainer.update).toHaveBeenCalledWith({
        where: { id: trainerId },
        data: updateData,
      });
    });
  });

  describe("delete", () => {
    it("should delete trainer", async () => {
      const trainerId = "trainer123";
      (prisma.trainer.delete as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerRepository.delete(trainerId);

      expect(result).toEqual(mockTrainer);
      expect(prisma.trainer.delete).toHaveBeenCalledWith({
        where: { id: trainerId },
      });
    });
  });

  describe("hasClasses", () => {
    it("should return true if trainer has classes", async () => {
      const trainerId = "trainer123";
      (prisma.gymClass.count as jest.Mock).mockResolvedValue(5);

      const result = await TrainerRepository.hasClasses(trainerId);

      expect(result).toBe(true);
      expect(prisma.gymClass.count).toHaveBeenCalledWith({
        where: { trainerId },
      });
    });

    it("should return false if trainer has no classes", async () => {
      const trainerId = "trainer123";
      (prisma.gymClass.count as jest.Mock).mockResolvedValue(0);

      const result = await TrainerRepository.hasClasses(trainerId);

      expect(result).toBe(false);
    });
  });
});
