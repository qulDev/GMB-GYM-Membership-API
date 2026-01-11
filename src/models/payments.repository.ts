import { prisma } from "../config/database.config";
import { Prisma } from "../generated/prisma";

export class PaymentRepository {
  static create(data: {
    userId: string;
    subscriptionId: string;
    amount: Prisma.Decimal;
    midtransOrderId: string;
  }) {
    return prisma.payment.create({ data });
  }

  static findByOrderId(orderId: string) {
    return prisma.payment.findUnique({ where: { midtransOrderId: orderId } });
  }

  static markPaid(id: string, trxId: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: "SUCCESS",
        midtransTransactionId: trxId,
        paidAt: new Date(),
      },
    });
  }

  static markFailed(id: string) {
    return prisma.payment.update({
      where: { id },
      data: { status: "FAILED" },
    });
  }

  static findByUser(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static findById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  }

  /**
   * Find payment by ID and User ID for ownership validation
   * Returns null if payment doesn't exist or doesn't belong to user
   */
  static findByIdAndUser(id: string, userId: string) {
    return prisma.payment.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subscription: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });
  }
}
