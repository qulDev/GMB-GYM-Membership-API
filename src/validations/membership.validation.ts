import { z } from "zod";

// Create Membership Plan Schema
export const createMembershipPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),

  duration: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 day"),

  price: z
    .number()
    .positive("Price must be greater than 0"),

  features: z
    .array(
      z
        .string()
        .min(1, "Feature must not be empty")
        .max(100, "Feature must not exceed 100 characters")
        .trim()
    )
    .min(1, "At least one feature is required"),

  maxCheckInsPerDay: z
    .number()
    .int("Max check-ins per day must be an integer")
    .min(1, "Max check-ins per day must be at least 1")
    .default(1)
    .optional(),

  isActive: z.boolean().default(true).optional(),
});

// membership plan update schema
export const updateMembershipPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),

  duration: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 day")
    .optional(),

  price: z
    .number()
    .positive("Price must be greater than 0")
    .optional(),

  features: z
    .array(
      z
        .string()
        .min(1, "Feature must not be empty")
        .max(100, "Feature must not exceed 100 characters")
        .trim()
    )
    .optional(),

  maxCheckInsPerDay: z
    .number()
    .int("Max check-ins per day must be an integer")
    .min(1, "Max check-ins per day must be at least 1")
    .optional(),

  isActive: z.boolean().optional(),
});

// membership plan query schema
export const membershipPlanQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),

  minPrice: z.coerce
    .number()
    .positive("Min price must be greater than 0")
    .optional(),

  maxPrice: z.coerce
    .number()
    .positive("Max price must be greater than 0")
    .optional(),

  duration: z.coerce
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 day")
    .optional(),
});

// membership plan ID param schema
export const membershipPlanIdParamSchema = z.object({
  id: z
    .string({ error: "Membership Plan ID is required" })
    .min(1, "Membership Plan ID is required"),
});

export type CreateMembershipPlanSchemaType =
  z.infer<typeof createMembershipPlanSchema>;

export type UpdateMembershipPlanSchemaType =
  z.infer<typeof updateMembershipPlanSchema>;

export type MembershipPlanQuerySchemaType =
  z.infer<typeof membershipPlanQuerySchema>;

export type MembershipPlanIdParamSchemaType =
  z.infer<typeof membershipPlanIdParamSchema>;
