import { PasswordHelper } from "../password.helper";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("PasswordHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hash", () => {
    it("should hash password successfully", async () => {
      const password = "TestPassword123!";
      const hashedPassword = "$2b$12$hashedpassword";

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordHelper.hash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it("should handle hashing errors", async () => {
      const password = "TestPassword123!";
      const error = new Error("Hashing failed");

      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(PasswordHelper.hash(password)).rejects.toThrow(error);
    });
  });

  describe("compare", () => {
    it("should compare password successfully - match", async () => {
      const password = "TestPassword123!";
      const hash = "$2b$12$hashedpassword";

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordHelper.compare(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it("should compare password successfully - no match", async () => {
      const password = "WrongPassword";
      const hash = "$2b$12$hashedpassword";

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordHelper.compare(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it("should handle comparison errors", async () => {
      const password = "TestPassword123!";
      const hash = "$2b$12$hashedpassword";
      const error = new Error("Comparison failed");

      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(PasswordHelper.compare(password, hash)).rejects.toThrow(
        error
      );
    });
  });
});
