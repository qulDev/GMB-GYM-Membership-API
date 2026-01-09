import { Request, Response, NextFunction } from "express";
import { authenticate, authorize, optionalAuth } from "../auth.middleware";
import { JwtHelper } from "../../utils/jwt.helper";
import { ResponseHelper } from "../../utils/response.helper";
import { UserRole } from "../../generated/prisma";

jest.mock("../../utils/jwt.helper");
jest.mock("../../utils/response.helper");

describe("Auth Middleware", () => {
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
      headers: {},
    };
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should authenticate user successfully", async () => {
      const token = "valid-token";
      const payload = {
        userId: "user123",
        email: "test@example.com",
        role: UserRole.USER,
        type: "access" as const,
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (JwtHelper.verifyAccessToken as jest.Mock).mockResolvedValue(payload);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(payload);
      expect(mockRequest.token).toBe(token);
      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHelper.unauthorized).not.toHaveBeenCalled();
    });

    it("should return unauthorized if no authorization header", async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse as Response,
        "Access token is required"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return unauthorized if authorization header doesn't start with Bearer", async () => {
      mockRequest.headers = {
        authorization: "Invalid token",
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse as Response,
        "Access token is required"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return unauthorized if token is missing", async () => {
      mockRequest.headers = {
        authorization: "Bearer ",
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse as Response,
        "Access token is required"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return unauthorized if token is invalid", async () => {
      const token = "invalid-token";
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (JwtHelper.verifyAccessToken as jest.Mock).mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse as Response,
        "Invalid or expired access token"
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it("should handle errors gracefully", async () => {
      const token = "error-token";
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const error = new Error("Verification failed");
      (JwtHelper.verifyAccessToken as jest.Mock).mockRejectedValue(error);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse as Response,
        "Authentication failed"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authorize", () => {
    it("should authorize user with correct role", () => {
      const mockPayload = {
        userId: "user123",
        email: "test@example.com",
        role: UserRole.ADMIN,
        type: "access" as const,
      };

      mockRequest.user = mockPayload;

      const middleware = authorize(UserRole.ADMIN);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHelper.unauthorized).not.toHaveBeenCalled();
      expect(ResponseHelper.forbidden).not.toHaveBeenCalled();
    });

    it("should authorize user with multiple allowed roles", () => {
      const mockPayload = {
        userId: "user123",
        email: "test@example.com",
        role: UserRole.USER,
        type: "access" as const,
      };

      mockRequest.user = mockPayload;

      const middleware = authorize(UserRole.USER, UserRole.ADMIN);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseHelper.forbidden).not.toHaveBeenCalled();
    });

    it("should return unauthorized if user not authenticated", () => {
      mockRequest.user = undefined;

      const middleware = authorize(UserRole.ADMIN);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse as Response,
        "Authentication required"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return forbidden if user role not allowed", () => {
      const mockPayload = {
        userId: "user123",
        email: "test@example.com",
        role: UserRole.USER,
        type: "access" as const,
      };

      mockRequest.user = mockPayload;

      const middleware = authorize(UserRole.ADMIN);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.forbidden).toHaveBeenCalledWith(
        mockResponse as Response,
        "You do not have permission to access this resource"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("should attach user if valid token provided", async () => {
      const token = "valid-token";
      const payload = {
        userId: "user123",
        email: "test@example.com",
        role: UserRole.USER,
        type: "access" as const,
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (JwtHelper.verifyAccessToken as jest.Mock).mockResolvedValue(payload);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(payload);
      expect(mockRequest.token).toBe(token);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should continue without user if no token provided", async () => {
      mockRequest.headers = {};

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should continue without user if token is invalid", async () => {
      const token = "invalid-token";
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (JwtHelper.verifyAccessToken as jest.Mock).mockResolvedValue(null);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle errors gracefully and continue", async () => {
      const token = "error-token";
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const error = new Error("Verification failed");
      (JwtHelper.verifyAccessToken as jest.Mock).mockRejectedValue(error);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
