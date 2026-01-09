import { getExpiresInSeconds, jwtConfig } from "../jwt.config";

describe("JWT Config", () => {
  describe("getExpiresInSeconds", () => {
    it("should convert seconds correctly", () => {
      expect(getExpiresInSeconds("30s")).toBe(30);
    });

    it("should convert minutes correctly", () => {
      expect(getExpiresInSeconds("15m")).toBe(15 * 60);
      expect(getExpiresInSeconds("30m")).toBe(30 * 60);
    });

    it("should convert hours correctly", () => {
      expect(getExpiresInSeconds("1h")).toBe(60 * 60);
      expect(getExpiresInSeconds("2h")).toBe(2 * 60 * 60);
    });

    it("should convert days correctly", () => {
      expect(getExpiresInSeconds("1d")).toBe(24 * 60 * 60);
      expect(getExpiresInSeconds("7d")).toBe(7 * 24 * 60 * 60);
    });

    it("should return default 900 seconds for invalid format", () => {
      expect(getExpiresInSeconds("invalid")).toBe(900);
      expect(getExpiresInSeconds("")).toBe(900);
      expect(getExpiresInSeconds("abc")).toBe(900);
    });

    it("should handle edge cases", () => {
      expect(getExpiresInSeconds("0s")).toBe(0);
      expect(getExpiresInSeconds("0m")).toBe(0);
      expect(getExpiresInSeconds("999s")).toBe(999);
    });

    it("should handle unknown unit", () => {
      expect(getExpiresInSeconds("30x")).toBe(900); // Default fallback
    });
  });

  describe("jwtConfig", () => {
    it("should have required properties", () => {
      expect(jwtConfig).toHaveProperty("secret");
      expect(jwtConfig).toHaveProperty("accessTokenExpiresIn");
      expect(jwtConfig).toHaveProperty("refreshTokenExpiresIn");
      expect(jwtConfig).toHaveProperty("accessTokenExpiresInSeconds");
      expect(jwtConfig).toHaveProperty("refreshTokenExpiresInSeconds");
    });

    it("should have valid token expiration values", () => {
      expect(typeof jwtConfig.secret).toBe("string");
      expect(typeof jwtConfig.accessTokenExpiresIn).toBe("string");
      expect(typeof jwtConfig.refreshTokenExpiresIn).toBe("string");
      expect(typeof jwtConfig.accessTokenExpiresInSeconds).toBe("number");
      expect(typeof jwtConfig.refreshTokenExpiresInSeconds).toBe("number");
    });
  });
});
