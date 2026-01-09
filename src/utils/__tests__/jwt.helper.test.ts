import { JwtHelper } from "../jwt.helper";
import jwt from "jsonwebtoken";
import { redis } from "../../config/redis.config";
import { UserRole } from "../../generated/prisma";
import { jwtConfig } from "../../config/jwt.config";

jest.mock("jsonwebtoken");
jest.mock("../../config/redis.config", () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
  },
}));

jest.mock("../../config/jwt.config", () => {
  // Mock getExpiresInSeconds function
  const mockGetExpiresInSeconds = (expiresIn: string): number => {
    if (expiresIn === "15m") return 900;
    if (expiresIn === "7d") return 604800;
    return 900;
  };

  return {
    jwtConfig: {
      secret: "test-secret",
      accessTokenExpiresIn: "15m",
      refreshTokenExpiresIn: "7d",
    },
    getExpiresInSeconds: mockGetExpiresInSeconds,
  };
});

describe("JwtHelper", () => {
  const mockUserId = "user123";
  const mockEmail = "test@example.com";
  const mockRole: UserRole = "USER";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("should generate access token successfully", () => {
      const token = "access-token";
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = JwtHelper.generateAccessToken(
        mockUserId,
        mockEmail,
        mockRole
      );

      expect(result).toBe(token);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          email: mockEmail,
          role: mockRole,
          type: "access",
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessTokenExpiresIn }
      );
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate refresh token successfully", () => {
      const token = "refresh-token";
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = JwtHelper.generateRefreshToken(
        mockUserId,
        mockEmail,
        mockRole
      );

      expect(result).toBe(token);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          email: mockEmail,
          role: mockRole,
          type: "refresh",
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.refreshTokenExpiresIn }
      );
    });
  });

  describe("generateTokenPair", () => {
    it("should generate token pair and store in Redis", async () => {
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      (redis.setex as jest.Mock).mockResolvedValue("OK");
      (redis.sadd as jest.Mock).mockResolvedValue(1);

      const result = await JwtHelper.generateTokenPair(
        mockUserId,
        mockEmail,
        mockRole
      );

      expect(result).toHaveProperty("accessToken", accessToken);
      expect(result).toHaveProperty("refreshToken", refreshToken);
      expect(result).toHaveProperty("expiresIn");
      expect(redis.setex).toHaveBeenCalledTimes(2);
      expect(redis.sadd).toHaveBeenCalled();
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token", async () => {
      const token = "valid-access-token";
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        type: "access",
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(payload));

      const result = await JwtHelper.verifyAccessToken(token);

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(token, jwtConfig.secret);
      expect(redis.get).toHaveBeenCalledWith(`access_token:${token}`);
    });

    it("should return null for invalid token type", async () => {
      const token = "invalid-token-type";
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        type: "refresh", // Wrong type
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = await JwtHelper.verifyAccessToken(token);

      expect(result).toBeNull();
    });

    it("should return null when token not in Redis", async () => {
      const token = "token-not-in-redis";
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        type: "access",
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await JwtHelper.verifyAccessToken(token);

      expect(result).toBeNull();
    });

    it("should return null for invalid JWT", async () => {
      const token = "invalid-jwt";
      const error = new Error("Invalid token");

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = await JwtHelper.verifyAccessToken(token);

      expect(result).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token", async () => {
      const token = "valid-refresh-token";
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        type: "refresh",
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(payload));

      const result = await JwtHelper.verifyRefreshToken(token);

      expect(result).toEqual(payload);
      expect(redis.get).toHaveBeenCalledWith(`refresh_token:${token}`);
    });

    it("should return null for invalid token type", async () => {
      const token = "invalid-token-type";
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        type: "access", // Wrong type
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = await JwtHelper.verifyRefreshToken(token);

      expect(result).toBeNull();
    });
  });

  describe("invalidateAccessToken", () => {
    it("should invalidate access token", async () => {
      const token = "access-token";
      (redis.del as jest.Mock).mockResolvedValue(1);

      await JwtHelper.invalidateAccessToken(token);

      expect(redis.del).toHaveBeenCalledWith(`access_token:${token}`);
    });
  });

  describe("invalidateRefreshToken", () => {
    it("should invalidate refresh token", async () => {
      const token = "refresh-token";
      (redis.del as jest.Mock).mockResolvedValue(1);

      await JwtHelper.invalidateRefreshToken(token);

      expect(redis.del).toHaveBeenCalledWith(`refresh_token:${token}`);
    });
  });

  describe("invalidateTokens", () => {
    it("should invalidate both tokens", async () => {
      const accessToken = "access-token";
      const refreshToken = "refresh-token";
      (redis.del as jest.Mock).mockResolvedValue(2);

      await JwtHelper.invalidateTokens(accessToken, refreshToken);

      expect(redis.del).toHaveBeenCalledWith(
        `access_token:${accessToken}`,
        `refresh_token:${refreshToken}`
      );
    });

    it("should invalidate only access token when refresh token not provided", async () => {
      const accessToken = "access-token";
      (redis.del as jest.Mock).mockResolvedValue(1);

      await JwtHelper.invalidateTokens(accessToken);

      expect(redis.del).toHaveBeenCalledWith(`access_token:${accessToken}`);
    });
  });

  describe("invalidateAllUserTokens", () => {
    it("should invalidate all user tokens", async () => {
      const tokens = ["token1", "token2"];
      (redis.smembers as jest.Mock).mockResolvedValue(tokens);
      (redis.del as jest.Mock).mockResolvedValue(5);

      await JwtHelper.invalidateAllUserTokens(mockUserId);

      expect(redis.smembers).toHaveBeenCalledWith(
        `user_tokens:${mockUserId}`
      );
      expect(redis.del).toHaveBeenCalled();
    });

    it("should handle empty token list", async () => {
      (redis.smembers as jest.Mock).mockResolvedValue([]);

      await JwtHelper.invalidateAllUserTokens(mockUserId);

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe("decodeToken", () => {
    it("should decode token successfully", () => {
      const token = "token-to-decode";
      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        type: "access",
      };

      (jwt.decode as jest.Mock).mockReturnValue(payload);

      const result = JwtHelper.decodeToken(token);

      expect(result).toEqual(payload);
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });

    it("should return null for invalid token", () => {
      const token = "invalid-token";

      (jwt.decode as jest.Mock).mockReturnValue(null);

      const result = JwtHelper.decodeToken(token);

      expect(result).toBeNull();
    });

    it("should handle decode errors", () => {
      const token = "error-token";

      (jwt.decode as jest.Mock).mockImplementation(() => {
        throw new Error("Decode failed");
      });

      const result = JwtHelper.decodeToken(token);

      expect(result).toBeNull();
    });
  });
});
