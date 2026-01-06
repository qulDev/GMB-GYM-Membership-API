import { LogLevel } from "../generated/prisma";

// Log entity type
export interface LogEntity {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  level: LogLevel;
  createdAt: Date;
  user?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

// Create Log Input
export interface CreateLogInput {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  level?: "INFO" | "WARNING" | "ERROR" | "DEBUG";
}

// Log List Query Parameters
export interface LogListQuery {
  page?: number;
  limit?: number;
  level?: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// Log List Response with Pagination
export interface LogListResponse {
  logs: LogEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
