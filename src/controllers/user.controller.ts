import { Request, Response, NextFunction } from "express";
import { UserService, UserServiceError } from "../services";
import { ResponseHelper } from "../utils";
import {
  updateProfileSchema,
  adminUpdateUserSchema,
  userListQuerySchema,
  userIdParamSchema,
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

export class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await UserService.getProfile(userId);

      ResponseHelper.success(res, user, 200);
    } catch (error) {
      if (error instanceof UserServiceError) {
        switch (error.code) {
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
   * Update current user profile
   * PUT /api/v1/users/me
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      // Validate request body
      const validatedData = updateProfileSchema.parse(req.body);

      const user = await UserService.updateProfile(userId, validatedData);

      ResponseHelper.success(res, user, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof UserServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
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
   * List all users (Admin only)
   * GET /api/v1/users
   */
  static async listUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate query parameters
      const validatedQuery = userListQuerySchema.parse(req.query);

      const result = await UserService.listUsers(validatedQuery);

      ResponseHelper.success(res, result, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      next(error);
    }
  }

  /**
   * Get user by ID (Admin only)
   * GET /api/v1/users/:userId
   */
  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const { userId } = userIdParamSchema.parse(req.params);

      const user = await UserService.getUserById(userId);

      ResponseHelper.success(res, user, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof UserServiceError) {
        switch (error.code) {
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
   * Update user by ID (Admin only)
   * PUT /api/v1/users/:userId
   */
  static async updateUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const { userId } = userIdParamSchema.parse(req.params);

      // Validate request body
      const validatedData = adminUpdateUserSchema.parse(req.body);

      const user = await UserService.adminUpdateUser(userId, validatedData);

      ResponseHelper.success(res, user, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof UserServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
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
   * Delete user (Admin only)
   * DELETE /api/v1/users/:userId
   */
  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate params
      const { userId } = userIdParamSchema.parse(req.params);

      await UserService.deleteUser(userId);

      ResponseHelper.message(res, "User deleted successfully", 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseHelper.validationError(res, formatZodErrors(error));
        return;
      }

      if (error instanceof UserServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            break;
          case "FORBIDDEN":
            ResponseHelper.forbidden(res, error.message);
            break;
          default:
            ResponseHelper.internalError(res, error.message);
        }
        return;
      }

      next(error);
    }
  }
}
