import { LogsRepository, LogQueryParams } from "../logs.repository";
import { prisma } from "../../config/database.config";
import { LogLevel } from "../../generated/prisma";

jest.mock("../../config/database.config", () => ({
  prisma: {
    log: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe("LogsRepository", () => {
  const mockUser = {
    id: "user123",
    fullName: "Test User",
    email: "test@example.com",
  };

  const mockLog = {
    id: "log123",
    userId: "user123",
    action: "USER_LOGIN",
    entity: "User",
    entityId: "user123",
    description: "User logged in successfully",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    metadata: { browser: "Chrome" },
    level: "INFO" as LogLevel,
    createdAt: new Date("2024-01-15T10:00:00Z"),
  };

  const mockLogWithUser = {
    ...mockLog,
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new log entry with all fields", async () => {
      const logData = {
        userId: "user123",
        action: "USER_LOGIN",
        entity: "User",
        entityId: "user123",
        description: "User logged in successfully",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        metadata: { browser: "Chrome" },
        level: "INFO" as LogLevel,
      };
      (prisma.log.create as jest.Mock).mockResolvedValue(mockLogWithUser);

      const result = await LogsRepository.create(logData);

      expect(result).toEqual(mockLogWithUser);
      expect(prisma.log.create).toHaveBeenCalledWith({
        data: {
          userId: logData.userId,
          action: logData.action,
          entity: logData.entity,
          entityId: logData.entityId,
          description: logData.description,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          metadata: logData.metadata,
          level: logData.level,
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
    });

    it("should create log with default INFO level if not provided", async () => {
      const logData = {
        action: "SYSTEM_EVENT",
        description: "System event occurred",
      };
      (prisma.log.create as jest.Mock).mockResolvedValue(mockLogWithUser);

      await LogsRepository.create(logData);

      expect(prisma.log.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          action: logData.action,
          entity: undefined,
          entityId: undefined,
          description: logData.description,
          ipAddress: undefined,
          userAgent: undefined,
          metadata: undefined,
          level: "INFO",
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
    });
  });

  describe("findById", () => {
    it("should find log by ID with user info", async () => {
      const logId = "log123";
      (prisma.log.findUnique as jest.Mock).mockResolvedValue(mockLogWithUser);

      const result = await LogsRepository.findById(logId);

      expect(result).toEqual(mockLogWithUser);
      expect(prisma.log.findUnique).toHaveBeenCalledWith({
        where: { id: logId },
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
    });

    it("should return null if log not found", async () => {
      const logId = "nonexistent";
      (prisma.log.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await LogsRepository.findById(logId);

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should find logs with pagination", async () => {
      const params: LogQueryParams = { page: 1, limit: 10 };
      (prisma.log.findMany as jest.Mock).mockResolvedValue([mockLogWithUser]);
      (prisma.log.count as jest.Mock).mockResolvedValue(1);

      const result = await LogsRepository.findMany(params);

      expect(result.logs).toEqual([mockLogWithUser]);
      expect(result.total).toBe(1);
      expect(prisma.log.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
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
    });

    it("should find logs with level filter", async () => {
      const params: LogQueryParams = {
        page: 1,
        limit: 10,
        level: "ERROR" as LogLevel,
      };
      (prisma.log.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.log.count as jest.Mock).mockResolvedValue(0);

      const result = await LogsRepository.findMany(params);

      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
      expect(prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { level: "ERROR" },
        })
      );
    });

    it("should find logs with action filter", async () => {
      const params: LogQueryParams = { page: 1, limit: 10, action: "LOGIN" };
      (prisma.log.findMany as jest.Mock).mockResolvedValue([mockLogWithUser]);
      (prisma.log.count as jest.Mock).mockResolvedValue(1);

      await LogsRepository.findMany(params);

      expect(prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            action: {
              contains: "LOGIN",
              mode: "insensitive",
            },
          },
        })
      );
    });

    it("should find logs with userId filter", async () => {
      const params: LogQueryParams = { page: 1, limit: 10, userId: "user123" };
      (prisma.log.findMany as jest.Mock).mockResolvedValue([mockLogWithUser]);
      (prisma.log.count as jest.Mock).mockResolvedValue(1);

      await LogsRepository.findMany(params);

      expect(prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user123" },
        })
      );
    });

    it("should find logs with date range filter", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const params: LogQueryParams = { page: 1, limit: 10, startDate, endDate };
      (prisma.log.findMany as jest.Mock).mockResolvedValue([mockLogWithUser]);
      (prisma.log.count as jest.Mock).mockResolvedValue(1);

      await LogsRepository.findMany(params);

      expect(prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it("should calculate correct skip for pagination", async () => {
      const params: LogQueryParams = { page: 3, limit: 10 };
      (prisma.log.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.log.count as jest.Mock).mockResolvedValue(0);

      await LogsRepository.findMany(params);

      expect(prisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      );
    });
  });

  describe("delete", () => {
    it("should delete log by ID", async () => {
      const logId = "log123";
      (prisma.log.delete as jest.Mock).mockResolvedValue(mockLog);

      const result = await LogsRepository.delete(logId);

      expect(result).toEqual(mockLog);
      expect(prisma.log.delete).toHaveBeenCalledWith({
        where: { id: logId },
      });
    });
  });

  describe("deleteOlderThan", () => {
    it("should delete logs older than specified date", async () => {
      const date = new Date("2024-01-01");
      const deleteResult = { count: 5 };
      (prisma.log.deleteMany as jest.Mock).mockResolvedValue(deleteResult);

      const result = await LogsRepository.deleteOlderThan(date);

      expect(result).toEqual(deleteResult);
      expect(prisma.log.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: date,
          },
        },
      });
    });
  });
});
