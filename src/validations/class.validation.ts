import * as z from "zod";
import { ClassStatus } from "../generated/prisma";

export const gymClassIdParamSchema = z.object({
  id: z.string().cuid("Invalid class id"),
});

export const createGymClassSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().max(255).optional(),
  trainerId: z.string().cuid("Invalid trainer id"),
  schedule: z.string().datetime("Invalid ISO datetime"),
  duration: z.number().int().min(10, "Minimum duration is 10 minutes"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  type: z.string().max(50).optional(),
});

export const updateGymClassSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().max(255).optional(),
  schedule: z.string().datetime().optional(),
  duration: z.number().int().min(10).optional(),
  capacity: z.number().int().min(1).optional(),
  type: z.string().max(50).optional(),
  status: z.nativeEnum(ClassStatus).optional(),
});

export const gymClassQuerySchema = z.object({
  status: z.nativeEnum(ClassStatus).optional(),
  trainerId: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
});
