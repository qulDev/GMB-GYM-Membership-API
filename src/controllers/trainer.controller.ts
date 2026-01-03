import { Request, Response, NextFunction } from "express";
import { TrainerService, TrainerServiceError } from "../services";
import { ResponseHelper } from "../utils";
import {
  createTrainerSchema,
  updateTrainerSchema,
  trainerIdParamSchema,
  trainerQuerySchema,
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

export class TrainerController {
  /**
   * GET /api/v1/trainers
   * Get all trainers (Public)
   */
  static async getAllTrainers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = trainerQuerySchema.parse(req.query);

      const trainers = await TrainerService.getAllTrainers(query);

      ResponseHelper.success(res, trainers, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      next(error);
    }
  }

  /**
   * GET /api/v1/trainers/:trainerId
   * Get trainer by ID (Public)
   */
  static async getTrainerById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { trainerId } = trainerIdParamSchema.parse(req.params);

      const trainer = await TrainerService.getTrainerById(trainerId);

      ResponseHelper.success(res, trainer, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof TrainerServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          default:
            next(error);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * POST /api/v1/trainers
   * Create new trainer (Admin only)
   */
  static async createTrainer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = createTrainerSchema.parse(req.body);

      const trainer = await TrainerService.createTrainer(validatedData);

      ResponseHelper.success(res, trainer, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof TrainerServiceError) {
        switch (error.code) {
          case "CONFLICT":
            ResponseHelper.conflict(res, error.message);
            break;
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            break;
          default:
            next(error);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * PUT /api/v1/trainers/:trainerId
   * Update trainer (Admin only)
   */
  static async updateTrainer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { trainerId } = trainerIdParamSchema.parse(req.params);
      const validatedData = updateTrainerSchema.parse(req.body);

      const trainer = await TrainerService.updateTrainer(
        trainerId,
        validatedData
      );

      ResponseHelper.success(res, trainer, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof TrainerServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "CONFLICT":
            ResponseHelper.conflict(res, error.message);
            break;
          default:
            next(error);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * DELETE /api/v1/trainers/:trainerId
   * Delete trainer (Admin only)
   */
  static async deleteTrainer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { trainerId } = trainerIdParamSchema.parse(req.params);

      await TrainerService.deleteTrainer(trainerId);

      ResponseHelper.message(res, "Trainer deleted successfully", 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof TrainerServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "CONFLICT":
            ResponseHelper.conflict(res, error.message);
            break;
          default:
            next(error);
        }
        return;
      }

      next(error);
    }
  }
}
