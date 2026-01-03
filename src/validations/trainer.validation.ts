import { z } from "zod";

// Create Trainer Schema
export const createTrainerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),

  email: z.string().email("Invalid email format"),

  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must not exceed 20 characters")
    .optional(),

  specialization: z
    .array(
      z
        .string()
        .min(1, "Specialization must not be empty")
        .max(50, "Specialization must not exceed 50 characters")
        .trim()
    )
    .min(1, "At least one specialization is required"),

  bio: z
    .string()
    .max(1000, "Bio must not exceed 1000 characters")
    .trim()
    .optional(),

  certifications: z
    .array(
      z
        .string()
        .min(1, "Certification must not be empty")
        .max(100, "Certification must not exceed 100 characters")
        .trim()
    )
    .optional(),
});

// Update Trainer Schema
export const updateTrainerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim()
    .optional(),

  email: z.string().email("Invalid email format").optional(),

  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must not exceed 20 characters")
    .optional(),

  specialization: z
    .array(
      z
        .string()
        .min(1, "Specialization must not be empty")
        .max(50, "Specialization must not exceed 50 characters")
        .trim()
    )
    .optional(),

  bio: z
    .string()
    .max(1000, "Bio must not exceed 1000 characters")
    .trim()
    .optional(),

  certifications: z
    .array(
      z
        .string()
        .min(1, "Certification must not be empty")
        .max(100, "Certification must not exceed 100 characters")
        .trim()
    )
    .optional(),

  isActive: z.boolean().optional(),
});

// Trainer ID Param Schema
export const trainerIdParamSchema = z.object({
  trainerId: z.string().min(1, "Trainer ID is required"),
});

// Trainer Query Schema
export const trainerQuerySchema = z.object({
  search: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});
