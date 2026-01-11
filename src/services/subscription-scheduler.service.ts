import { SubscriptionRepository } from "../models";
import { LogsService } from "./logs.service";

export interface ExpireResult {
  expiredCount: number;
  expiredSubscriptions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    planName: string;
    endDate: Date | null;
  }>;
}

export class SubscriptionSchedulerService {
  /**
   * Check and expire all subscriptions that have passed their endDate
   * This should be called by a cron job or scheduler
   */
  static async expireOverdueSubscriptions(): Promise<ExpireResult> {
    // 1. Find all expired subscriptions
    const expiredSubscriptions = await SubscriptionRepository.findExpired();

    if (expiredSubscriptions.length === 0) {
      return {
        expiredCount: 0,
        expiredSubscriptions: [],
      };
    }

    // 2. Extract IDs and expire them in bulk
    const ids = expiredSubscriptions.map((sub) => sub.id);
    await SubscriptionRepository.expireMany(ids);

    // 3. Log the expiration for each subscription
    const expiredDetails = expiredSubscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.user.id,
      userEmail: sub.user.email,
      userName: sub.user.fullName,
      planName: sub.membershipPlan.name,
      endDate: sub.endDate,
    }));

    // 4. Create log entries for each expiration
    for (const sub of expiredDetails) {
      try {
        await LogsService.createLog({
          userId: sub.userId,
          action: "SUBSCRIPTION_EXPIRED",
          entity: "SUBSCRIPTION",
          entityId: sub.id,
          description: `Subscription for ${sub.planName} has expired`,
          level: "INFO",
          metadata: {
            planName: sub.planName,
            endDate: sub.endDate?.toISOString(),
          },
        });
      } catch {
        // Log error but don't fail the expiration process
        console.error(`Failed to log expiration for subscription ${sub.id}`);
      }
    }

    console.log(`[Scheduler] Expired ${expiredDetails.length} subscriptions`);

    return {
      expiredCount: expiredDetails.length,
      expiredSubscriptions: expiredDetails,
    };
  }

  /**
   * Get count of subscriptions that will expire soon (within specified days)
   */
  static async getExpiringSoon(withinDays: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    const subscriptions = await SubscriptionRepository.findMany({
      status: "ACTIVE",
      endDate: {
        gte: new Date(),
        lte: futureDate,
      },
    });

    return {
      count: subscriptions.length,
      subscriptions: subscriptions.map((sub: any) => ({
        id: sub.id,
        userId: sub.userId,
        userEmail: sub.user?.email,
        userName: sub.user?.fullName,
        planName: sub.membershipPlan?.name,
        endDate: sub.endDate,
        daysRemaining: sub.endDate
          ? Math.ceil(
              (new Date(sub.endDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      })),
    };
  }
}
