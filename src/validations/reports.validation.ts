import { z } from "zod";

/**
 * Revenue report query validation
 * Both startDate and endDate are required
 */
export const revenueQuerySchema = z.object({
  startDate: z
    .string()
    .min(1, "Start date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .min(1, "End date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
});

/**
 * Attendance report query validation
 * Both startDate and endDate are optional
 */
export const attendanceQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
});

export type RevenueQueryInput = z.infer<typeof revenueQuerySchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
