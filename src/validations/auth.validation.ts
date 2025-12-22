import { z } from "zod";

// Register Schema
export const registerSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  fullName: z
    .string({ error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),

  phone: z
    .string({ error: "Phone number is required" })
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^\+?[0-9]+$/, "Invalid phone number format"),

  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD")
    .optional(),

  gender: z.enum(["male", "female", "other"]).optional(),
});

// Login Schema
export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

// Refresh Token Schema
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ error: "Refresh token is required" })
    .min(1, "Refresh token is required"),
});

// Type exports
export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
export type RefreshTokenSchemaType = z.infer<typeof refreshTokenSchema>;
