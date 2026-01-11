import { ClassBookingRepository } from "../models/class-booking.repository";
import { SubscriptionRepository } from "../models";
import { prisma } from "../config/database.config";
import { ClassStatus, BookingStatus } from "../generated/prisma";

export class ClassBookingServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "BAD_REQUEST" | "FORBIDDEN" | "CONFLICT"
  ) {
    super(message);
    this.name = "ClassBookingServiceError";
  }
}

export class ClassBookingService {
  /**
   * Book a gym class
   */
  static async bookClass(userId: string, classId: string) {
    // 1. Check if user has active subscription
    const subscription = await SubscriptionRepository.findActiveByUser(userId);
    if (!subscription) {
      throw new ClassBookingServiceError(
        "You need an active subscription to book a class",
        "FORBIDDEN"
      );
    }

    // 2. Check if subscription is not expired
    if (subscription.endDate && new Date() > subscription.endDate) {
      throw new ClassBookingServiceError(
        "Your subscription has expired. Please renew to book classes",
        "FORBIDDEN"
      );
    }

    // 3. Get the class
    const gymClass = await prisma.gymClass.findUnique({
      where: { id: classId },
    });

    if (!gymClass) {
      throw new ClassBookingServiceError("Class not found", "NOT_FOUND");
    }

    // 4. Check if class is scheduled (bookable)
    if (gymClass.status !== ClassStatus.SCHEDULED) {
      throw new ClassBookingServiceError(
        "This class is not available for booking",
        "BAD_REQUEST"
      );
    }

    // 5. Check if class schedule is in the future
    if (new Date() > gymClass.schedule) {
      throw new ClassBookingServiceError(
        "Cannot book a class that has already started",
        "BAD_REQUEST"
      );
    }

    // 6. Check if class has available slots
    if (gymClass.bookedCount >= gymClass.capacity) {
      throw new ClassBookingServiceError(
        "This class is fully booked",
        "CONFLICT"
      );
    }

    // 7. Check if user already booked this class
    const existingBooking = await ClassBookingRepository.findByUserAndClass(
      userId,
      classId
    );

    if (existingBooking) {
      if (existingBooking.status === BookingStatus.CONFIRMED) {
        throw new ClassBookingServiceError(
          "You have already booked this class",
          "CONFLICT"
        );
      }
    }

    // 8. Create booking
    const booking = await ClassBookingRepository.create(userId, classId);

    return booking;
  }

  /**
   * Cancel a class booking
   */
  static async cancelBooking(userId: string, classId: string) {
    // 1. Find the booking
    const booking = await ClassBookingRepository.findByUserAndClass(
      userId,
      classId
    );

    if (!booking) {
      throw new ClassBookingServiceError("Booking not found", "NOT_FOUND");
    }

    // 2. Check if already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ClassBookingServiceError(
        "This booking has already been cancelled",
        "BAD_REQUEST"
      );
    }

    // 3. Check if class hasn't started yet (allow cancel only before class starts)
    if (new Date() > booking.gymClass.schedule) {
      throw new ClassBookingServiceError(
        "Cannot cancel a class that has already started",
        "BAD_REQUEST"
      );
    }

    // 4. Cancel the booking
    const cancelledBooking = await ClassBookingRepository.cancel(
      booking.id,
      classId
    );

    return cancelledBooking;
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(userId: string, status?: string) {
    const bookingStatus = status?.toUpperCase() as BookingStatus | undefined;
    return ClassBookingRepository.findByUser(userId, bookingStatus);
  }

  /**
   * Get class participants (Admin)
   */
  static async getClassParticipants(classId: string) {
    // Check if class exists
    const gymClass = await prisma.gymClass.findUnique({
      where: { id: classId },
    });

    if (!gymClass) {
      throw new ClassBookingServiceError("Class not found", "NOT_FOUND");
    }

    return ClassBookingRepository.findByClass(classId);
  }
}
