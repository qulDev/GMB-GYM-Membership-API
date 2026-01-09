import { Request, Response, NextFunction } from "express";
import { LogsController } from "../logs.controller";
import { LogsService, LogsServiceError } from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => {
  const actual = jest.requireActual("../../services");
  return {
    ...actual,
    LogsService: {
      listLogs: jest.fn(),
      createLog: jest.fn(),
      getLogById: jest.fn(),
      deleteLog: jest.fn(),
    },
  };
});

describe("LogsController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: "admin123",
        email: "admin@example.com",
        role: "ADMIN",
        type: "access" as const,
      },
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Mozilla/5.0",
      },
      socket: { remoteAddress: "127.0.0.1" } as any,
    };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "validationError");
    jest.spyOn(ResponseHelper, "notFound");
    jest.spyOn(ResponseHelper, "internalError");
  });

  const mockLog = {
    id: "log123",
    userId: "user123",
    action: "USER_LOGIN",
    entity: "User",
    entityId: "user123",
    description: "User logged in",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    level: "INFO",
    createdAt: new Date(),
    user: {
      id: "user123",
      fullName: "Test User",
    },
  };

  describe("listLogs", () => {
    it("should list logs with pagination", async () => {
      mockRequest.query = { page: "1", limit: "10" };
      const mockResult = {
        logs: [mockLog],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (LogsService.listLogs as jest.Mock).mockResolvedValue(mockResult);

      await LogsController.listLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(LogsService.listLogs).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        200
      );
    });

    it("should filter logs by level", async () => {
      mockRequest.query = { level: "ERROR" };
      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      (LogsService.listLogs as jest.Mock).mockResolvedValue(mockResult);

      await LogsController.listLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(LogsService.listLogs).toHaveBeenCalledWith(
        expect.objectContaining({ level: "ERROR" })
      );
    });

    it("should filter logs by date range", async () => {
      mockRequest.query = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };
      const mockResult = {
        logs: [mockLog],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (LogsService.listLogs as jest.Mock).mockResolvedValue(mockResult);

      await LogsController.listLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(LogsService.listLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        })
      );
    });

    it("should return 400 on bad request", async () => {
      mockRequest.query = { page: "1" };
      (LogsService.listLogs as jest.Mock).mockRejectedValue(
        new LogsServiceError("Invalid date range", "BAD_REQUEST")
      );

      await LogsController.listLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        "Invalid date range",
        400
      );
    });

    it("should return validation error for invalid query", async () => {
      mockRequest.query = { level: "INVALID_LEVEL" };

      await LogsController.listLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("createLog", () => {
    const createData = {
      action: "USER_LOGIN",
      entity: "User",
      entityId: "user123",
      description: "User logged in",
      level: "INFO" as const,
    };

    it("should create log entry successfully", async () => {
      mockRequest.body = createData;
      (LogsService.createLog as jest.Mock).mockResolvedValue(mockLog);

      await LogsController.createLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(LogsService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: createData.action,
          userId: "admin123",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        })
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockLog,
        201
      );
    });

    it("should call next on service error", async () => {
      mockRequest.body = createData;
      const error = new Error("Database error");
      (LogsService.createLog as jest.Mock).mockRejectedValue(error);

      await LogsController.createLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Service errors are handled differently
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 500 on internal error", async () => {
      mockRequest.body = createData;
      (LogsService.createLog as jest.Mock).mockRejectedValue(
        new LogsServiceError("Failed to create log", "INTERNAL")
      );

      await LogsController.createLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Failed to create log"
      );
    });
  });

  describe("getLogById", () => {
    it("should get log by ID successfully", async () => {
      mockRequest.params = { logId: "log123" };
      (LogsService.getLogById as jest.Mock).mockResolvedValue(mockLog);

      await LogsController.getLogById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(LogsService.getLogById).toHaveBeenCalledWith("log123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockLog,
        200
      );
    });

    it("should return 404 when log not found", async () => {
      mockRequest.params = { logId: "nonexistent" };
      (LogsService.getLogById as jest.Mock).mockRejectedValue(
        new LogsServiceError("Log not found", "NOT_FOUND")
      );

      await LogsController.getLogById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Log not found"
      );
    });

    it("should return validation error for missing logId", async () => {
      mockRequest.params = {};

      await LogsController.getLogById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("deleteLog", () => {
    it("should delete log successfully", async () => {
      mockRequest.params = { logId: "log123" };
      (LogsService.deleteLog as jest.Mock).mockResolvedValue(undefined);

      await LogsController.deleteLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(LogsService.deleteLog).toHaveBeenCalledWith("log123");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should return 404 when log not found", async () => {
      mockRequest.params = { logId: "nonexistent" };
      (LogsService.deleteLog as jest.Mock).mockRejectedValue(
        new LogsServiceError("Log not found", "NOT_FOUND")
      );

      await LogsController.deleteLog(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Log not found"
      );
    });
  });
});
