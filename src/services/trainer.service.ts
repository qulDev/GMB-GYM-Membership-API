import { TrainerRepository } from "../models";
import { CreateTrainerInput, UpdateTrainerInput, TrainerQuery } from "../types";

export class TrainerServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "INTERNAL"
  ) {
    super(message);
    this.name = "TrainerServiceError";
  }
}

export class TrainerService {
  /**
   * Get all trainers with optional filters
   */
  static async getAllTrainers(query: TrainerQuery) {
    const { search, specialization, isActive } = query;

    const trainers = await TrainerRepository.findMany({
      search,
      specialization,
      isActive,
    });

    return trainers;
  }

  /**
   * Get trainer by ID
   */
  static async getTrainerById(id: string) {
    const trainer = await TrainerRepository.findById(id);

    if (!trainer) {
      throw new TrainerServiceError("Trainer not found", "NOT_FOUND");
    }

    return trainer;
  }

  /**
   * Create new trainer (Admin only)
   */
  static async createTrainer(input: CreateTrainerInput) {
    // Check if email already exists
    const existingTrainer = await TrainerRepository.findByEmail(input.email);
    if (existingTrainer) {
      throw new TrainerServiceError(
        "Trainer with this email already exists",
        "CONFLICT"
      );
    }

    const trainer = await TrainerRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      specialization: input.specialization,
      bio: input.bio,
      certifications: input.certifications,
    });

    return trainer;
  }

  /**
   * Update trainer (Admin only)
   */
  static async updateTrainer(id: string, input: UpdateTrainerInput) {
    const existingTrainer = await TrainerRepository.findById(id);

    if (!existingTrainer) {
      throw new TrainerServiceError("Trainer not found", "NOT_FOUND");
    }

    // Check if email is being changed and if new email already exists
    if (input.email && input.email !== existingTrainer.email) {
      const trainerWithEmail = await TrainerRepository.findByEmail(input.email);
      if (trainerWithEmail) {
        throw new TrainerServiceError(
          "Trainer with this email already exists",
          "CONFLICT"
        );
      }
    }

    const trainer = await TrainerRepository.update(id, input);

    return trainer;
  }

  /**
   * Delete trainer (Admin only)
   */
  static async deleteTrainer(id: string) {
    const existingTrainer = await TrainerRepository.findById(id);

    if (!existingTrainer) {
      throw new TrainerServiceError("Trainer not found", "NOT_FOUND");
    }

    // Check if trainer has any classes assigned
    const hasClasses = await TrainerRepository.hasClasses(id);
    if (hasClasses) {
      throw new TrainerServiceError(
        "Cannot delete trainer with assigned classes. Please reassign or delete the classes first.",
        "CONFLICT"
      );
    }

    await TrainerRepository.delete(id);

    return { message: "Trainer deleted successfully" };
  }
}
