import { prisma } from "../config/database.config";
import { Trainer, Prisma } from "../generated/prisma";

export interface CreateTrainerData {
  name: string;
  email: string;
  phone?: string;
  specialization: string[];
  bio?: string;
  certifications?: string[];
}

export interface UpdateTrainerData {
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string[];
  bio?: string;
  certifications?: string[];
  isActive?: boolean;
}

export class TrainerRepository {
  /**
   * Create a new trainer
   */
  static async create(data: CreateTrainerData): Promise<Trainer> {
    return prisma.trainer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialization: data.specialization,
        bio: data.bio,
        certifications: data.certifications ?? [],
      },
    });
  }

  /**
   * Find trainer by ID
   */
  static async findById(id: string): Promise<Trainer | null> {
    return prisma.trainer.findUnique({
      where: { id },
    });
  }

  /**
   * Find trainer by email
   */
  static async findByEmail(email: string): Promise<Trainer | null> {
    return prisma.trainer.findUnique({
      where: { email },
    });
  }

  /**
   * Find all trainers with optional filters
   */
  static async findMany(options?: {
    search?: string;
    specialization?: string;
    isActive?: boolean;
  }): Promise<Trainer[]> {
    const where: Prisma.TrainerWhereInput = {};

    if (options?.search) {
      where.OR = [
        {
          name: {
            contains: options.search,
            mode: "insensitive",
          },
        },
        {
          bio: {
            contains: options.search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (options?.specialization) {
      where.specialization = {
        has: options.specialization,
      };
    }

    if (typeof options?.isActive === "boolean") {
      where.isActive = options.isActive;
    }

    return prisma.trainer.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Update trainer
   */
  static async update(id: string, data: UpdateTrainerData): Promise<Trainer> {
    return prisma.trainer.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete trainer (soft delete by setting isActive to false)
   */
  static async delete(id: string): Promise<Trainer> {
    return prisma.trainer.delete({
      where: { id },
    });
  }

  /**
   * Check if trainer has any classes assigned
   */
  static async hasClasses(id: string): Promise<boolean> {
    const count = await prisma.gymClass.count({
      where: { trainerId: id },
    });
    return count > 0;
  }
}
