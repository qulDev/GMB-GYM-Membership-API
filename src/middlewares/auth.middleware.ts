import { Request, Response, NextFunction } from "express";
import { JwtHelper, ResponseHelper } from "../utils";
import { JwtPayload } from "../types";
import { UserRole } from "../generated/prisma";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ResponseHelper.unauthorized(res, "Access token is required");
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      ResponseHelper.unauthorized(res, "Access token is required");
      return;
    }

    // Verify token
    const payload = await JwtHelper.verifyAccessToken(token);

    if (!payload) {
      ResponseHelper.unauthorized(res, "Invalid or expired access token");
      return;
    }

    // Attach user and token to request
    req.user = payload;
    req.token = token;

    next();
  } catch (error) {
    ResponseHelper.unauthorized(res, "Authentication failed");
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.unauthorized(res, "Authentication required");
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ResponseHelper.forbidden(
        res,
        "You do not have permission to access this resource"
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token) {
        const payload = await JwtHelper.verifyAccessToken(token);

        if (payload) {
          req.user = payload;
          req.token = token;
        }
      }
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
};
