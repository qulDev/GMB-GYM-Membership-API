import { z } from "zod";

/**
 * Create log validation schema
 */
export const createLogSchema = z.object({
  action: z
    .string()
    .min(1, "Action is required")
    .max(100, "Action must not exceed 100 characters"),
  entity: z.string().max(50, "Entity must not exceed 50 characters").optional(),
  entityId: z
    .string()
    .max(100, "Entity ID must not exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  level: z.enum(["INFO", "WARNING", "ERROR", "DEBUG"]).optional(),
});

/**
 * Log list query validation schema
 */
export const logListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(20),
  level: z.enum(["INFO", "WARNING", "ERROR", "DEBUG"]).optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
});

/**
 * Log ID param validation schema
 */
export const logIdParamSchema = z.object({
  logId: z.string().min(1, "Log ID is required"),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type LogListQueryInput = z.infer<typeof logListQuerySchema>;
export type LogIdParamInput = z.infer<typeof logIdParamSchema>;
