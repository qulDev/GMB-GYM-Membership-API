import { Prisma } from "../generated/prisma";
import { MembershipPlanRepository } from "../models";
import {
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
  MembershipPlanQuery,
} from "../types";

export class MembershipPlanServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "INTERNAL"
  ) {
    super(message);
    this.name = "MembershipPlanServiceError";
  }
}

export class MembershipPlanService {


    

    static async getAllPlans(query: MembershipPlanQuery) {
        const { active, duration, search } = query;
      
        const where: any = {};
      
        if (active !== undefined) {
          where.isActive = active;
        }
      
        if (duration !== undefined) {
          where.duration = duration;
        }
      
        if (search) {
          where.name = {
            contains: search,
            mode: "insensitive",
          };
        }
      
        const plans = await MembershipPlanRepository.findMany(where);
      
        return plans;
      }
      

  /**
   * Get membership plan by ID
   */
  static async getPlanById(id: string) {
    const plan = await MembershipPlanRepository.findById(id);

    if (!plan) {
      throw new MembershipPlanServiceError(
        "Membership plan not found",
        "NOT_FOUND"
      );
    }

    return plan;
  }

  /**
   * Create membership plan (Admin only)
   */
  static async createPlan(input: CreateMembershipPlanInput) {
    // Check duplicate plan name
    const existingPlan = await MembershipPlanRepository.findByName(input.name);

    if (existingPlan) {
      throw new MembershipPlanServiceError(
        "Membership plan with this name already exists",
        "CONFLICT"
      );
    }

    const plan = await MembershipPlanRepository.create({
      name: input.name,
      description: input.description,
      duration: input.duration,
      price: Number(new Prisma.Decimal(input.price)),
      features: input.features,
      maxCheckInsPerDay: input.maxCheckInsPerDay ?? 1,
      isActive: input.isActive ?? true,
    });

    return plan;
  }

  /**
   * Update membership plan (Admin only)
   */
  static async updatePlan(id: string, input: UpdateMembershipPlanInput) {
    const existingPlan = await MembershipPlanRepository.findById(id);

    if (!existingPlan) {
      throw new MembershipPlanServiceError(
        "Membership plan not found",
        "NOT_FOUND"
      );
    }

    // Check duplicate name (if name updated)
    if (input.name && input.name !== existingPlan.name) {
      const duplicate = await MembershipPlanRepository.findByName(input.name);

      if (duplicate) {
        throw new MembershipPlanServiceError(
          "Membership plan with this name already exists",
          "CONFLICT"
        );
      }
    }

    const updatedPlan = await MembershipPlanRepository.update(id, {
      name: input.name,
      description: input.description,
      duration: input.duration,
      price: input.price
        ? new Prisma.Decimal(input.price).toNumber()
        : undefined,
      features: input.features,
      maxCheckInsPerDay: input.maxCheckInsPerDay,
      isActive: input.isActive,
    });

    return updatedPlan;
  }

  /**
   * Delete membership plan (Admin only)
   * Soft delete: set isActive = false
   */
  static async deletePlan(id: string): Promise<void> {
    const existingPlan = await MembershipPlanRepository.findById(id);

    if (!existingPlan) {
      throw new MembershipPlanServiceError(
        "Membership plan not found",
        "NOT_FOUND"
      );
    }

    await MembershipPlanRepository.update(id, {
      isActive: false,
    });
  }
}
