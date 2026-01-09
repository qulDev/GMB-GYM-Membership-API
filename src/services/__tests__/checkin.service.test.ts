import { CheckInService } from "../checkin.service";
import { CheckInRepository, SubscriptionRepository } from "../../models";

jest.mock("../../models", () => ({
  CheckInRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findActiveByUser: jest.fn(),
    findByUser: jest.fn(),
    countTodayCheckIns: jest.fn(),
    checkout: jest.fn(),
    findByIdAndUser: jest.fn(),
  },
  SubscriptionRepository: {
    findActiveByUser: jest.fn(),
  },
}));

describe("CheckInService", () => {
  // Use dynamic dates to ensure they're always valid
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year from now

  const mockSubscription = {
    id: "subscription123",
    userId: "user123",
    membershipPlanId: "plan123",
    startDate: new Date("2024-01-01"),
    endDate: futureDate, // Dynamic future date
    status: "ACTIVE",
    membershipPlan: {
      id: "plan123",
      name: "Premium",
      maxCheckInsPerDay: 2,
    },
  };

  const mockCheckIn = {
    id: "checkin123",
    userId: "user123",
    checkInTime: new Date("2024-01-15T10:00:00Z"),
    checkOutTime: null,
    duration: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkIn", () => {
    it("should check in user successfully", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (CheckInRepository.findActiveByUser as jest.Mock).mockResolvedValue(null);
      (CheckInRepository.countTodayCheckIns as jest.Mock).mockResolvedValue(0);
      (CheckInRepository.create as jest.Mock).mockResolvedValue(mockCheckIn);

      const result = await CheckInService.checkIn("user123");

      expect(result).toEqual(mockCheckIn);
      expect(SubscriptionRepository.findActiveByUser).toHaveBeenCalledWith(
        "user123"
      );
      expect(CheckInRepository.findActiveByUser).toHaveBeenCalledWith(
        "user123"
      );
      expect(CheckInRepository.countTodayCheckIns).toHaveBeenCalledWith(
        "user123"
      );
      expect(CheckInRepository.create).toHaveBeenCalledWith("user123");
    });

    it("should throw error if no active subscription", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        null
      );

      await expect(CheckInService.checkIn("user123")).rejects.toThrow(
        "No active membership. Please subscribe to a plan first."
      );
    });

    it("should throw error if subscription expired", async () => {
      const expiredSubscription = {
        ...mockSubscription,
        endDate: new Date("2020-01-01"),
      };
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        expiredSubscription
      );

      await expect(CheckInService.checkIn("user123")).rejects.toThrow(
        "Your membership has expired. Please renew your subscription."
      );
    });

    it("should throw error if already checked in", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (CheckInRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockCheckIn
      );

      await expect(CheckInService.checkIn("user123")).rejects.toThrow(
        "You are already checked in. Please check out first."
      );
    });

    it("should throw error if daily check-in limit reached", async () => {
      (SubscriptionRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockSubscription
      );
      (CheckInRepository.findActiveByUser as jest.Mock).mockResolvedValue(null);
      (CheckInRepository.countTodayCheckIns as jest.Mock).mockResolvedValue(2);

      await expect(CheckInService.checkIn("user123")).rejects.toThrow(
        "Daily check-in limit reached (2). Please come back tomorrow."
      );
    });
  });

  describe("checkOut", () => {
    it("should check out user successfully", async () => {
      const checkInTime = new Date("2024-01-15T10:00:00Z");
      const mockCheckInWithTime = { ...mockCheckIn, checkInTime };
      const mockUpdatedCheckIn = {
        ...mockCheckInWithTime,
        checkOutTime: expect.any(Date),
        duration: expect.any(Number),
      };

      (CheckInRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
        mockCheckInWithTime
      );
      (CheckInRepository.checkout as jest.Mock).mockResolvedValue(
        mockUpdatedCheckIn
      );

      const result = await CheckInService.checkOut("checkin123", "user123");

      expect(result).toEqual(mockUpdatedCheckIn);
      expect(CheckInRepository.findByIdAndUser).toHaveBeenCalledWith(
        "checkin123",
        "user123"
      );
      expect(CheckInRepository.checkout).toHaveBeenCalledWith(
        "checkin123",
        expect.any(Date),
        expect.any(Number)
      );
    });

    it("should throw error if check-in not found", async () => {
      (CheckInRepository.findByIdAndUser as jest.Mock).mockResolvedValue(null);

      await expect(
        CheckInService.checkOut("invalid", "user123")
      ).rejects.toThrow("Check-in record not found");
    });

    it("should throw error if already checked out", async () => {
      const alreadyCheckedOut = {
        ...mockCheckIn,
        checkOutTime: new Date("2024-01-15T12:00:00Z"),
      };
      (CheckInRepository.findByIdAndUser as jest.Mock).mockResolvedValue(
        alreadyCheckedOut
      );

      await expect(
        CheckInService.checkOut("checkin123", "user123")
      ).rejects.toThrow("You have already checked out");
    });
  });

  describe("getHistory", () => {
    it("should get check-in history without date filters", async () => {
      const mockHistory = [mockCheckIn];
      (CheckInRepository.findByUser as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const result = await CheckInService.getHistory("user123");

      expect(result).toEqual(mockHistory);
      expect(CheckInRepository.findByUser).toHaveBeenCalledWith(
        "user123",
        undefined,
        undefined
      );
    });

    it("should get check-in history with date filters", async () => {
      const mockHistory = [mockCheckIn];
      (CheckInRepository.findByUser as jest.Mock).mockResolvedValue(
        mockHistory
      );

      const result = await CheckInService.getHistory(
        "user123",
        "2024-01-01",
        "2024-01-31"
      );

      expect(result).toEqual(mockHistory);
      expect(CheckInRepository.findByUser).toHaveBeenCalledWith(
        "user123",
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe("getCurrentStatus", () => {
    it("should return checked-in status when user is checked in", async () => {
      (CheckInRepository.findActiveByUser as jest.Mock).mockResolvedValue(
        mockCheckIn
      );

      const result = await CheckInService.getCurrentStatus("user123");

      expect(result).toEqual({
        isCheckedIn: true,
        currentCheckIn: mockCheckIn,
      });
    });

    it("should return not checked-in status when user is not checked in", async () => {
      (CheckInRepository.findActiveByUser as jest.Mock).mockResolvedValue(null);

      const result = await CheckInService.getCurrentStatus("user123");

      expect(result).toEqual({
        isCheckedIn: false,
        currentCheckIn: null,
      });
    });
  });
});
