import { z } from "zod";

// Midtrans Webhook Schema
export const midtransWebhookSchema = z.object({
    order_id: z.string(),
    transaction_status: z.enum(["settlement", "pending", "expire", "cancel", "deny"]),
    transaction_id: z.string().optional(),
  });
  