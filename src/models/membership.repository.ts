import { prisma } from "../config/database.config";
import { MembershipPlan, Prisma } from "../generated/prisma";

export interface CreateMembershipPlanData {
  name: string;
  description?: string;
  price: number;
  duration: number;
  features: string[];
  maxCheckInsPerDay?: number;
  isActive?: boolean;
}

export interface UpdateMembershipPlanData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  features?: string[];
  maxCheckInsPerDay?: number;
  isActive?: boolean;
}

export class MembershipPlanRepository {
  static async create(
    data: CreateMembershipPlanData
  ): Promise<MembershipPlan> {
    return prisma.membershipPlan.create({
        data: {
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          features: data.features,
          maxCheckInsPerDay: data.maxCheckInsPerDay ?? 1,
          isActive: data.isActive ?? true,
        },
      });
  }

  static async findById(id: string): Promise<MembershipPlan | null> {
    return prisma.membershipPlan.findUnique({
      where: { id },
    });
  }

  static async findByName(
    name: string
  ): Promise<MembershipPlan | null> {
    return prisma.membershipPlan.findFirst({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
    });
  }

  static async findMany(options?: {
    search?: string;
    isActive?: boolean;
    duration?: number;
  }): Promise<MembershipPlan[]> {
    const where: Prisma.MembershipPlanWhereInput = {};

    if (options?.search) {
      where.OR = [
        {
          name: {
            contains: options.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: options.search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (typeof options?.isActive === "boolean") {
      where.isActive = options.isActive;
    }

    return prisma.membershipPlan.findMany({
      where,
      orderBy: {
        price: "asc",
      },
    });
  }

  static async update(
    id: string,
    data: UpdateMembershipPlanData
  ): Promise<MembershipPlan> {
    return prisma.membershipPlan.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<MembershipPlan> {
    return prisma.membershipPlan.delete({
      where: { id },
    });
  }

  
}


