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
      midtransOrderId: orderId, // Include for easy webhook testing
    };
  }

  // Webhook
  static async handleNotification(n: any) {
    console.log("=== PaymentService.handleNotification ===");
    console.log("Looking for payment with order_id:", n.order_id);

    const payment = await PaymentRepository.findByOrderId(n.order_id);
    if (!payment) {
      console.log("Payment not found for order_id:", n.order_id);
      return;
    }

    console.log(
      "Found payment:",
      payment.id,
      "Current status:",
      payment.status
    );

    const transactionStatus = n.transaction_status;
    const fraudStatus = n.fraud_status;

    // Handle successful payment scenarios
    // - "capture" is for credit card with fraud_status "accept"
    // - "settlement" is for most other payment methods
    if (
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept")
    ) {
      console.log("=== PAYMENT SUCCESS - Activating subscription ===");

      // 1. Mark payment PAID
      await PaymentRepository.markPaid(payment.id, n.transaction_id);
      console.log("Payment marked as PAID");

      // 2. Get subscription
      const sub = await SubscriptionRepository.findById(payment.subscriptionId);
      if (!sub) {
        console.log("Subscription not found:", payment.subscriptionId);
        return;
      }

      console.log(
        "Found subscription:",
        sub.id,
        "Plan duration:",
        sub.membershipPlan.duration,
        "days"
      );

      // 3. Hitung masa aktif dari plan
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + sub.membershipPlan.duration);

      console.log(
        "Activating from:",
        start.toISOString(),
        "to:",
        end.toISOString()
      );

      // 4. Activate subscription
      await SubscriptionRepository.update(sub.id, {
        status: "ACTIVE",
        startDate: start,
        endDate: end,
      });

      console.log("=== SUBSCRIPTION ACTIVATED SUCCESSFULLY ===");
    }

    // Handle pending status (for async payment methods like bank transfer)
    if (transactionStatus === "pending") {
      console.log("=== PAYMENT PENDING ===");
      // Payment is still pending, no action needed
      // The subscription will be activated when we receive settlement notification
    }

    // Handle failed/denied/expired/cancelled
    if (["deny", "cancel", "expire", "failure"].includes(transactionStatus)) {
      console.log("=== PAYMENT FAILED - Status:", transactionStatus, "===");
      await PaymentRepository.markFailed(payment.id);
      console.log("Payment marked as FAILED");
    }

    // Handle capture with fraud challenge
    if (transactionStatus === "capture" && fraudStatus === "challenge") {
      console.log("=== PAYMENT FRAUD CHALLENGE - Manual review needed ===");
      // You might want to mark this as "PROCESSING" or handle differently
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
