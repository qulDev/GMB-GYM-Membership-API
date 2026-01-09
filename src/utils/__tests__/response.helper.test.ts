import { ResponseHelper } from "../response.helper";
import { Response } from "express";

describe("ResponseHelper", () => {
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("success", () => {
    it("should send success response with data", () => {
      const data = { id: "123", name: "Test" };
      const code = 200;

      ResponseHelper.success(mockResponse as Response, data, code);

      expect(statusMock).toHaveBeenCalledWith(code);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "success",
        code,
        data,
      });
    });

    it("should use default status code 200", () => {
      const data = { id: "123" };

      ResponseHelper.success(mockResponse as Response, data);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("error", () => {
    it("should send error response", () => {
      const error = "ERROR_CODE";
      const message = "Error message";
      const code = 400;
      const details = [{ field: "email", message: "Invalid email" }];

      ResponseHelper.error(mockResponse as Response, error, message, code, details);

      expect(statusMock).toHaveBeenCalledWith(code);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code,
        data: {
          error,
          message,
          details,
        },
      });
    });

    it("should use default status code 400", () => {
      const error = "ERROR_CODE";
      const message = "Error message";

      ResponseHelper.error(mockResponse as Response, error, message);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("message", () => {
    it("should send message response", () => {
      const message = "Operation successful";
      const code = 200;

      ResponseHelper.message(mockResponse as Response, message, code);

      expect(statusMock).toHaveBeenCalledWith(code);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "success",
        code,
        data: { message },
      });
    });

    it("should use default status code 200", () => {
      const message = "Operation successful";

      ResponseHelper.message(mockResponse as Response, message);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("validationError", () => {
    it("should send validation error response", () => {
      const details = [
        { field: "email", message: "Invalid email" },
        { field: "password", message: "Password too short" },
      ];

      ResponseHelper.validationError(mockResponse as Response, details);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 400,
        data: {
          error: "VALIDATION_ERROR",
          message: "Validation failed",
          details,
        },
      });
    });
  });

  describe("unauthorized", () => {
    it("should send unauthorized response with default message", () => {
      ResponseHelper.unauthorized(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 401,
        data: {
          error: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      });
    });

    it("should send unauthorized response with custom message", () => {
      const message = "Invalid token";

      ResponseHelper.unauthorized(mockResponse as Response, message);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 401,
        data: {
          error: "UNAUTHORIZED",
          message,
        },
      });
    });
  });

  describe("forbidden", () => {
    it("should send forbidden response", () => {
      const message = "Access denied";

      ResponseHelper.forbidden(mockResponse as Response, message);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 403,
        data: {
          error: "FORBIDDEN",
          message,
        },
      });
    });
  });

  describe("notFound", () => {
    it("should send not found response with default message", () => {
      ResponseHelper.notFound(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 404,
        data: {
          error: "NOT_FOUND",
          message: "Resource not found",
        },
      });
    });

    it("should send not found response with custom message", () => {
      const message = "User not found";

      ResponseHelper.notFound(mockResponse as Response, message);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 404,
        data: {
          error: "NOT_FOUND",
          message,
        },
      });
    });
  });

  describe("conflict", () => {
    it("should send conflict response", () => {
      const message = "Email already exists";

      ResponseHelper.conflict(mockResponse as Response, message);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 409,
        data: {
          error: "CONFLICT",
          message,
        },
      });
    });
  });

  describe("internalError", () => {
    it("should send internal error response with default message", () => {
      ResponseHelper.internalError(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 500,
        data: {
          error: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    });

    it("should send internal error response with custom message", () => {
      const message = "Database connection failed";

      ResponseHelper.internalError(mockResponse as Response, message);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        status: "error",
        code: 500,
        data: {
          error: "INTERNAL_SERVER_ERROR",
          message,
        },
      });
    });
  });
});
