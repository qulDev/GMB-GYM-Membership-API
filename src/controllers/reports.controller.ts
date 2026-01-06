import { Request, Response, NextFunction } from "express";
import { ReportsService, ReportsServiceError } from "../services";
import { ResponseHelper } from "../utils";
import { revenueQuerySchema, attendanceQuerySchema } from "../validations";
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

export class ReportsController {
  /**
   * Get dashboard statistics
   * GET /api/v1/reports/dashboard
   * Admin only
   */
  static async getDashboard(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dashboardStats = await ReportsService.getDashboardStats();

      ResponseHelper.success(res, dashboardStats, 200);
    } catch (error) {
      if (error instanceof ReportsServiceError) {
        switch (error.code) {
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
   * Get revenue report
   * GET /api/v1/reports/revenue
   * Admin only
   */
  static async getRevenue(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate query parameters
      const validatedQuery = revenueQuerySchema.parse(req.query);

      const revenueReport = await ReportsService.getRevenueReport(
        validatedQuery
      );

      ResponseHelper.success(res, revenueReport, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof ReportsServiceError) {
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
   * Get attendance report
   * GET /api/v1/reports/attendance
   * Admin only
   */
  static async getAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate query parameters (optional)
      const validatedQuery = attendanceQuerySchema.parse(req.query);

      const attendanceReport = await ReportsService.getAttendanceReport(
        validatedQuery
      );

      ResponseHelper.success(res, attendanceReport, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof ReportsServiceError) {
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
}
