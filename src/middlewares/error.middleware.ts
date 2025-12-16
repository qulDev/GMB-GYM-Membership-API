import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../utils";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Error:", error);

  // Default to internal server error
  ResponseHelper.internalError(res, "An unexpected error occurred");
};

/**
 * Not found handler middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  ResponseHelper.notFound(res, `Route ${req.method} ${req.path} not found`);
};
