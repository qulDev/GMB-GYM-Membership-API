import { prisma } from "../config/database.config";
import { LogLevel, Prisma } from "../generated/prisma";

export interface LogQueryParams {
  page: number;
  limit: number;
  level?: LogLevel;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class LogsRepository {
  /**
   * Create a new log entry
   */
  static async create(data: {
    userId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Prisma.InputJsonValue;
    level?: LogLevel;
  }) {
    return prisma.log.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        level: data.level || "INFO",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find log by ID
   */
  static async findById(id: string) {
    return prisma.log.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find many logs with pagination and filters
   */
  static async findMany(params: LogQueryParams) {
    const { page, limit, level, action, userId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.LogWhereInput = {};

    if (level) {
      where.level = level;
    }

    if (action) {
      where.action = {
        contains: action,
        mode: "insensitive",
      };
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Get logs and total count in parallel
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.log.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Delete log by ID
   */
  static async delete(id: string) {
    return prisma.log.delete({
      where: { id },
    });
  }

  /**
   * Delete old logs (utility method for cleanup)
   */
  static async deleteOlderThan(date: Date) {
    return prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  }
}
