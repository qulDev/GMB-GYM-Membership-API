import { LogsRepository } from "../models";
import { LogLevel, Prisma } from "../generated/prisma";
import {
  CreateLogInput,
  LogListQuery,
  LogListResponse,
  LogEntity,
} from "../types";

export class LogsServiceError extends Error {
  constructor(
    message: string,
    public code: "BAD_REQUEST" | "NOT_FOUND" | "INTERNAL"
  ) {
    super(message);
    this.name = "LogsServiceError";
  }
}

export class LogsService {
  /**
   * Create a new log entry
   */
  static async createLog(input: CreateLogInput): Promise<LogEntity> {
    try {
      // Map level to enum
      let level: LogLevel | undefined;
      if (input.level) {
        level = input.level as LogLevel;
      }

      const log = await LogsRepository.create({
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        description: input.description,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        level,
      });

      return log as LogEntity;
    } catch (error) {
      throw new LogsServiceError("Failed to create log entry", "INTERNAL");
    }
  }

  /**
   * Get log by ID
   */
  static async getLogById(logId: string): Promise<LogEntity> {
    const log = await LogsRepository.findById(logId);

    if (!log) {
      throw new LogsServiceError("Log not found", "NOT_FOUND");
    }

    return log as LogEntity;
  }

  /**
   * List logs with pagination and filters
   */
  static async listLogs(query: LogListQuery): Promise<LogListResponse> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;

      // Map level to enum
      let level: LogLevel | undefined;
      if (query.level) {
        level = query.level as LogLevel;
      }

      // Parse dates
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (query.startDate) {
        startDate = new Date(query.startDate);
        startDate.setHours(0, 0, 0, 0);
      }

      if (query.endDate) {
        endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
      }

      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        throw new LogsServiceError(
          "Start date must be before end date",
          "BAD_REQUEST"
        );
      }

      const { logs, total } = await LogsRepository.findMany({
        page,
        limit,
        level,
        action: query.action,
        userId: query.userId,
        startDate,
        endDate,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        logs: logs as LogEntity[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof LogsServiceError) {
        throw error;
      }
      throw new LogsServiceError("Failed to fetch logs", "INTERNAL");
    }
  }

  /**
   * Delete log by ID
   */
  static async deleteLog(logId: string): Promise<void> {
    // Check if log exists
    const log = await LogsRepository.findById(logId);

    if (!log) {
      throw new LogsServiceError("Log not found", "NOT_FOUND");
    }

    await LogsRepository.delete(logId);
  }

  /**
   * Utility method to log system actions
   * Can be called from other services/controllers
   */
  static async logAction(
    action: string,
    options?: {
      userId?: string;
      entity?: string;
      entityId?: string;
      description?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
      level?: "INFO" | "WARNING" | "ERROR" | "DEBUG";
    }
  ): Promise<void> {
    try {
      await LogsRepository.create({
        action,
        userId: options?.userId,
        entity: options?.entity,
        entityId: options?.entityId,
        description: options?.description,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        metadata: options?.metadata as Prisma.InputJsonValue | undefined,
        level: options?.level as LogLevel,
      });
    } catch (error) {
      // Silently fail to not disrupt main operations
      console.error("Failed to create log entry:", error);
    }
  }
}
