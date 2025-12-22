import { Request, Response, NextFunction } from "express";
import { AuthService, AuthServiceError } from "../services";
import { ResponseHelper } from "../utils";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validations";
import * as z from "zod";

// Helper function to format Zod errors
const formatZodErrors = (
  error: z.ZodError
): Array<{ field: string; message: string }> => {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
};

export class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Call service
      const result = await AuthService.register(validatedData);

      // Return success response
      ResponseHelper.success(res, result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof AuthServiceError) {
        switch (error.code) {
          case "CONFLICT":
            ResponseHelper.conflict(res, error.message);
            break;
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Call service
      const result = await AuthService.login(validatedData);

      // Return success response
      ResponseHelper.success(res, result, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof AuthServiceError) {
        switch (error.code) {
          case "UNAUTHORIZED":
            ResponseHelper.unauthorized(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * Refresh token
   * POST /api/v1/auth/refresh
   */
  static async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = refreshTokenSchema.parse(req.body);

      // Call service
      const result = await AuthService.refreshToken(validatedData.refreshToken);

      // Return success response
      ResponseHelper.success(res, result, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof AuthServiceError) {
        switch (error.code) {
          case "UNAUTHORIZED":
            ResponseHelper.unauthorized(res, error.message);
            break;
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];

      if (token) {
        await AuthService.logout(token);
      }

      // Return success response
      ResponseHelper.message(res, "Logout successful", 200);
    } catch (error) {
      next(error);
    }
  }
}
