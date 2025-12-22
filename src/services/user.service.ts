import { Gender, UserStatus } from "../generated/prisma";
import { UserRepository } from "../models";
import {
  UpdateProfileInput,
  AdminUpdateUserInput,
  UserListQuery,
  UserListResponse,
} from "../types";
import { UserWithoutPassword } from "../types";

export class UserServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "BAD_REQUEST"
      | "CONFLICT"
      | "INTERNAL"
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<UserWithoutPassword> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new UserServiceError("User not found", "NOT_FOUND");
    }

    return UserRepository.excludePassword(user) as UserWithoutPassword;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserWithoutPassword> {
    // Check if user exists
    const existingUser = await UserRepository.findById(userId);

    if (!existingUser) {
      throw new UserServiceError("User not found", "NOT_FOUND");
    }

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

    // Update user
    const updatedUser = await UserRepository.update(userId, {
      fullName: input.fullName,
      phone: input.phone,
      dateOfBirth,
      gender,
      address: input.address,
      emergencyContact: input.emergencyContact,
    });

    return UserRepository.excludePassword(updatedUser) as UserWithoutPassword;
  }

  /**
   * List all users with pagination (Admin only)
   */
  static async listUsers(query: UserListQuery): Promise<UserListResponse> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Map status to enum
    let status: UserStatus | undefined;
    if (query.status) {
      status = query.status.toUpperCase() as UserStatus;
    }

    const { users, total } = await UserRepository.findMany({
      page,
      limit,
      search: query.search,
      status,
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    // Map users to remove password
    const usersWithoutPassword = users.map(
      (user) => UserRepository.excludePassword(user) as UserWithoutPassword
    );

    return {
      users: usersWithoutPassword,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get user by ID (Admin only)
   */
  static async getUserById(userId: string): Promise<UserWithoutPassword> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new UserServiceError("User not found", "NOT_FOUND");
    }

    return UserRepository.excludePassword(user) as UserWithoutPassword;
  }

  /**
   * Admin update user (can update status)
   */
  static async adminUpdateUser(
    userId: string,
    input: AdminUpdateUserInput
  ): Promise<UserWithoutPassword> {
    // Check if user exists
    const existingUser = await UserRepository.findById(userId);

    if (!existingUser) {
      throw new UserServiceError("User not found", "NOT_FOUND");
    }

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

    // Map status to enum
    let status: UserStatus | undefined;
    if (input.status) {
      status = input.status.toUpperCase() as UserStatus;
    }

    // Update user
    const updatedUser = await UserRepository.update(userId, {
      fullName: input.fullName,
      phone: input.phone,
      dateOfBirth,
      gender,
      address: input.address,
      emergencyContact: input.emergencyContact,
      status,
    });

    return UserRepository.excludePassword(updatedUser) as UserWithoutPassword;
  }

  /**
   * Delete user (Admin only)
   */
  static async deleteUser(userId: string): Promise<void> {
    // Check if user exists
    const existingUser = await UserRepository.findById(userId);

    if (!existingUser) {
      throw new UserServiceError("User not found", "NOT_FOUND");
    }

    // Prevent deleting admin user (optional safety check)
    if (existingUser.role === "ADMIN") {
      throw new UserServiceError("Cannot delete admin user", "FORBIDDEN");
    }

    await UserRepository.delete(userId);
  }
}
