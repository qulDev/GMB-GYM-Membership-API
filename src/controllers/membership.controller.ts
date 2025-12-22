import { Request, Response, NextFunction } from "express";
import { MembershipPlanService, MembershipPlanServiceError } from "../services";
import { ResponseHelper } from "../utils";
import {
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
  membershipPlanIdParamSchema,
  membershipPlanQuerySchema,
} from "../validations";
import * as z from "zod";

// Helper function to format Zod errors
const formatZodErrors = (
  error: z.ZodError
): Array<{ field: string; message: string }> => {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
};

export class MembershipPlanController {
 
    

  static async getAllPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = membershipPlanQuerySchema.parse(req.query);

      const plans = await MembershipPlanService.getAllPlans(query);

      ResponseHelper.success(res, plans, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      next(error);
    }
  }

  static async getPlanById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = membershipPlanIdParamSchema.parse(req.params);

      const plan = await MembershipPlanService.getPlanById(id);

      ResponseHelper.success(res, plan, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof MembershipPlanServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  static async createPlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = createMembershipPlanSchema.parse(req.body);

      const plan = await MembershipPlanService.createPlan(validatedData);

      ResponseHelper.success(res, plan, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof MembershipPlanServiceError) {
        switch (error.code) {
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  static async updatePlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = membershipPlanIdParamSchema.parse(req.params);
      const validatedData = updateMembershipPlanSchema.parse(req.body);

      const plan = await MembershipPlanService.updatePlan(id, validatedData);

      ResponseHelper.success(res, plan, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof MembershipPlanServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  static async deletePlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = membershipPlanIdParamSchema.parse(req.params);

      await MembershipPlanService.deletePlan(id);

      ResponseHelper.message(res, "Membership plan deleted successfully", 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof MembershipPlanServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }
}
