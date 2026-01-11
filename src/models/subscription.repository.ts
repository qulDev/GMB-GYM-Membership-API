import { prisma } from "../config/database.config";
import { SubscriptionStatus } from "../generated/prisma";

export class SubscriptionRepository {
  static create(data: {
    userId: string;
    membershipPlanId: string;
    startDate?: Date;
    endDate?: Date;
    status?: any;
  }) {
    return prisma.subscription.create({ data });
  }

  static findActiveByUser(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        membershipPlan: true,
      },
    });
  }

  static findById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        membershipPlan: true,
        user: true,
      },
    });
  }

  static findMany(where: any) {
    return prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        membershipPlan: true,
        user: true,
      },
    });
  }

  static update(id: string, data: any) {
    return prisma.subscription.update({
      where: { id },
      data,
    });
  }

  /**
   * Find all expired subscriptions (ACTIVE but past endDate)
   */
  static findExpired() {
    return prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        membershipPlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find subscriptions expiring within specified days
   */
  static findExpiringSoon(days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        membershipPlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    });
  }

  /**
   * Bulk expire subscriptions by IDs
   */
  static expireMany(ids: string[]) {
    return prisma.subscription.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });
  }

  /**
   * Expire a single subscription
   */
  static expire(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  static activate(id: string) {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1); // default 1 bulan

    return prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startDate: start,
        endDate: end,
      },
    });
  }

  static cancel(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }

  /**
   * Find subscription by ID and User ID for ownership validation
   * Returns null if subscription doesn't exist or doesn't belong to user
   */
  static findByIdAndUser(id: string, userId: string) {
    return prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        membershipPlan: true,
      },
    });
  }
}
