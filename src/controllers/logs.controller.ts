import { Request, Response, NextFunction } from "express";
import { LogsService, LogsServiceError } from "../services";
import { ResponseHelper } from "../utils";
import {
  createLogSchema,
  logListQuerySchema,
  logIdParamSchema,
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

export class LogsController {
  /**
   * Get system logs (Admin only)
   * GET /api/v1/logs
   */
  static async listLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate query parameters
      const validatedQuery = logListQuerySchema.parse(req.query);

      const result = await LogsService.listLogs(validatedQuery);

      ResponseHelper.success(res, result, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof LogsServiceError) {
        switch (error.code) {
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            break;
          case "INTERNAL":
            ResponseHelper.internalError(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * Create log entry
   * POST /api/v1/logs
   */
  static async createLog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = createLogSchema.parse(req.body);

      // Get IP address and User Agent from request
      const ipAddress =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        undefined;
      const userAgent = req.headers["user-agent"] || undefined;

      // Get userId from authenticated user if available
      const userId = req.user?.userId;

      const log = await LogsService.createLog({
        ...validatedData,
        userId,
        ipAddress,
        userAgent,
      });

      ResponseHelper.success(res, log, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof LogsServiceError) {
        switch (error.code) {
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            break;
          case "INTERNAL":
            ResponseHelper.internalError(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * Get log by ID (Admin only)
   * GET /api/v1/logs/:logId
   */
  static async getLogById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const { logId } = logIdParamSchema.parse(req.params);

      const log = await LogsService.getLogById(logId);

      ResponseHelper.success(res, log, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof LogsServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "INTERNAL":
            ResponseHelper.internalError(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * Delete log (Admin only)
   * DELETE /api/v1/logs/:logId
   */
  static async deleteLog(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const { logId } = logIdParamSchema.parse(req.params);

      await LogsService.deleteLog(logId);

      ResponseHelper.message(res, "Log deleted successfully", 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof LogsServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "INTERNAL":
            ResponseHelper.internalError(res, error.message);
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
