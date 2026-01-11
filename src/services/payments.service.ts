import { snap } from "../config/midtrans.config";
import { PaymentRepository, SubscriptionRepository } from "../models";
import { Prisma } from "../generated/prisma";

export class PaymentService {
  static async createSnapPayment(userId: string, subscriptionId: string) {
    // Validate subscription ownership - user can only pay for their own subscription
    const subscription = await SubscriptionRepository.findByIdAndUser(
      subscriptionId,
      userId
    );
    if (!subscription) {
      const error = new Error("Subscription not found or access denied");
      (error as any).statusCode = 404;
      throw error;
    }

    const amount = subscription.membershipPlan.price.toNumber();
    const orderId = `GYM-${Date.now()}-${subscription.id}`;

    // Save pending payment
    const payment = await PaymentRepository.create({
      userId,
      subscriptionId,
      amount: new Prisma.Decimal(amount),
      midtransOrderId: orderId,
    });

    const snapResponse = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
    });

    return {
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
      paymentId: payment.id,
    };
  }

  // Webhook
  static async handleNotification(n: any) {
    const payment = await PaymentRepository.findByOrderId(n.order_id);
    if (!payment) return;

    if (n.transaction_status === "settlement") {
      // 1. Mark payment PAID
      await PaymentRepository.markPaid(payment.id, n.transaction_id);

      // 2. Get subscription
      const sub = await SubscriptionRepository.findById(payment.subscriptionId);
      if (!sub) return;

      // 3. Hitung masa aktif dari plan
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + sub.membershipPlan.duration);

      // 4. Activate subscription
      await SubscriptionRepository.update(sub.id, {
        status: "ACTIVE",
        startDate: start,
        endDate: end,
      });
    }

    if (["deny", "cancel", "expire"].includes(n.transaction_status)) {
      await PaymentRepository.markFailed(payment.id);
    }
  }

  static getHistory(userId: string) {
    return PaymentRepository.findByUser(userId);
  }

  /**
   * Get payment detail with ownership validation
   * User can only view their own payment details
   */
  static async getDetail(id: string, userId: string) {
    const payment = await PaymentRepository.findByIdAndUser(id, userId);

    if (!payment) {
      const error = new Error("Payment not found or access denied");
      (error as any).statusCode = 404;
      throw error;
    }

    return payment;
  }
}
