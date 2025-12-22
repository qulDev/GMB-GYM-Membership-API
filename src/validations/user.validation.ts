import { z } from "zod";

// Update Profile Schema
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim()
    .optional(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^\+?[0-9]+$/, "Invalid phone number format")
    .optional(),

  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD")
    .optional(),

  gender: z.enum(["male", "female", "other"]).optional(),

  address: z
    .string()
    .max(500, "Address must not exceed 500 characters")
    .trim()
    .optional(),

  emergencyContact: z
    .string()
    .max(100, "Emergency contact must not exceed 100 characters")
    .trim()
    .optional(),
});

// Admin Update User Schema (includes status)
export const adminUpdateUserSchema = updateProfileSchema.extend({
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

// User List Query Schema
export const userListQuerySchema = z.object({
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
    .default(10),

  search: z.string().max(100, "Search query too long").optional(),

  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

// User ID Param Schema
export const userIdParamSchema = z.object({
  userId: z
    .string({ error: "User ID is required" })
    .min(1, "User ID is required"),
});

// Type exports
export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserSchemaType = z.infer<typeof adminUpdateUserSchema>;
export type UserListQuerySchemaType = z.infer<typeof userListQuerySchema>;
export type UserIdParamSchemaType = z.infer<typeof userIdParamSchema>;
