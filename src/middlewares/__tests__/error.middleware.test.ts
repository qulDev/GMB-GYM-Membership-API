import { Request, Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "../error.middleware";
import { ResponseHelper } from "../../utils/response.helper";

jest.mock("../../utils/response.helper");

describe("Error Middleware", () => {
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
      method: "GET",
      path: "/api/v1/test",
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe("errorHandler", () => {
    it("should handle error and return internal server error", () => {
      const error = new Error("Test error");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(console.error).toHaveBeenCalledWith("Error:", error);
      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse as Response,
        "An unexpected error occurred"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle different error types", () => {
      const error = new TypeError("Type error");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(console.error).toHaveBeenCalledWith("Error:", error);
      expect(ResponseHelper.internalError).toHaveBeenCalled();
    });
  });

  describe("notFoundHandler", () => {
    it("should return not found response with route information", () => {
      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse as Response,
        `Route ${mockRequest.method} ${mockRequest.path} not found`
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle different HTTP methods", () => {
      mockRequest = {
        method: "POST",
        path: "/api/v1/users",
      };

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse as Response,
        "Route POST /api/v1/users not found"
      );
    });
  });
});
