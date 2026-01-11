import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services";
import { ResponseHelper } from "../utils";

export class SubscriptionController {
  // USER
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        throw new Error("User is not authenticated");
      }

      const userId = req.user.userId;
      const { membershipPlanId } = req.body;

      if (!membershipPlanId) {
        throw new Error("Membership plan ID is required");
      }

      const sub = await SubscriptionService.createSubscription(
        userId,
        membershipPlanId
      );

      ResponseHelper.success(res, sub, 201);
    } catch (e) {
      next(e);
    }
  }

  static async current(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        throw new Error("User is not authenticated");
      }

      const sub = await SubscriptionService.getCurrentSubscription(
        req.user.userId
      );
      ResponseHelper.success(res, sub, 200);
    } catch (e) {
      next(e);
    }
  }

  // ADMIN
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const subs = await SubscriptionService.getAllSubscriptions(req.query);
      ResponseHelper.success(res, subs, 200);
    } catch (e) {
      next(e);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.activateSubscription(req.params.id);
      ResponseHelper.success(res, sub, 200);
    } catch (e) {
      next(e);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      await SubscriptionService.cancelSubscription(req.params.id);
      ResponseHelper.message(res, "Subscription canceled", 200);
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/v1/subscriptions/current/cancel
   * User cancels their own active subscription
   */
  static async cancelMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "User is not authenticated");
        return;
      }

      const userId = req.user.userId;
      const cancelledSub = await SubscriptionService.cancelUserSubscription(
        userId
      );

      ResponseHelper.success(
        res,
        {
          message: "Your subscription has been cancelled successfully",
          subscription: cancelledSub,
        },
        200
      );
    } catch (e: any) {
      if (e.message === "No active subscription found") {
        ResponseHelper.notFound(res, e.message);
        return;
      }
      if (
        e.message === "Subscription already canceled" ||
        e.message === "Cannot cancel an expired subscription" ||
        e.message.includes("Cannot cancel a pending subscription")
      ) {
        ResponseHelper.error(res, "BAD_REQUEST", e.message, 400);
        return;
      }
      next(e);
    }
  }
}
