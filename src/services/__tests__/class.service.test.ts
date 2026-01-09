import { GymClassService } from "../class.service";
import { prisma } from "../../config/database.config";

jest.mock("../../config/database.config", () => ({
  prisma: {
    gymClass: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe("GymClassService", () => {
  const mockTrainer = {
    id: "trainer123",
    name: "John Trainer",
    email: "trainer@example.com",
  };

  const mockGymClass = {
    id: "class123",
    name: "Morning Yoga",
    description: "Relaxing morning yoga session",
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
    it("should create gym class successfully", async () => {
      const createInput = {
        name: "Morning Yoga",
        description: "Relaxing morning yoga session",
        trainerId: "trainer123",
        schedule: "2024-01-15T08:00:00Z",
        duration: 60,
        capacity: 20,
        type: "yoga",
      };

      (prisma.gymClass.create as jest.Mock).mockResolvedValue(mockGymClass);

      const result = await GymClassService.create(createInput);

      expect(result).toEqual(mockGymClass);
      expect(prisma.gymClass.create).toHaveBeenCalledWith({
        data: {
          ...createInput,
          schedule: expect.any(Date),
        },
      });
    });
  });

  describe("update", () => {
    it("should update gym class successfully", async () => {
      const updateInput = {
        name: "Updated Yoga Class",
        capacity: 25,
      };
      const updatedClass = { ...mockGymClass, ...updateInput };

      (prisma.gymClass.update as jest.Mock).mockResolvedValue(updatedClass);

      const result = await GymClassService.update("class123", updateInput);

      expect(result).toEqual(updatedClass);
      expect(prisma.gymClass.update).toHaveBeenCalledWith({
        where: { id: "class123" },
        data: {
          ...updateInput,
          schedule: undefined,
        },
      });
    });

    it("should update gym class with new schedule", async () => {
      const updateInput = {
        schedule: "2024-01-20T10:00:00Z",
      };
      const updatedClass = {
        ...mockGymClass,
        schedule: new Date(updateInput.schedule),
      };

      (prisma.gymClass.update as jest.Mock).mockResolvedValue(updatedClass);

      const result = await GymClassService.update("class123", updateInput);

      expect(result).toEqual(updatedClass);
      expect(prisma.gymClass.update).toHaveBeenCalledWith({
        where: { id: "class123" },
        data: {
          ...updateInput,
          schedule: expect.any(Date),
        },
      });
    });
  });

  describe("delete", () => {
    it("should delete gym class successfully", async () => {
      (prisma.gymClass.delete as jest.Mock).mockResolvedValue(mockGymClass);

      const result = await GymClassService.delete("class123");

      expect(result).toEqual(mockGymClass);
      expect(prisma.gymClass.delete).toHaveBeenCalledWith({
        where: { id: "class123" },
      });
    });
  });

  describe("getAll", () => {
    it("should get all classes without filters", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([
        mockGymClassWithTrainer,
      ]);

      const result = await GymClassService.getAll({});

      expect(result).toEqual([mockGymClassWithTrainer]);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          trainerId: undefined,
          type: undefined,
          name: undefined,
        },
        orderBy: { schedule: "asc" },
        include: { trainer: true },
      });
    });

    it("should get classes filtered by status", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([
        mockGymClassWithTrainer,
      ]);

      const result = await GymClassService.getAll({ status: "SCHEDULED" });

      expect(result).toEqual([mockGymClassWithTrainer]);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: {
          status: "SCHEDULED",
          trainerId: undefined,
          type: undefined,
          name: undefined,
        },
        orderBy: { schedule: "asc" },
        include: { trainer: true },
      });
    });

    it("should get classes filtered by trainerId", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([
        mockGymClassWithTrainer,
      ]);

      const result = await GymClassService.getAll({ trainerId: "trainer123" });

      expect(result).toEqual([mockGymClassWithTrainer]);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          trainerId: "trainer123",
          type: undefined,
          name: undefined,
        },
        orderBy: { schedule: "asc" },
        include: { trainer: true },
      });
    });

    it("should get classes filtered by type", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([
        mockGymClassWithTrainer,
      ]);

      const result = await GymClassService.getAll({ type: "yoga" });

      expect(result).toEqual([mockGymClassWithTrainer]);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          trainerId: undefined,
          type: "yoga",
          name: undefined,
        },
        orderBy: { schedule: "asc" },
        include: { trainer: true },
      });
    });

    it("should search classes by name", async () => {
      (prisma.gymClass.findMany as jest.Mock).mockResolvedValue([
        mockGymClassWithTrainer,
      ]);

      const result = await GymClassService.getAll({ search: "Yoga" });

      expect(result).toEqual([mockGymClassWithTrainer]);
      expect(prisma.gymClass.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          trainerId: undefined,
          type: undefined,
          name: { contains: "Yoga", mode: "insensitive" },
        },
        orderBy: { schedule: "asc" },
        include: { trainer: true },
      });
    });
  });

  describe("getById", () => {
    it("should get class by ID with trainer and bookings", async () => {
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(
        mockGymClassWithBookings
      );

      const result = await GymClassService.getById("class123");

      expect(result).toEqual(mockGymClassWithBookings);
      expect(prisma.gymClass.findUnique).toHaveBeenCalledWith({
        where: { id: "class123" },
        include: { trainer: true, bookings: true },
      });
    });

    it("should return null if class not found", async () => {
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await GymClassService.getById("nonexistent");

      expect(result).toBeNull();
    });
  });
});
