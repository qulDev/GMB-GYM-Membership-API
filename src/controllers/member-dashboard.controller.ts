import { Request, Response, NextFunction } from "express";
import {
  MemberDashboardService,
  MemberDashboardServiceError,
} from "../services";
import { ResponseHelper } from "../utils";

export class MemberDashboardController {
  /**
   * Get member dashboard statistics
   * GET /api/v1/member/dashboard
   * Authenticated user only
   */
  static async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.userId;

      if (!userId) {
        ResponseHelper.unauthorized(res, "User not authenticated");
        return;
      }

      const dashboardStats = await MemberDashboardService.getDashboardStats(
        userId
      );

      ResponseHelper.success(res, dashboardStats, 200);
    } catch (error) {
      if (error instanceof MemberDashboardServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "FORBIDDEN":
            ResponseHelper.error(res, "FORBIDDEN", error.message, 403);
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
