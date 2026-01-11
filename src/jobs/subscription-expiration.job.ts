import cron from "node-cron";
import { SubscriptionSchedulerService } from "../services/subscription-scheduler.service";

/**
 * Subscription Expiration Cron Job
 * Runs every hour to check and expire overdue subscriptions
 */
export function startSubscriptionExpirationJob() {
  // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
  const job = cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running subscription expiration check...");

    try {
      const result =
        await SubscriptionSchedulerService.expireOverdueSubscriptions();

      if (result.expiredCount > 0) {
        console.log(`[Cron] Expired ${result.expiredCount} subscriptions`);
      } else {
        console.log("[Cron] No subscriptions to expire");
      }
    } catch (error) {
      console.error("[Cron] Error during subscription expiration:", error);
    }
  });

  console.log(
    "📅 Subscription expiration cron job scheduled (runs every hour)"
  );

  return job;
}

/**
 * Run subscription expiration immediately (for testing or manual trigger)
 */
export async function runSubscriptionExpirationNow() {
  console.log("[Manual] Running subscription expiration check...");

  try {
    const result =
      await SubscriptionSchedulerService.expireOverdueSubscriptions();
    return result;
  } catch (error) {
    console.error("[Manual] Error during subscription expiration:", error);
    throw error;
  }
}
