import { Request, Response, NextFunction } from "express";
import { CheckInService } from "../services";
import { ResponseHelper } from "../utils";

export class CheckInController {
  /**
   * POST /api/v1/check-ins
   * Check in to gym
   */
  static async checkIn(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "User is not authenticated");
        return;
      }

      const checkIn = await CheckInService.checkIn(req.user.userId);
      ResponseHelper.success(res, checkIn, 201);
    } catch (error: any) {
      if (error.statusCode === 403) {
        ResponseHelper.forbidden(res, error.message);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/check-ins/:checkInId/checkout
   * Check out from gym
   */
  static async checkOut(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "User is not authenticated");
        return;
      }

      const { checkInId } = req.params;

      if (!checkInId) {
        ResponseHelper.error(
          res,
          "VALIDATION_ERROR",
          "Check-in ID is required",
          400
        );
        return;
      }

      const checkIn = await CheckInService.checkOut(checkInId, req.user.userId);
      ResponseHelper.success(res, checkIn, 200);
    } catch (error: any) {
      if (error.statusCode === 404) {
        ResponseHelper.notFound(res, error.message);
        return;
      }
      if (error.statusCode === 400) {
        ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/check-ins
   * Get check-in history
   */
  static async getHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "User is not authenticated");
        return;
      }

      const { startDate, endDate } = req.query;

      const history = await CheckInService.getHistory(
        req.user.userId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      ResponseHelper.success(res, history, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/check-ins/current
   * Get current check-in status
   */
  static async getCurrentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "User is not authenticated");
        return;
      }

      const status = await CheckInService.getCurrentStatus(req.user.userId);
      ResponseHelper.success(res, status, 200);
    } catch (error) {
      next(error);
    }
  }
}
