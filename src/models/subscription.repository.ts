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
}
