import { ClassStatus } from "../generated/prisma";

export interface CreateGymClassInput {
  name: string;
  description?: string;
  trainerId: string;
  schedule: string;
  duration: number;
  capacity: number;
  type?: string;
}

export interface UpdateGymClassInput {
  name?: string;
  description?: string;
  schedule?: string;
  duration?: number;
  capacity?: number;
  status?: ClassStatus;
  type?: string;
}

export interface GymClassQuery {
  status?: ClassStatus;
  trainerId?: string;
  type?: string;
  search?: string;
}
