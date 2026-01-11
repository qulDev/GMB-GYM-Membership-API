import { Request, Response, NextFunction } from "express";
import {
  ClassBookingService,
  ClassBookingServiceError,
} from "../services/class-booking.service";
import { ResponseHelper } from "../utils";

export class ClassBookingController {
  /**
   * POST /api/v1/classes/:classId/book
   * Book a gym class
   */
  static async book(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "Authentication required");
        return;
      }

      const { classId } = req.params;

      if (!classId) {
        ResponseHelper.error(
          res,
          "VALIDATION_ERROR",
          "Class ID is required",
          400
        );
        return;
      }

      const booking = await ClassBookingService.bookClass(
        req.user.userId,
        classId
      );

      ResponseHelper.success(res, booking, 201);
    } catch (error) {
      if (error instanceof ClassBookingServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            return;
          case "FORBIDDEN":
            ResponseHelper.forbidden(res, error.message);
            return;
          case "CONFLICT":
            ResponseHelper.error(res, "CONFLICT", error.message, 409);
            return;
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            return;
        }
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/classes/:classId/cancel
   * Cancel a class booking
   */
  static async cancel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "Authentication required");
        return;
      }

      const { classId } = req.params;

      if (!classId) {
        ResponseHelper.error(
          res,
          "VALIDATION_ERROR",
          "Class ID is required",
          400
        );
        return;
      }

      const booking = await ClassBookingService.cancelBooking(
        req.user.userId,
        classId
      );

      ResponseHelper.success(res, booking, 200);
    } catch (error) {
      if (error instanceof ClassBookingServiceError) {
        switch (error.code) {
          case "NOT_FOUND":
            ResponseHelper.notFound(res, error.message);
            return;
          case "BAD_REQUEST":
            ResponseHelper.error(res, "BAD_REQUEST", error.message, 400);
            return;
        }
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/classes/my-bookings
   * Get user's class bookings
   */
  static async myBookings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ResponseHelper.unauthorized(res, "Authentication required");
        return;
      }

      const { status } = req.query;

      const bookings = await ClassBookingService.getUserBookings(
        req.user.userId,
        status as string | undefined
      );

      ResponseHelper.success(res, bookings, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/classes/:classId/participants
   * Get class participants (Admin only)
   */
  static async participants(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { classId } = req.params;

      if (!classId) {
        ResponseHelper.error(
          res,
          "VALIDATION_ERROR",
          "Class ID is required",
          400
        );
        return;
      }

      const participants = await ClassBookingService.getClassParticipants(
        classId
      );

      ResponseHelper.success(res, participants, 200);
    } catch (error) {
      if (error instanceof ClassBookingServiceError) {
        if (error.code === "NOT_FOUND") {
          ResponseHelper.notFound(res, error.message);
          return;
        }
      }
      next(error);
    }
  }
}
