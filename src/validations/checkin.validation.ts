import { z } from "zod";

export const checkInHistoryQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const checkOutParamsSchema = z.object({
  checkInId: z.string().min(1, "Check-in ID is required"),
});
