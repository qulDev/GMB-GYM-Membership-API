import { Request, Response, NextFunction } from "express";
import { AuthController } from "../auth.controller";
import { AuthService, AuthServiceError } from "../../services/auth.service";
import { ResponseHelper } from "../../utils/response.helper";

jest.mock("../../services/auth.service");

describe("AuthController", () => {
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
      headers: {},
    };
    jest.clearAllMocks();
    // Reset and spy on ResponseHelper methods
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "message");
    jest.spyOn(ResponseHelper, "validationError");
    jest.spyOn(ResponseHelper, "unauthorized");
    jest.spyOn(ResponseHelper, "forbidden");
    jest.spyOn(ResponseHelper, "notFound");
    jest.spyOn(ResponseHelper, "conflict");
    jest.spyOn(ResponseHelper, "internalError");
  });

  describe("register", () => {
    const validRegisterData = {
      email: "test@example.com",
      password: "TestPassword123!",
      fullName: "Test User",
      phone: "+1234567890",
      dateOfBirth: "1990-01-01",
      gender: "male" as const,
    };

    it("should register user successfully", async () => {
      mockRequest.body = validRegisterData;

      const mockAuthResponse = {
        user: {
          id: "user123",
          email: "test@example.com",
          fullName: "Test User",
          phone: "+1234567890",
          role: "USER" as const,
          status: "ACTIVE" as const,
        },
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 900,
        },
      };

      (AuthService.register as jest.Mock).mockResolvedValue(mockAuthResponse);
      (ResponseHelper.success as jest.Mock).mockReturnValue(
        mockResponse as Response
      );

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.register).toHaveBeenCalledWith(validRegisterData);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockAuthResponse,
        201
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        email: "invalid-email",
        password: "short",
      };

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Validation should fail and trigger validationError response
      expect(ResponseHelper.validationError).toHaveBeenCalled();
      expect(AuthService.register).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle CONFLICT error", async () => {
      mockRequest.body = validRegisterData;

      const error = new AuthServiceError(
        "User with this email already exists",
        "CONFLICT"
      );

      (AuthService.register as jest.Mock).mockRejectedValue(error);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.conflict).toHaveBeenCalledWith(
        mockResponse,
        error.message
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle BAD_REQUEST error", async () => {
      mockRequest.body = validRegisterData;

      const error = new AuthServiceError("Invalid input", "BAD_REQUEST");

      (AuthService.register as jest.Mock).mockRejectedValue(error);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "BAD_REQUEST",
        error.message,
        400
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should pass unknown errors to next middleware", async () => {
      mockRequest.body = validRegisterData;

      const error = new Error("Unexpected error");

      (AuthService.register as jest.Mock).mockRejectedValue(error);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "TestPassword123!",
    };

    it("should login user successfully", async () => {
      mockRequest.body = validLoginData;

      const mockAuthResponse = {
        user: {
          id: "user123",
          email: "test@example.com",
          fullName: "Test User",
          role: "USER" as const,
          status: "ACTIVE" as const,
        },
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 900,
        },
      };

      (AuthService.login as jest.Mock).mockResolvedValue(mockAuthResponse);
      (ResponseHelper.success as jest.Mock).mockReturnValue(
        mockResponse as Response
      );

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.login).toHaveBeenCalledWith(validLoginData);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockAuthResponse,
        200
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        email: "invalid-email",
      };

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
      expect(AuthService.login).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle UNAUTHORIZED error", async () => {
      mockRequest.body = validLoginData;

      const error = new AuthServiceError("Invalid credentials", "UNAUTHORIZED");

      (AuthService.login as jest.Mock).mockRejectedValue(error);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        error.message
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    const validRefreshData = {
      refreshToken: "refresh-token",
    };

    it("should refresh token successfully", async () => {
      mockRequest.body = validRefreshData;

      const mockAuthResponse = {
        user: {
          id: "user123",
          email: "test@example.com",
          role: "USER" as const,
          status: "ACTIVE" as const,
        },
        tokens: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          expiresIn: 900,
        },
      };

      (AuthService.refreshToken as jest.Mock).mockResolvedValue(
        mockAuthResponse
      );
      (ResponseHelper.success as jest.Mock).mockReturnValue(
        mockResponse as Response
      );

      await AuthController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.refreshToken).toHaveBeenCalledWith(
        validRefreshData.refreshToken
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockAuthResponse,
        200
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {};

      await AuthController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
      expect(AuthService.refreshToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle UNAUTHORIZED error", async () => {
      mockRequest.body = validRefreshData;

      const error = new AuthServiceError(
        "Invalid refresh token",
        "UNAUTHORIZED"
      );

      (AuthService.refreshToken as jest.Mock).mockRejectedValue(error);

      await AuthController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        error.message
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle NOT_FOUND error", async () => {
      mockRequest.body = validRefreshData;

      const error = new AuthServiceError("User not found", "NOT_FOUND");

      (AuthService.refreshToken as jest.Mock).mockRejectedValue(error);

      await AuthController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        error.message
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should logout user successfully with token", async () => {
      const token = "access-token";
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);
      (ResponseHelper.message as jest.Mock).mockReturnValue(
        mockResponse as Response
      );

      await AuthController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.logout).toHaveBeenCalledWith(token);
      expect(ResponseHelper.message).toHaveBeenCalledWith(
        mockResponse,
        "Logout successful",
        200
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle logout without token", async () => {
      mockRequest.headers = {};

      (ResponseHelper.message as jest.Mock).mockReturnValue(
        mockResponse as Response
      );

      await AuthController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.logout).not.toHaveBeenCalled();
      expect(ResponseHelper.message).toHaveBeenCalledWith(
        mockResponse,
        "Logout successful",
        200
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle logout errors", async () => {
      const token = "access-token";
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const error = new Error("Logout failed");

      (AuthService.logout as jest.Mock).mockRejectedValue(error);

      await AuthController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
