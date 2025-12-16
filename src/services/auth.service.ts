import { Gender } from "../generated/prisma";
import { UserRepository } from "../models";
import { PasswordHelper, JwtHelper } from "../utils";
import {
  AuthResponse,
  RegisterInput,
  LoginInput,
  UserWithoutPassword,
} from "../types";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "CONFLICT"
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "BAD_REQUEST"
      | "INTERNAL"
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const emailExists = await UserRepository.emailExists(input.email);

    if (emailExists) {
      throw new AuthServiceError(
        "User with this email already exists",
        "CONFLICT"
      );
    }

    // Hash password
    const hashedPassword = await PasswordHelper.hash(input.password);

    // Map gender to enum
    let gender: Gender | undefined;
    if (input.gender) {
      gender = input.gender.toUpperCase() as Gender;
    }

    // Parse date of birth
    let dateOfBirth: Date | undefined;
    if (input.dateOfBirth) {
      dateOfBirth = new Date(input.dateOfBirth);
    }

    // Create user
    const user = await UserRepository.create({
      email: input.email,
      password: hashedPassword,
      fullName: input.fullName,
      phone: input.phone,
      dateOfBirth,
      gender,
    });

    // Generate tokens
    const tokens = await JwtHelper.generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    // Return response without password
    const userWithoutPassword = UserRepository.excludePassword(
      user
    ) as UserWithoutPassword;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Login user
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await UserRepository.findByEmail(input.email);

    if (!user) {
      throw new AuthServiceError("Invalid email or password", "UNAUTHORIZED");
    }

    // Check if user is active
    if (user.status !== "ACTIVE") {
      throw new AuthServiceError(
        "Your account has been suspended or deactivated",
        "UNAUTHORIZED"
      );
    }

    // Verify password
    const isPasswordValid = await PasswordHelper.compare(
      input.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AuthServiceError("Invalid email or password", "UNAUTHORIZED");
    }

    // Generate tokens
    const tokens = await JwtHelper.generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    // Return response without password
    const userWithoutPassword = UserRepository.excludePassword(
      user
    ) as UserWithoutPassword;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Refresh tokens
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Verify refresh token
    const payload = await JwtHelper.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new AuthServiceError(
        "Invalid or expired refresh token",
        "UNAUTHORIZED"
      );
    }

    // Get user
    const user = await UserRepository.findById(payload.userId);

    if (!user) {
      throw new AuthServiceError("User not found", "NOT_FOUND");
    }

    // Check if user is active
    if (user.status !== "ACTIVE") {
      throw new AuthServiceError(
        "Your account has been suspended or deactivated",
        "UNAUTHORIZED"
      );
    }

    // Invalidate old refresh token
    await JwtHelper.invalidateRefreshToken(refreshToken);

    // Generate new token pair
    const tokens = await JwtHelper.generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    // Return response without password
    const userWithoutPassword = UserRepository.excludePassword(
      user
    ) as UserWithoutPassword;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Logout user
   */
  static async logout(accessToken: string): Promise<void> {
    // Invalidate access token
    await JwtHelper.invalidateAccessToken(accessToken);

    // Try to decode and invalidate related tokens
    const payload = JwtHelper.decodeToken(accessToken);
    if (payload?.userId) {
      // Optionally invalidate all user tokens
      // await JwtHelper.invalidateAllUserTokens(payload.userId);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(userId: string): Promise<UserWithoutPassword> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AuthServiceError("User not found", "NOT_FOUND");
    }

    return UserRepository.excludePassword(user) as UserWithoutPassword;
  }
}
