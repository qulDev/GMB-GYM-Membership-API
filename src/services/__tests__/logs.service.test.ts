import { LogsService } from "../logs.service";
import { LogsRepository } from "../../models";
import { LogLevel } from "../../generated/prisma";

jest.mock("../../models", () => ({
  LogsRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("LogsService", () => {
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
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createLog", () => {
    it("should create log entry successfully", async () => {
      const createInput = {
        userId: "user123",
        action: "USER_LOGIN",
        entity: "User",
        entityId: "user123",
        description: "User logged in successfully",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        metadata: { browser: "Chrome" },
        level: "INFO" as const,
      };

      (LogsRepository.create as jest.Mock).mockResolvedValue(mockLog);

      const result = await LogsService.createLog(createInput);

      expect(result).toEqual(mockLog);
      expect(LogsRepository.create).toHaveBeenCalledWith({
        userId: createInput.userId,
        action: createInput.action,
        entity: createInput.entity,
        entityId: createInput.entityId,
        description: createInput.description,
        ipAddress: createInput.ipAddress,
        userAgent: createInput.userAgent,
        metadata: createInput.metadata,
        level: createInput.level,
      });
    });

    it("should create log without optional level", async () => {
      const createInput = {
        action: "SYSTEM_EVENT",
        description: "System event occurred",
      };

      (LogsRepository.create as jest.Mock).mockResolvedValue(mockLog);

      await LogsService.createLog(createInput);

      expect(LogsRepository.create).toHaveBeenCalledWith({
        userId: undefined,
        action: createInput.action,
        entity: undefined,
        entityId: undefined,
        description: createInput.description,
        ipAddress: undefined,
        userAgent: undefined,
        metadata: undefined,
        level: undefined,
      });
    });

    it("should throw INTERNAL error on create failure", async () => {
      (LogsRepository.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        LogsService.createLog({ action: "TEST" })
      ).rejects.toMatchObject({
        message: "Failed to create log entry",
        code: "INTERNAL",
      });
    });
  });

  describe("getLogById", () => {
    it("should get log by ID successfully", async () => {
      (LogsRepository.findById as jest.Mock).mockResolvedValue(mockLog);

      const result = await LogsService.getLogById("log123");

      expect(result).toEqual(mockLog);
      expect(LogsRepository.findById).toHaveBeenCalledWith("log123");
    });

    it("should throw NOT_FOUND error if log not found", async () => {
      (LogsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(LogsService.getLogById("nonexistent")).rejects.toMatchObject(
        {
          message: "Log not found",
          code: "NOT_FOUND",
        }
      );
    });
  });

  describe("listLogs", () => {
    it("should list logs with pagination", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [mockLog],
        total: 1,
      });

      const result = await LogsService.listLogs({ page: 1, limit: 20 });

      expect(result.logs).toEqual([mockLog]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(LogsRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        level: undefined,
        action: undefined,
        userId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it("should use default pagination values", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [],
        total: 0,
      });

      await LogsService.listLogs({});

      expect(LogsRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        level: undefined,
        action: undefined,
        userId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it("should filter logs by level", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [mockLog],
        total: 1,
      });

      await LogsService.listLogs({ level: "ERROR" });

      expect(LogsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "ERROR",
        })
      );
    });

    it("should filter logs by action", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [mockLog],
        total: 1,
      });

      await LogsService.listLogs({ action: "LOGIN" });

      expect(LogsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN",
        })
      );
    });

    it("should filter logs by userId", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [mockLog],
        total: 1,
      });

      await LogsService.listLogs({ userId: "user123" });

      expect(LogsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user123",
        })
      );
    });

    it("should filter logs by date range", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [mockLog],
        total: 1,
      });

      await LogsService.listLogs({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(LogsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it("should throw BAD_REQUEST error if start date is after end date", async () => {
      await expect(
        LogsService.listLogs({
          startDate: "2024-01-31",
          endDate: "2024-01-01",
        })
      ).rejects.toMatchObject({
        message: "Start date must be before end date",
        code: "BAD_REQUEST",
      });
    });

    it("should calculate totalPages correctly", async () => {
      (LogsRepository.findMany as jest.Mock).mockResolvedValue({
        logs: [mockLog],
        total: 45,
      });

      const result = await LogsService.listLogs({ page: 1, limit: 20 });

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe("deleteLog", () => {
    it("should delete log successfully", async () => {
      (LogsRepository.findById as jest.Mock).mockResolvedValue(mockLog);
      (LogsRepository.delete as jest.Mock).mockResolvedValue(mockLog);

      await LogsService.deleteLog("log123");

      expect(LogsRepository.findById).toHaveBeenCalledWith("log123");
      expect(LogsRepository.delete).toHaveBeenCalledWith("log123");
    });

    it("should throw NOT_FOUND error if log not found", async () => {
      (LogsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(LogsService.deleteLog("nonexistent")).rejects.toMatchObject({
        message: "Log not found",
        code: "NOT_FOUND",
      });
    });
  });
});
