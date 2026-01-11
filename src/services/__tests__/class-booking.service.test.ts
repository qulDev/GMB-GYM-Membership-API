import {
  ClassBookingService,
  ClassBookingServiceError,
} from "../class-booking.service";
import { ClassBookingRepository } from "../../models/class-booking.repository";
import { SubscriptionRepository } from "../../models";
import { prisma } from "../../config/database.config";
import { ClassStatus, BookingStatus } from "../../generated/prisma";

// Mock dependencies
jest.mock("../../models/class-booking.repository");
jest.mock("../../models", () => ({
  SubscriptionRepository: {
    findActiveByUser: jest.fn(),
  },
}));
jest.mock("../../config/database.config", () => ({
  prisma: {
    gymClass: {
      findUnique: jest.fn(),
    },
  },
}));

describe("ClassBookingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSubscription = {
    id: "sub1",
    userId: "user1",
    status: "ACTIVE",
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    membershipPlan: { name: "Premium" },
  };

  const mockGymClass = {
    id: "class1",
    name: "Yoga Class",
    status: ClassStatus.SCHEDULED,
    schedule: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    capacity: 20,
    bookedCount: 5,
    trainer: { id: "trainer1", name: "John" },
  };

  const mockBooking = {
    id: "booking1",
    userId: "user1",
    classId: "class1",
    status: BookingStatus.CONFIRMED,
    bookedAt: new Date(),
    gymClass: mockGymClass,
  };

  describe("bookClass", () => {
    it("should successfully book a class", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(mockGymClass);
      (
        ClassBookingRepository.findByUserAndClass as jest.Mock
      ).mockResolvedValue(null);
      (ClassBookingRepository.create as jest.Mock).mockResolvedValue(
        mockBooking
      );

      const result = await ClassBookingService.bookClass("user1", "class1");

      expect(result).toEqual(mockBooking);
      expect(ClassBookingRepository.create).toHaveBeenCalledWith(
        "user1",
        "class1"
      );
    });

    it("should throw error if user has no active subscription", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toThrow(ClassBookingServiceError);

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "You need an active subscription to book a class",
      });
    });

    it("should throw error if subscription is expired", async () => {
      const expiredSub = {
        ...mockSubscription,
        endDate: new Date(Date.now() - 1000), // Expired
      };
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        expiredSub
      );

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Your subscription has expired. Please renew to book classes",
      });
    });

    it("should throw error if class not found", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Class not found",
      });
    });

    it("should throw error if class is not scheduled", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue({
        ...mockGymClass,
        status: ClassStatus.COMPLETED,
      });

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "This class is not available for booking",
      });
    });

    it("should throw error if class has already started", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue({
        ...mockGymClass,
        schedule: new Date(Date.now() - 1000), // Past
      });

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Cannot book a class that has already started",
      });
    });

    it("should throw error if class is fully booked", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue({
        ...mockGymClass,
        bookedCount: 20,
        capacity: 20,
      });

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "This class is fully booked",
      });
    });

    it("should throw error if user already booked this class", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(mockGymClass);
      (
        ClassBookingRepository.findByUserAndClass as jest.Mock
      ).mockResolvedValue(mockBooking);

      await expect(
        ClassBookingService.bookClass("user1", "class1")
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "You have already booked this class",
      });
    });
  });

  describe("cancelBooking", () => {
    it("should successfully cancel a booking", async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      (
        ClassBookingRepository.findByUserAndClass as jest.Mock
      ).mockResolvedValue(mockBooking);
      (ClassBookingRepository.cancel as jest.Mock).mockResolvedValue(
        cancelledBooking
      );

      const result = await ClassBookingService.cancelBooking("user1", "class1");

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(ClassBookingRepository.cancel).toHaveBeenCalledWith(
        "booking1",
        "class1"
      );
    });

    it("should throw error if booking not found", async () => {
      (
        ClassBookingRepository.findByUserAndClass as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        ClassBookingService.cancelBooking("user1", "class1")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Booking not found",
      });
    });

    it("should throw error if booking already cancelled", async () => {
      (
        ClassBookingRepository.findByUserAndClass as jest.Mock
      ).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        ClassBookingService.cancelBooking("user1", "class1")
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "This booking has already been cancelled",
      });
    });

    it("should throw error if class has already started", async () => {
      (
        ClassBookingRepository.findByUserAndClass as jest.Mock
      ).mockResolvedValue({
        ...mockBooking,
        gymClass: {
          ...mockGymClass,
          schedule: new Date(Date.now() - 1000), // Past
        },
      });

      await expect(
        ClassBookingService.cancelBooking("user1", "class1")
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Cannot cancel a class that has already started",
      });
    });
  });

  describe("getUserBookings", () => {
    it("should get user bookings", async () => {
      (ClassBookingRepository.findByUser as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      const result = await ClassBookingService.getUserBookings("user1");

      expect(result).toEqual([mockBooking]);
      expect(ClassBookingRepository.findByUser).toHaveBeenCalledWith(
        "user1",
        undefined
      );
    });

    it("should filter by status", async () => {
      (ClassBookingRepository.findByUser as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      await ClassBookingService.getUserBookings("user1", "confirmed");

      expect(ClassBookingRepository.findByUser).toHaveBeenCalledWith(
        "user1",
        "CONFIRMED"
      );
    });
  });

  describe("getClassParticipants", () => {
    it("should get class participants", async () => {
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(mockGymClass);
      (ClassBookingRepository.findByClass as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      const result = await ClassBookingService.getClassParticipants("class1");

      expect(result).toEqual([mockBooking]);
    });

    it("should throw error if class not found", async () => {
      (prisma.gymClass.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ClassBookingService.getClassParticipants("class1")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Class not found",
      });
    });
  });
});
