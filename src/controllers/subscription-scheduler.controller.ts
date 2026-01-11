import { Request, Response, NextFunction } from "express";
import { SubscriptionSchedulerService } from "../services/subscription-scheduler.service";
import { ResponseHelper } from "../utils";

export class SubscriptionSchedulerController {
  /**
   * POST /api/v1/subscriptions/expire-check
   * Manually trigger subscription expiration check (Admin only)
   */
  static async triggerExpireCheck(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result =
        await SubscriptionSchedulerService.expireOverdueSubscriptions();

      ResponseHelper.success(
        res,
        {
          message: `Expired ${result.expiredCount} subscriptions`,
          ...result,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscriptions/expiring-soon
   * Get subscriptions that will expire soon (Admin only)
   */
  static async getExpiringSoon(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

      if (isNaN(days) || days < 1 || days > 90) {
        ResponseHelper.error(
          res,
          "VALIDATION_ERROR",
          "Days must be between 1 and 90",
          400
        );
        return;
      }

      const result = await SubscriptionSchedulerService.getExpiringSoon(days);

      ResponseHelper.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
