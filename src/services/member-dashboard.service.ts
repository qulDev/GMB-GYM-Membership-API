import { MemberDashboardRepository } from "../models";
import { redis } from "../config/redis.config";
import {
  MemberDashboardStats,
  SubscriptionSummary,
  MemberCheckInStats,
  RecommendedClass,
  BookedClass,
  RecentCheckIn,
} from "../types";

// Redis cache configuration
const CACHE_PREFIX = "member_dashboard:";
const CACHE_TTL_SECONDS = 60; // 1 minute cache TTL

export class MemberDashboardServiceError extends Error {
  constructor(
    message: string,
    public code: "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL"
  ) {
    super(message);
    this.name = "MemberDashboardServiceError";
  }
}

export class MemberDashboardService {
  /**
   * Get cache key for user dashboard
   */
  private static getCacheKey(userId: string): string {
    return `${CACHE_PREFIX}${userId}`;
  }

  /**
   * Get cached dashboard data
   */
  private static async getCachedDashboard(
    userId: string
  ): Promise<MemberDashboardStats | null> {
    try {
      const cached = await redis.get(this.getCacheKey(userId));
      if (cached) {
        return JSON.parse(cached) as MemberDashboardStats;
      }
      return null;
    } catch {
      // If cache read fails, return null to fetch fresh data
      return null;
    }
  }

  /**
   * Set dashboard data in cache
   */
  private static async setCachedDashboard(
    userId: string,
    data: MemberDashboardStats
  ): Promise<void> {
    try {
      await redis.setex(
        this.getCacheKey(userId),
        CACHE_TTL_SECONDS,
        JSON.stringify(data)
      );
    } catch {
      // If cache write fails, just log and continue (non-critical)
      console.error("Failed to cache member dashboard data");
    }
  }

  /**
   * Invalidate dashboard cache for a user
   */
  static async invalidateCache(userId: string): Promise<void> {
    try {
      await redis.del(this.getCacheKey(userId));
    } catch {
      // If cache invalidation fails, just log and continue
      console.error("Failed to invalidate member dashboard cache");
    }
  }

  /**
   * Get member dashboard statistics
   */
  static async getDashboardStats(
    userId: string
  ): Promise<MemberDashboardStats> {
    try {
      // Try to get from cache first
      const cachedData = await this.getCachedDashboard(userId);
      if (cachedData) {
        return cachedData;
      }

      // Fetch all dashboard data in parallel for better performance
      const [
        subscription,
        totalCheckIns,
        thisMonthCheckIns,
        todayCheckIns,
        averageDuration,
        recommendedClasses,
        upcomingBookedClasses,
        recentActivity,
      ] = await Promise.all([
        MemberDashboardRepository.getActiveSubscription(userId),
        MemberDashboardRepository.getTotalCheckIns(userId),
        MemberDashboardRepository.getThisMonthCheckIns(userId),
        MemberDashboardRepository.getTodayCheckIns(userId),
        MemberDashboardRepository.getAverageDuration(userId),
        MemberDashboardRepository.getRecommendedClasses(userId),
        MemberDashboardRepository.getUpcomingBookedClasses(userId),
        MemberDashboardRepository.getRecentCheckIns(userId),
      ]);

      // Process subscription summary
      const subscriptionSummary = this.processSubscriptionSummary(subscription);

      // Calculate remaining check-ins for today
      const maxCheckInsPerDay =
        subscription?.membershipPlan?.maxCheckInsPerDay || 0;
      const remainingCheckInsToday = Math.max(
        0,
        maxCheckInsPerDay - todayCheckIns
      );

      // Process check-in stats
      const checkInStats: MemberCheckInStats = {
        totalCheckIns,
        thisMonthCheckIns,
        todayCheckIns,
        remainingCheckInsToday,
        averageDurationMinutes: averageDuration,
      };

      // Process recommended classes
      const processedRecommendedClasses =
        this.processRecommendedClasses(recommendedClasses);

      // Process booked classes
      const processedBookedClasses = this.processBookedClasses(
        upcomingBookedClasses
      );

      // Process recent activity
      const processedRecentActivity =
        this.processRecentActivity(recentActivity);

      const dashboardStats: MemberDashboardStats = {
        subscription: subscriptionSummary,
        checkInStats,
        recommendedClasses: processedRecommendedClasses,
        upcomingBookedClasses: processedBookedClasses,
        recentActivity: processedRecentActivity,
      };

      // Cache the result for future requests
      await this.setCachedDashboard(userId, dashboardStats);

      return dashboardStats;
    } catch (error) {
      if (error instanceof MemberDashboardServiceError) {
        throw error;
      }
      throw new MemberDashboardServiceError(
        "Failed to fetch member dashboard statistics",
        "INTERNAL"
      );
    }
  }

  /**
   * Process subscription into summary format
   */
  private static processSubscriptionSummary(
    subscription: any
  ): SubscriptionSummary | null {
    if (!subscription) {
      return null;
    }

    const now = new Date();
    const endDate = subscription.endDate
      ? new Date(subscription.endDate)
      : null;
    const daysRemaining = endDate
      ? Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        )
      : 0;

    return {
      id: subscription.id,
      planName: subscription.membershipPlan?.name || "Unknown Plan",
      status: subscription.status,
      startDate: subscription.startDate?.toISOString() || null,
      endDate: subscription.endDate?.toISOString() || null,
      daysRemaining,
      features: subscription.membershipPlan?.features || [],
      maxCheckInsPerDay: subscription.membershipPlan?.maxCheckInsPerDay || 1,
    };
  }

  /**
   * Process recommended classes
   */
  private static processRecommendedClasses(classes: any[]): RecommendedClass[] {
    return classes.map((gymClass) => {
      const availableSlots = gymClass.capacity - gymClass.bookedCount;
      return {
        id: gymClass.id,
        name: gymClass.name,
        description: gymClass.description,
        type: gymClass.type,
        schedule: gymClass.schedule.toISOString(),
        duration: gymClass.duration,
        capacity: gymClass.capacity,
        bookedCount: gymClass.bookedCount,
        availableSlots,
        trainer: {
          id: gymClass.trainer.id,
          name: gymClass.trainer.name,
          specialization: gymClass.trainer.specialization || [],
        },
        isBookable: availableSlots > 0,
      };
    });
  }

  /**
   * Process booked classes
   */
  private static processBookedClasses(bookings: any[]): BookedClass[] {
    return bookings.map((booking) => ({
      id: booking.gymClass.id,
      bookingId: booking.id,
      name: booking.gymClass.name,
      type: booking.gymClass.type,
      schedule: booking.gymClass.schedule.toISOString(),
      duration: booking.gymClass.duration,
      status: booking.gymClass.status,
      trainer: {
        id: booking.gymClass.trainer.id,
        name: booking.gymClass.trainer.name,
      },
    }));
  }

  /**
   * Process recent check-in activity
   */
  private static processRecentActivity(checkIns: any[]): RecentCheckIn[] {
    return checkIns.map((checkIn) => ({
      id: checkIn.id,
      checkInTime: checkIn.checkInTime.toISOString(),
      checkOutTime: checkIn.checkOutTime?.toISOString() || null,
      duration: checkIn.duration,
    }));
  }
}
