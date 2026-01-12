import { Request, Response, NextFunction } from "express";
import { LogsService } from "../services";

/**
 * Activity logging middleware
 * Logs all API requests to the database
 */
export const activityLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip logging for certain paths
  const skipPaths = ["/health", "/api-docs", "/favicon.ico"];
  if (skipPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Capture the original end function
  const originalEnd = res.end;
  const startTime = Date.now();

  // Override end to log after response is sent
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Restore original end
    res.end = originalEnd;

    // Calculate duration
    const duration = Date.now() - startTime;

    // Log the request asynchronously (don't block response)
    setImmediate(async () => {
      try {
        // Determine log level based on status code
        let level: "INFO" | "WARNING" | "ERROR" = "INFO";
        if (res.statusCode >= 400 && res.statusCode < 500) {
          level = "WARNING";
        } else if (res.statusCode >= 500) {
          level = "ERROR";
        }

        // Get action from method and path
        const action = `${req.method} ${req.path}`;

        // Get IP address
        const ipAddress =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          undefined;

        // Get user agent
        const userAgent = req.headers["user-agent"] || undefined;

        // Build metadata
        const metadata: Record<string, any> = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
        };

        // Add body for non-GET requests (exclude sensitive data)
        if (req.method !== "GET" && req.body) {
          const sanitizedBody = sanitizeBody(req.body);
          if (Object.keys(sanitizedBody).length > 0) {
            metadata.body = sanitizedBody;
          }
        }

        await LogsService.createLog({
          userId: req.user?.userId,
          action,
          entity: getEntityFromPath(req.path),
          description: `${req.method} request to ${req.path} - Status: ${res.statusCode} (${duration}ms)`,
          ipAddress,
          userAgent,
          metadata,
          level,
        });
      } catch (error) {
        // Don't let logging errors affect the application
        console.error("Activity logging error:", error);
      }
    });

    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

/**
 * Extract entity name from path
 */
function getEntityFromPath(path: string): string | undefined {
  const parts = path.split("/").filter(Boolean);

  // Expected format: /api/v1/{entity}/...
  if (parts.length >= 3 && parts[0] === "api" && parts[1].startsWith("v")) {
    // Convert kebab-case to UPPER_SNAKE_CASE
    return parts[2].toUpperCase().replace(/-/g, "_");
  }

  return undefined;
}

/**
 * Remove sensitive fields from request body
 */
function sanitizeBody(body: any): Record<string, any> {
  if (!body || typeof body !== "object") {
    return {};
  }

  const sensitiveFields = [
    "password",
    "confirmPassword",
    "currentPassword",
    "newPassword",
    "token",
    "refreshToken",
    "accessToken",
    "secret",
    "apiKey",
    "creditCard",
    "cardNumber",
    "cvv",
    "pin",
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    if (
      sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      )
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
