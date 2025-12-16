import { User, Gender, UserRole, UserStatus } from "../generated/prisma";
import { prisma } from "../config/database.config";

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: Gender;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;
  emergencyContact?: string;
  status?: UserStatus;
}

export class UserRepository {
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Create new user
   */
  static async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        role: data.role || "USER",
        status: data.status || "ACTIVE",
      },
    });
  }

  /**
   * Update user by ID
   */
  static async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user by ID
   */
  static async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get user without password
   */
  static excludePassword(user: User): Omit<User, "password"> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find users with pagination
   */
  static async findMany(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
  }): Promise<{ users: User[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (options.search) {
      where.OR = [
        { fullName: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options.status) {
      where.status = options.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }
}
