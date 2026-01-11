import { ClassBookingRepository } from "../class-booking.repository";
import { prisma } from "../../config/database.config";
import { BookingStatus } from "../../generated/prisma";

// Mock prisma
jest.mock("../../config/database.config", () => ({
  prisma: {
    classBooking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    gymClass: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("ClassBookingRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBooking = {
    id: "booking1",
    userId: "user1",
    classId: "class1",
    status: BookingStatus.CONFIRMED,
    bookedAt: new Date(),
    gymClass: {
      id: "class1",
      name: "Yoga Class",
      trainer: { id: "trainer1", name: "John" },
    },
  };

  describe("create", () => {
    it("should create booking and increment bookedCount", async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            classBooking: {
              create: jest.fn().mockResolvedValue(mockBooking),
            },
            gymClass: {
              update: jest.fn().mockResolvedValue({}),
            },
          };
          return callback(tx);
        }
      );

      const result = await ClassBookingRepository.create("user1", "class1");

      expect(result).toEqual(mockBooking);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("findByUserAndClass", () => {
    it("should find booking by user and class", async () => {
      (prisma.classBooking.findUnique as jest.Mock).mockResolvedValue(
        mockBooking
      );

      const result = await ClassBookingRepository.findByUserAndClass(
        "user1",
        "class1"
      );

      expect(result).toEqual(mockBooking);
      expect(prisma.classBooking.findUnique).toHaveBeenCalledWith({
        where: {
          userId_classId: { userId: "user1", classId: "class1" },
        },
        include: { gymClass: true },
      });
    });

    it("should return null if not found", async () => {
      (prisma.classBooking.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await ClassBookingRepository.findByUserAndClass(
        "user1",
        "class1"
      );

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find booking by ID", async () => {
      (prisma.classBooking.findUnique as jest.Mock).mockResolvedValue(
        mockBooking
      );

      const result = await ClassBookingRepository.findById("booking1");

      expect(result).toEqual(mockBooking);
      expect(prisma.classBooking.findUnique).toHaveBeenCalledWith({
        where: { id: "booking1" },
        include: {
          gymClass: { include: { trainer: true } },
          user: true,
        },
      });
    });
  });

  describe("findByIdAndUser", () => {
    it("should find booking by ID and user", async () => {
      (prisma.classBooking.findFirst as jest.Mock).mockResolvedValue(
        mockBooking
      );

      const result = await ClassBookingRepository.findByIdAndUser(
        "booking1",
        "user1"
      );

      expect(result).toEqual(mockBooking);
      expect(prisma.classBooking.findFirst).toHaveBeenCalledWith({
        where: { id: "booking1", userId: "user1" },
        include: {
          gymClass: { include: { trainer: true } },
        },
      });
    });
  });

  describe("cancel", () => {
    it("should cancel booking and decrement bookedCount", async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            classBooking: {
              update: jest.fn().mockResolvedValue(cancelledBooking),
            },
            gymClass: {
              update: jest.fn().mockResolvedValue({}),
            },
          };
          return callback(tx);
        }
      );

      const result = await ClassBookingRepository.cancel("booking1", "class1");

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("findByUser", () => {
    it("should find all bookings for user", async () => {
      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      const result = await ClassBookingRepository.findByUser("user1");

      expect(result).toEqual([mockBooking]);
      expect(prisma.classBooking.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        include: {
          gymClass: { include: { trainer: true } },
        },
        orderBy: { bookedAt: "desc" },
      });
    });

    it("should filter by status when provided", async () => {
      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue([
        mockBooking,
      ]);

      await ClassBookingRepository.findByUser("user1", BookingStatus.CONFIRMED);

      expect(prisma.classBooking.findMany).toHaveBeenCalledWith({
        where: { userId: "user1", status: BookingStatus.CONFIRMED },
        include: {
          gymClass: { include: { trainer: true } },
        },
        orderBy: { bookedAt: "desc" },
      });
    });
  });

  describe("findByClass", () => {
    it("should find all confirmed bookings for class", async () => {
      const bookingsWithUser = [
        {
          ...mockBooking,
          user: { id: "user1", fullName: "Test User", email: "test@test.com" },
        },
      ];

      (prisma.classBooking.findMany as jest.Mock).mockResolvedValue(
        bookingsWithUser
      );

      const result = await ClassBookingRepository.findByClass("class1");

      expect(result).toEqual(bookingsWithUser);
      expect(prisma.classBooking.findMany).toHaveBeenCalledWith({
        where: { classId: "class1", status: BookingStatus.CONFIRMED },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { bookedAt: "asc" },
      });
    });
  });
});
