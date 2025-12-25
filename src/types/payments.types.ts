import { PaymentStatus } from "../generated/prisma";


// Input ketika user mau bayar membership
export interface CreatePaymentInput {
  subscriptionId: string;
}


// Response ketika berhasil create payment (Snap)
export interface CreatePaymentResponse {
  paymentId: string;
  snapToken: string;
  redirectUrl: string;
}


// Query admin untuk filter payment
export interface PaymentQuery {
  status?: PaymentStatus;
  userId?: string;
  subscriptionId?: string;
}


// Webhook Midtrans payload (minimal)
export interface MidtransWebhookPayload {
  order_id: string;
  transaction_status:
    | "pending"
    | "settlement"
    | "capture"
    | "deny"
    | "cancel"
    | "expire";
  transaction_id?: string;
  fraud_status?: string;
  payment_type?: string;
}
