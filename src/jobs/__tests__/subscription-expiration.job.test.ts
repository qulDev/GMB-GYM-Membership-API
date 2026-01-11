import {
  startSubscriptionExpirationJob,
  runSubscriptionExpirationNow,
} from "../subscription-expiration.job";
import { SubscriptionSchedulerService } from "../../services/subscription-scheduler.service";
import cron from "node-cron";

jest.mock("../../services/subscription-scheduler.service");
jest.mock("node-cron");

describe("Subscription Expiration Job", () => {
  let mockScheduledTask: {
    start: jest.Mock;
    stop: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    mockScheduledTask = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    (cron.schedule as jest.Mock).mockReturnValue(mockScheduledTask);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("startSubscriptionExpirationJob", () => {
    it("should schedule cron job to run every hour", () => {
      startSubscriptionExpirationJob();

      expect(cron.schedule).toHaveBeenCalledWith(
        "0 * * * *",
        expect.any(Function)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("cron job scheduled")
      );
    });

    it("should execute expiration service when cron triggers", async () => {
      let cronCallback: Function | undefined;
      (cron.schedule as jest.Mock).mockImplementation((_expr, callback) => {
        cronCallback = callback;
        return mockScheduledTask;
      });

      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockResolvedValue({
        expiredCount: 3,
        expiredSubscriptions: [],
      });

      startSubscriptionExpirationJob();

      expect(cronCallback).toBeDefined();
      await cronCallback!();

      expect(
        SubscriptionSchedulerService.expireOverdueSubscriptions
      ).toHaveBeenCalled();
    });

    it("should log when subscriptions are expired", async () => {
      let cronCallback: Function | undefined;
      (cron.schedule as jest.Mock).mockImplementation((_expr, callback) => {
        cronCallback = callback;
        return mockScheduledTask;
      });

      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockResolvedValue({
        expiredCount: 3,
        expiredSubscriptions: [],
      });

      startSubscriptionExpirationJob();
      await cronCallback!();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Expired 3")
      );
    });

    it("should log when no subscriptions to expire", async () => {
      let cronCallback: Function | undefined;
      (cron.schedule as jest.Mock).mockImplementation((_expr, callback) => {
        cronCallback = callback;
        return mockScheduledTask;
      });

      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockResolvedValue({
        expiredCount: 0,
        expiredSubscriptions: [],
      });

      startSubscriptionExpirationJob();
      await cronCallback!();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("No subscriptions to expire")
      );
    });

    it("should log error when cron execution fails", async () => {
      let cronCallback: Function | undefined;
      (cron.schedule as jest.Mock).mockImplementation((_expr, callback) => {
        cronCallback = callback;
        return mockScheduledTask;
      });

      const error = new Error("Service failed");
      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockRejectedValue(error);

      startSubscriptionExpirationJob();
      await cronCallback!();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error"),
        error
      );
    });
  });

  describe("runSubscriptionExpirationNow", () => {
    it("should manually trigger expiration check", async () => {
      const mockResult = {
        expiredCount: 2,
        expiredSubscriptions: [],
      };
      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockResolvedValue(mockResult);

      const result = await runSubscriptionExpirationNow();

      expect(
        SubscriptionSchedulerService.expireOverdueSubscriptions
      ).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Manual")
      );
    });

    it("should propagate error when expiration fails", async () => {
      const error = new Error("Database error");
      (
        SubscriptionSchedulerService.expireOverdueSubscriptions as jest.Mock
      ).mockRejectedValue(error);

      await expect(runSubscriptionExpirationNow()).rejects.toThrow(
        "Database error"
      );
    });
  });
});
