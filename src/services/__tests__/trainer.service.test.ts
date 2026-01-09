import { TrainerService, TrainerServiceError } from "../trainer.service";
import { TrainerRepository } from "../../models";

jest.mock("../../models", () => ({
  TrainerRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    hasClasses: jest.fn(),
  },
}));

describe("TrainerService", () => {
  const mockTrainer = {
    id: "trainer123",
    name: "John Trainer",
    email: "trainer@example.com",
    phone: "+1234567890",
    specialization: ["Yoga", "Pilates"],
    bio: "Experienced yoga instructor",
    certifications: ["Yoga Alliance RYT-200"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllTrainers", () => {
    it("should get all trainers without filters", async () => {
      (TrainerRepository.findMany as jest.Mock).mockResolvedValue([
        mockTrainer,
      ]);

      const result = await TrainerService.getAllTrainers({});

      expect(result).toEqual([mockTrainer]);
      expect(TrainerRepository.findMany).toHaveBeenCalledWith({
        search: undefined,
        specialization: undefined,
        isActive: undefined,
      });
    });

    it("should get trainers with search filter", async () => {
      (TrainerRepository.findMany as jest.Mock).mockResolvedValue([
        mockTrainer,
      ]);

      const result = await TrainerService.getAllTrainers({ search: "John" });

      expect(result).toEqual([mockTrainer]);
      expect(TrainerRepository.findMany).toHaveBeenCalledWith({
        search: "John",
        specialization: undefined,
        isActive: undefined,
      });
    });

    it("should get trainers with specialization filter", async () => {
      (TrainerRepository.findMany as jest.Mock).mockResolvedValue([
        mockTrainer,
      ]);

      const result = await TrainerService.getAllTrainers({
        specialization: "Yoga",
      });

      expect(result).toEqual([mockTrainer]);
      expect(TrainerRepository.findMany).toHaveBeenCalledWith({
        search: undefined,
        specialization: "Yoga",
        isActive: undefined,
      });
    });

    it("should get trainers with isActive filter", async () => {
      (TrainerRepository.findMany as jest.Mock).mockResolvedValue([
        mockTrainer,
      ]);

      const result = await TrainerService.getAllTrainers({ isActive: true });

      expect(result).toEqual([mockTrainer]);
      expect(TrainerRepository.findMany).toHaveBeenCalledWith({
        search: undefined,
        specialization: undefined,
        isActive: true,
      });
    });
  });

  describe("getTrainerById", () => {
    it("should get trainer by ID successfully", async () => {
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerService.getTrainerById("trainer123");

      expect(result).toEqual(mockTrainer);
      expect(TrainerRepository.findById).toHaveBeenCalledWith("trainer123");
    });

    it("should throw NOT_FOUND error if trainer not found", async () => {
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        TrainerService.getTrainerById("nonexistent")
      ).rejects.toThrow(TrainerServiceError);
      await expect(
        TrainerService.getTrainerById("nonexistent")
      ).rejects.toMatchObject({
        message: "Trainer not found",
        code: "NOT_FOUND",
      });
    });
  });

  describe("createTrainer", () => {
    const createInput = {
      name: "John Trainer",
      email: "trainer@example.com",
      phone: "+1234567890",
      specialization: ["Yoga", "Pilates"],
      bio: "Experienced yoga instructor",
      certifications: ["Yoga Alliance RYT-200"],
    };

    it("should create trainer successfully", async () => {
      (TrainerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (TrainerRepository.create as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerService.createTrainer(createInput);

      expect(result).toEqual(mockTrainer);
      expect(TrainerRepository.findByEmail).toHaveBeenCalledWith(
        createInput.email
      );
      expect(TrainerRepository.create).toHaveBeenCalledWith({
        name: createInput.name,
        email: createInput.email,
        phone: createInput.phone,
        specialization: createInput.specialization,
        bio: createInput.bio,
        certifications: createInput.certifications,
      });
    });

    it("should throw CONFLICT error if email already exists", async () => {
      (TrainerRepository.findByEmail as jest.Mock).mockResolvedValue(
        mockTrainer
      );

      await expect(
        TrainerService.createTrainer(createInput)
      ).rejects.toMatchObject({
        message: "Trainer with this email already exists",
        code: "CONFLICT",
      });
    });
  });

  describe("updateTrainer", () => {
    const updateInput = {
      name: "Updated Name",
      bio: "Updated bio",
    };

    it("should update trainer successfully", async () => {
      const updatedTrainer = { ...mockTrainer, ...updateInput };
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(mockTrainer);
      (TrainerRepository.update as jest.Mock).mockResolvedValue(updatedTrainer);

      const result = await TrainerService.updateTrainer(
        "trainer123",
        updateInput
      );

      expect(result).toEqual(updatedTrainer);
      expect(TrainerRepository.findById).toHaveBeenCalledWith("trainer123");
      expect(TrainerRepository.update).toHaveBeenCalledWith(
        "trainer123",
        updateInput
      );
    });

    it("should throw NOT_FOUND error if trainer not found", async () => {
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        TrainerService.updateTrainer("nonexistent", updateInput)
      ).rejects.toMatchObject({
        message: "Trainer not found",
        code: "NOT_FOUND",
      });
    });

    it("should throw CONFLICT error if new email already exists", async () => {
      const updateWithEmail = { email: "existing@example.com" };
      const existingTrainerWithEmail = {
        ...mockTrainer,
        id: "different123",
        email: updateWithEmail.email,
      };

      (TrainerRepository.findById as jest.Mock).mockResolvedValue(mockTrainer);
      (TrainerRepository.findByEmail as jest.Mock).mockResolvedValue(
        existingTrainerWithEmail
      );

      await expect(
        TrainerService.updateTrainer("trainer123", updateWithEmail)
      ).rejects.toMatchObject({
        message: "Trainer with this email already exists",
        code: "CONFLICT",
      });
    });

    it("should allow updating with same email", async () => {
      const updateWithSameEmail = { email: "trainer@example.com" };
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(mockTrainer);
      (TrainerRepository.update as jest.Mock).mockResolvedValue(mockTrainer);

      await TrainerService.updateTrainer("trainer123", updateWithSameEmail);

      expect(TrainerRepository.findByEmail).not.toHaveBeenCalled();
      expect(TrainerRepository.update).toHaveBeenCalledWith(
        "trainer123",
        updateWithSameEmail
      );
    });
  });

  describe("deleteTrainer", () => {
    it("should delete trainer successfully", async () => {
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(mockTrainer);
      (TrainerRepository.hasClasses as jest.Mock).mockResolvedValue(false);
      (TrainerRepository.delete as jest.Mock).mockResolvedValue(mockTrainer);

      const result = await TrainerService.deleteTrainer("trainer123");

      expect(result).toEqual({ message: "Trainer deleted successfully" });
      expect(TrainerRepository.findById).toHaveBeenCalledWith("trainer123");
      expect(TrainerRepository.hasClasses).toHaveBeenCalledWith("trainer123");
      expect(TrainerRepository.delete).toHaveBeenCalledWith("trainer123");
    });

    it("should throw NOT_FOUND error if trainer not found", async () => {
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        TrainerService.deleteTrainer("nonexistent")
      ).rejects.toMatchObject({
        message: "Trainer not found",
        code: "NOT_FOUND",
      });
    });

    it("should throw CONFLICT error if trainer has classes", async () => {
      (TrainerRepository.findById as jest.Mock).mockResolvedValue(mockTrainer);
      (TrainerRepository.hasClasses as jest.Mock).mockResolvedValue(true);

      await expect(
        TrainerService.deleteTrainer("trainer123")
      ).rejects.toMatchObject({
        message:
          "Cannot delete trainer with assigned classes. Please reassign or delete the classes first.",
        code: "CONFLICT",
      });
    });
  });
});
