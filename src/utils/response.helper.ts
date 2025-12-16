import { Response } from "express";
import { ApiResponse, ApiError, ApiMessage } from "../types";

export class ResponseHelper {
  /**
   * Success response
   */
  static success<T>(res: Response, data: T, code: number = 200): Response {
    const response: ApiResponse<T> = {
      status: "success",
      code,
      data,
    };
    return res.status(code).json(response);
  }

  /**
   * Error response
   */
  static error(
    res: Response,
    error: string,
    message: string,
    code: number = 400,
    details?: unknown[]
  ): Response {
    const errorData: ApiError = {
      error,
      message,
      details,
    };
    const response: ApiResponse<ApiError> = {
      status: "error",
      code,
      data: errorData,
    };
    return res.status(code).json(response);
  }

  /**
   * Message response
   */
  static message(res: Response, message: string, code: number = 200): Response {
    const messageData: ApiMessage = {
      message,
    };
    const response: ApiResponse<ApiMessage> = {
      status: "success",
      code,
      data: messageData,
    };
    return res.status(code).json(response);
  }

  /**
   * Validation error response
   */
  static validationError(res: Response, details: unknown[]): Response {
    return this.error(
      res,
      "VALIDATION_ERROR",
      "Validation failed",
      400,
      details
    );
  }

  /**
   * Unauthorized response
   */
  static unauthorized(
    res: Response,
    message: string = "Unauthorized"
  ): Response {
    return this.error(res, "UNAUTHORIZED", message, 401);
  }

  /**
   * Forbidden response
   */
  static forbidden(res: Response, message: string = "Forbidden"): Response {
    return this.error(res, "FORBIDDEN", message, 403);
  }

  /**
   * Not found response
   */
  static notFound(
    res: Response,
    message: string = "Resource not found"
  ): Response {
    return this.error(res, "NOT_FOUND", message, 404);
  }

  /**
   * Conflict response
   */
  static conflict(res: Response, message: string): Response {
    return this.error(res, "CONFLICT", message, 409);
  }

  /**
   * Internal server error response
   */
  static internalError(
    res: Response,
    message: string = "Internal server error"
  ): Response {
    return this.error(res, "INTERNAL_SERVER_ERROR", message, 500);
  }
}
