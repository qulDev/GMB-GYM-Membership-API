import { CheckInRepository } from "../checkin.repository";
import { prisma } from "../../config/database.config";

jest.mock("../../config/database.config", () => ({
  prisma: {
    checkIn: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("CheckInRepository", () => {
  const mockCheckIn = {
    id: "checkin123",
    userId: "user123",
    checkInTime: new Date("2024-01-15T10:00:00Z"),
    checkOutTime: null,
    duration: null,
    createdAt: new Date(),
  };

  const mockCheckInWithUser = {
    ...mockCheckIn,
    user: {
      id: "user123",
      fullName: "Test User",
      email: "test@example.com",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new check-in record", async () => {
      const userId = "user123";
      (prisma.checkIn.create as jest.Mock).mockResolvedValue(mockCheckIn);

      const result = await CheckInRepository.create(userId);

      expect(result).toEqual(mockCheckIn);
      expect(prisma.checkIn.create).toHaveBeenCalledWith({
        data: {
          userId,
          checkInTime: expect.any(Date),
        },
      });
    });
  });

  describe("findById", () => {
    it("should find check-in by ID with user info", async () => {
      const checkInId = "checkin123";
      (prisma.checkIn.findUnique as jest.Mock).mockResolvedValue(
        mockCheckInWithUser
      );

      const result = await CheckInRepository.findById(checkInId);

      expect(result).toEqual(mockCheckInWithUser);
      expect(prisma.checkIn.findUnique).toHaveBeenCalledWith({
        where: { id: checkInId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    });

    it("should return null if check-in not found", async () => {
      const checkInId = "nonexistent";
      (prisma.checkIn.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await CheckInRepository.findById(checkInId);

      expect(result).toBeNull();
    });
  });

  describe("findActiveByUser", () => {
    it("should find active check-in for user (no checkout)", async () => {
      const userId = "user123";
      (prisma.checkIn.findFirst as jest.Mock).mockResolvedValue(mockCheckIn);

      const result = await CheckInRepository.findActiveByUser(userId);

      expect(result).toEqual(mockCheckIn);
      expect(prisma.checkIn.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          checkOutTime: null,
        },
        orderBy: {
          checkInTime: "desc",
        },
      });
    });

    it("should return null if no active check-in", async () => {
      const userId = "user123";
      (prisma.checkIn.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await CheckInRepository.findActiveByUser(userId);

      expect(result).toBeNull();
    });
  });

  describe("findByUser", () => {
    it("should find all check-ins for user without date filters", async () => {
      const userId = "user123";
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([mockCheckIn]);

      const result = await CheckInRepository.findByUser(userId);

      expect(result).toEqual([mockCheckIn]);
      expect(prisma.checkIn.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: {
          checkInTime: "desc",
        },
      });
    });

    it("should find check-ins with start date filter", async () => {
      const userId = "user123";
      const startDate = new Date("2024-01-01");
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([mockCheckIn]);

      const result = await CheckInRepository.findByUser(userId, startDate);

      expect(result).toEqual([mockCheckIn]);
      expect(prisma.checkIn.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          checkInTime: {
            gte: startDate,
          },
        },
        orderBy: {
          checkInTime: "desc",
        },
      });
    });

    it("should find check-ins with end date filter", async () => {
      const userId = "user123";
      const endDate = new Date("2024-01-31");
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([mockCheckIn]);

      const result = await CheckInRepository.findByUser(
        userId,
        undefined,
        endDate
      );

      expect(result).toEqual([mockCheckIn]);
      expect(prisma.checkIn.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          checkInTime: {
            lte: expect.any(Date),
          },
        },
        orderBy: {
          checkInTime: "desc",
        },
      });
    });

    it("should find check-ins with both date filters", async () => {
      const userId = "user123";
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([mockCheckIn]);

      const result = await CheckInRepository.findByUser(
        userId,
        startDate,
        endDate
      );

      expect(result).toEqual([mockCheckIn]);
      expect(prisma.checkIn.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          checkInTime: {
            gte: startDate,
            lte: expect.any(Date),
          },
        },
        orderBy: {
          checkInTime: "desc",
        },
      });
    });
  });

  describe("countTodayCheckIns", () => {
    it("should count today's check-ins for user", async () => {
      const userId = "user123";
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(2);

      const result = await CheckInRepository.countTodayCheckIns(userId);

      expect(result).toBe(2);
      expect(prisma.checkIn.count).toHaveBeenCalledWith({
        where: {
          userId,
          checkInTime: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
      });
    });

    it("should return 0 if no check-ins today", async () => {
      const userId = "user123";
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(0);

      const result = await CheckInRepository.countTodayCheckIns(userId);

      expect(result).toBe(0);
    });
  });

  describe("checkout", () => {
    it("should update check-in with checkout time and duration", async () => {
      const checkInId = "checkin123";
      const checkOutTime = new Date("2024-01-15T12:00:00Z");
      const duration = 120; // minutes

      const updatedCheckIn = {
        ...mockCheckIn,
        checkOutTime,
        duration,
      };
      (prisma.checkIn.update as jest.Mock).mockResolvedValue(updatedCheckIn);

      const result = await CheckInRepository.checkout(
        checkInId,
        checkOutTime,
        duration
      );

      expect(result).toEqual(updatedCheckIn);
      expect(prisma.checkIn.update).toHaveBeenCalledWith({
        where: { id: checkInId },
        data: {
          checkOutTime,
          duration,
        },
      });
    });
  });

  describe("findByIdAndUser", () => {
    it("should find check-in by ID and user ID", async () => {
      const checkInId = "checkin123";
      const userId = "user123";
      (prisma.checkIn.findFirst as jest.Mock).mockResolvedValue(mockCheckIn);

      const result = await CheckInRepository.findByIdAndUser(checkInId, userId);

      expect(result).toEqual(mockCheckIn);
      expect(prisma.checkIn.findFirst).toHaveBeenCalledWith({
        where: {
          id: checkInId,
          userId,
        },
      });
    });

    it("should return null if check-in not found for user", async () => {
      const checkInId = "checkin123";
      const userId = "differentUser";
      (prisma.checkIn.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await CheckInRepository.findByIdAndUser(checkInId, userId);

      expect(result).toBeNull();
    });
  });
});
