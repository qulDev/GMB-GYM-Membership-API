import { CheckInRepository, SubscriptionRepository } from "../models";

export class CheckInService {
  /**
   * Check in to gym
   * - Validates active subscription
   * - Validates check-in limit
   * - Creates check-in record
   */
  static async checkIn(userId: string) {
    // 1. Check if user has active subscription
    const activeSubscription = await SubscriptionRepository.findActiveByUser(
      userId
    );

    if (!activeSubscription) {
      const error = new Error(
        "No active membership. Please subscribe to a plan first."
      );
      (error as any).statusCode = 403;
      throw error;
    }

    // 2. Check if subscription is still valid (not expired)
    if (activeSubscription.endDate && new Date() > activeSubscription.endDate) {
      const error = new Error(
        "Your membership has expired. Please renew your subscription."
      );
      (error as any).statusCode = 403;
      throw error;
    }

    // 3. Check if user already checked in (hasn't checked out yet)
    const activeCheckIn = await CheckInRepository.findActiveByUser(userId);

    if (activeCheckIn) {
      const error = new Error(
        "You are already checked in. Please check out first."
      );
      (error as any).statusCode = 403;
      throw error;
    }

    // 4. Check daily check-in limit
    const todayCheckIns = await CheckInRepository.countTodayCheckIns(userId);
    const maxCheckInsPerDay =
      activeSubscription.membershipPlan.maxCheckInsPerDay;

    if (todayCheckIns >= maxCheckInsPerDay) {
      const error = new Error(
        `Daily check-in limit reached (${maxCheckInsPerDay}). Please come back tomorrow.`
      );
      (error as any).statusCode = 403;
      throw error;
    }

    // 5. Create check-in
    return CheckInRepository.create(userId);
  }

  /**
   * Check out from gym
   * - Validates check-in exists and belongs to user
   * - Calculates duration
   * - Updates check-in record
   */
  static async checkOut(checkInId: string, userId: string) {
    // 1. Find check-in record
    const checkIn = await CheckInRepository.findByIdAndUser(checkInId, userId);

    if (!checkIn) {
      const error = new Error("Check-in record not found");
      (error as any).statusCode = 404;
      throw error;
    }

    // 2. Check if already checked out
    if (checkIn.checkOutTime) {
      const error = new Error("You have already checked out");
      (error as any).statusCode = 400;
      throw error;
    }

    // 3. Calculate duration in minutes
    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - checkIn.checkInTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // 4. Update check-in with checkout info
    return CheckInRepository.checkout(checkInId, checkOutTime, durationMinutes);
  }

  /**
   * Get check-in history for a user
   */
  static async getHistory(
    userId: string,
    startDate?: string,
    endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return CheckInRepository.findByUser(userId, start, end);
  }

  /**
   * Get current check-in status
   * Returns whether user is checked in and the current check-in record
   */
  static async getCurrentStatus(userId: string) {
    const currentCheckIn = await CheckInRepository.findActiveByUser(userId);

    return {
      isCheckedIn: !!currentCheckIn,
      currentCheckIn,
    };
  }
}
