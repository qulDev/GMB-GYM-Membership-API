import { SubscriptionRepository, MembershipPlanRepository } from "../models";
import { SubscriptionStatus } from "../generated/prisma";

export class SubscriptionService {
  static async createSubscription(userId: string, membershipPlanId: string) {
    // cek plan
    const plan = await MembershipPlanRepository.findById(membershipPlanId);
    if (!plan || !plan.isActive) {
      throw new Error("Membership plan not available");
    }

    // cek subscription aktif
    const activeSub = await SubscriptionRepository.findActiveByUser(userId);
    if (activeSub) {
      throw new Error("You already have an active subscription");
    }

    return SubscriptionRepository.create({
      userId,
      membershipPlanId,
      status: "PENDING",
    });
  }

  static async getCurrentSubscription(userId: string) {
    return SubscriptionRepository.findActiveByUser(userId);
  }

  static async getAllSubscriptions(query: any) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    return SubscriptionRepository.findMany(where);
  }

  static async activateSubscription(id: string) {
    const subscription = await SubscriptionRepository.findById(id);
    if (!subscription) throw new Error("Subscription not found");

    const duration = subscription.membershipPlan.duration;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    return SubscriptionRepository.update(id, {
      status: "ACTIVE",
      startDate,
      endDate,
    });
  }

  static async cancelSubscription(id: string) {
    const sub = await SubscriptionRepository.findById(id);
  
    if (!sub) {
      throw new Error("Subscription not found");
    }
  
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new Error("Subscription already canceled");
    }
  
    return SubscriptionRepository.update(id, {
      status: SubscriptionStatus.CANCELLED,
    });
  }
  
}
