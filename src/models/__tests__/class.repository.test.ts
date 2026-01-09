import { GymClassRepository } from "../class.repository";
import { prisma } from "../../config/database.config";

jest.mock("../../config/database.config", () => ({
  prisma: {
    gymClass: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("GymClassRepository", () => {
  const mockTrainer = {
    id: "trainer123",
    name: "John Trainer",
    email: "trainer@example.com",
  };

  const mockGymClass = {
    id: "class123",
    name: "Yoga Morning",
    description: "Morning yoga session",
    trainerId: "trainer123",
    schedule: new Date("2024-01-15T08:00:00Z"),
    duration: 60,
    capacity: 20,
    bookedCount: 5,
    type: "yoga",
    status: "SCHEDULED",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGymClassWithTrainer = {
    ...mockGymClass,
    trainer: mockTrainer,
  };

  const mockGymClassWithBookings = {
    ...mockGymClassWithTrainer,
    bookings: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new gym class", async () => {
      const classData = {
        name: "Yoga Morning",
        description: "Morning yoga session",
        trainerId: "trainer123",
        schedule: new Date("2024-01-15T08:00:00Z"),
        duration: 60,
        capacity: 20,
        type: "yoga",
      };
      (prisma.gymClass.create as jest.Mock).mockResolvedValue(mockGymClass);

      const result = await GymClassRepository.create(classData);

      expect(result).toEqual(mockGymClass);
      expect(prisma.gymClass.create).toHaveBeenCalledWith({ data: classData });
    });
  });

  describe("findAll", () => {
    it("should find all non-cancelled gym classes with trainer info", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([
        mockGymClassWithTrainer,
      ]);

      const result = await GymClassRepository.findAll();

      expect(result).toEqual([mockGymClassWithTrainer]);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: { status: { not: "CANCELLED" } },
        include: { trainer: true },
      });
    });

    it("should return empty array if no classes", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([]);

      const result = await GymClassRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should find gym class by ID with trainer and bookings", async () => {
      const classId = "class123";
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(
        mockGymClassWithBookings
      );

      const result = await GymClassRepository.findById(classId);

      expect(result).toEqual(mockGymClassWithBookings);
      expect(prisma.gymClass.findUnique).toHaveBeenCalledWith({
        where: { id: classId },
        include: { trainer: true, bookings: true },
      });
    });

    it("should return null if class not found", async () => {
      const classId = "nonexistent";
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await GymClassRepository.findById(classId);

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update gym class", async () => {
      const classId = "class123";
      const updateData = {
        name: "Updated Yoga Class",
        capacity: 25,
      };
      const updatedClass = {
        ...mockGymClass,
        ...updateData,
      };
      (prisma.gymClass.update as jest.Mock).mockResolvedValue(updatedClass);

      const result = await GymClassRepository.update(classId, updateData);

      expect(result).toEqual(updatedClass);
      expect(prisma.gymClass.update).toHaveBeenCalledWith({
        where: { id: classId },
        data: updateData,
      });
    });
  });

  describe("delete", () => {
    it("should delete gym class", async () => {
      const classId = "class123";
      (prisma.gymClass.delete as jest.Mock).mockResolvedValue(mockGymClass);

      const result = await GymClassRepository.delete(classId);

      expect(result).toEqual(mockGymClass);
      expect(prisma.gymClass.delete).toHaveBeenCalledWith({
        where: { id: classId },
      });
    });
  });
});
