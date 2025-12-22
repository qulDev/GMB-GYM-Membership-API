import { UserStatus, Gender } from "../generated/prisma";

// Update Profile Input
export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  emergencyContact?: string;
}

// Admin Update User Input (can update status)
export interface AdminUpdateUserInput extends UpdateProfileInput {
  status?: "active" | "inactive" | "suspended";
}

// User List Query Parameters
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive" | "suspended";
}

// User List Response with Pagination
export interface UserListResponse {
  users: Array<{
    id: string;
    email: string;
    fullName: string;
    phone: string;
    dateOfBirth: Date | null;
    gender: Gender | null;
    address: string | null;
    emergencyContact: string | null;
    role: string;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
