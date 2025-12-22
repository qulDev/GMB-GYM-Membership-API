import jwt, { SignOptions } from "jsonwebtoken";
import { jwtConfig, getExpiresInSeconds } from "../config";
import { redis } from "../config/redis.config";
import { JwtPayload, StoredToken, AuthTokens } from "../types";
import { UserRole } from "../generated/prisma";

// Redis key prefixes
const ACCESS_TOKEN_PREFIX = "access_token:";
const REFRESH_TOKEN_PREFIX = "refresh_token:";
const USER_TOKENS_PREFIX = "user_tokens:";

export class JwtHelper {
  /**
   * Generate access token
   */
  static generateAccessToken(
    userId: string,
    email: string,
    role: UserRole
  ): string {
    const payload: JwtPayload = {
      userId,
      email,
      role,
      type: "access",
    };

    const options: SignOptions = {
      expiresIn: jwtConfig.accessTokenExpiresIn as jwt.SignOptions["expiresIn"],
    };

    return jwt.sign(payload, jwtConfig.secret, options);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(
    userId: string,
    email: string,
    role: UserRole
  ): string {
    const payload: JwtPayload = {
      userId,
      email,
      role,
      type: "refresh",
    };

    const options: SignOptions = {
      expiresIn:
        jwtConfig.refreshTokenExpiresIn as jwt.SignOptions["expiresIn"],
    };

    return jwt.sign(payload, jwtConfig.secret, options);
  }

  /**
   * Generate token pair and store in Redis
   */
  static async generateTokenPair(
    userId: string,
    email: string,
    role: UserRole
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, email, role);

    const accessExpiresIn = getExpiresInSeconds(jwtConfig.accessTokenExpiresIn);
    const refreshExpiresIn = getExpiresInSeconds(
      jwtConfig.refreshTokenExpiresIn
    );

    const now = Math.floor(Date.now() / 1000);

    // Store access token in Redis
    const accessTokenData: StoredToken = {
      userId,
      email,
      role,
      issuedAt: now,
      expiresAt: now + accessExpiresIn,
    };

    // Store refresh token in Redis
    const refreshTokenData: StoredToken = {
      userId,
      email,
      role,
      issuedAt: now,
      expiresAt: now + refreshExpiresIn,
    };

    // Store tokens in Redis with expiration
    await Promise.all([
      redis.setex(
        `${ACCESS_TOKEN_PREFIX}${accessToken}`,
        accessExpiresIn,
        JSON.stringify(accessTokenData)
      ),
      redis.setex(
        `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
        refreshExpiresIn,
        JSON.stringify(refreshTokenData)
      ),
      // Store token references for user (for logout all sessions)
      redis.sadd(`${USER_TOKENS_PREFIX}${userId}`, accessToken, refreshToken),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  /**
   * Verify access token
   */
  static async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      // First verify the JWT signature
      const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

      if (decoded.type !== "access") {
        return null;
      }

      // Check if token exists in Redis (stateful validation)
      const storedToken = await redis.get(`${ACCESS_TOKEN_PREFIX}${token}`);

      if (!storedToken) {
        return null; // Token has been invalidated
      }

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      // First verify the JWT signature
      const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

      if (decoded.type !== "refresh") {
        return null;
      }

      // Check if token exists in Redis (stateful validation)
      const storedToken = await redis.get(`${REFRESH_TOKEN_PREFIX}${token}`);

      if (!storedToken) {
        return null; // Token has been invalidated
      }

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Invalidate access token
   */
  static async invalidateAccessToken(token: string): Promise<void> {
    await redis.del(`${ACCESS_TOKEN_PREFIX}${token}`);
  }

  /**
   * Invalidate refresh token
   */
  static async invalidateRefreshToken(token: string): Promise<void> {
    await redis.del(`${REFRESH_TOKEN_PREFIX}${token}`);
  }

  /**
   * Invalidate both tokens (logout)
   */
  static async invalidateTokens(
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    const keysToDelete = [`${ACCESS_TOKEN_PREFIX}${accessToken}`];

    if (refreshToken) {
      keysToDelete.push(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
    }

    await redis.del(...keysToDelete);
  }

  /**
   * Invalidate all user tokens (logout from all devices)
   */
  static async invalidateAllUserTokens(userId: string): Promise<void> {
    const userTokensKey = `${USER_TOKENS_PREFIX}${userId}`;
    const tokens = await redis.smembers(userTokensKey);

    if (tokens.length > 0) {
      const keysToDelete = tokens.flatMap((token) => [
        `${ACCESS_TOKEN_PREFIX}${token}`,
        `${REFRESH_TOKEN_PREFIX}${token}`,
      ]);

      await redis.del(...keysToDelete, userTokensKey);
    }
  }

  /**
   * Decode token without verification (for getting payload from expired token)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
