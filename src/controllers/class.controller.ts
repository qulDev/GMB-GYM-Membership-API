import { Request, Response, NextFunction } from "express";
import { GymClassService } from "../services/class.service";
import { ResponseHelper } from "../utils";
import * as z from "zod";
import {
  createGymClassSchema,
  updateGymClassSchema,
  gymClassIdParamSchema,
  gymClassQuerySchema,
} from "../validations/class.validation";

const formatZodErrors = (error: z.ZodError) =>
  error.issues.map(i => ({ field: i.path.join("."), message: i.message }));

export class GymClassController {

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = gymClassQuerySchema.parse(req.query);
      const data = await GymClassService.getAll(query);
      ResponseHelper.success(res, data, 200);
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }
      next(error);
    }
  }

  static async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = gymClassIdParamSchema.parse(req.params);
      const data = await GymClassService.getById(id);
      ResponseHelper.success(res, data, 200);
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error.message === "CLASS_NOT_FOUND") {
        ResponseHelper.notFound(res, "Class not found");
        return;
      }

      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createGymClassSchema.parse(req.body);
      const result = await GymClassService.create(data);
      ResponseHelper.success(res, result, 201);
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error.message.includes("Schedule")) {
        ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
        return;
      }

      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = gymClassIdParamSchema.parse(req.params);
      const data = updateGymClassSchema.parse(req.body);
      const result = await GymClassService.update(id, data);
      ResponseHelper.success(res, result, 200);
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error.message === "CLASS_NOT_FOUND") {
        ResponseHelper.notFound(res, "Class not found");
        return;
      }

      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = gymClassIdParamSchema.parse(req.params);
      await GymClassService.delete(id);
      ResponseHelper.message(res, "Class deleted successfully", 200);
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error.message === "CLASS_NOT_FOUND") {
        ResponseHelper.notFound(res, "Class not found");
        return;
      }

      next(error);
    }
  }
}
