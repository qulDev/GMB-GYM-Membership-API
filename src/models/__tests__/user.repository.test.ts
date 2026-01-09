import { UserRepository } from "../user.repository";
import { prisma } from "../../config/database.config";
import { UserRole, UserStatus, Gender } from "../../generated/prisma";

jest.mock("../../config/database.config", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("UserRepository", () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    password: "hashedPassword",
    fullName: "Test User",
    phone: "+1234567890",
    dateOfBirth: new Date("1990-01-01"),
    gender: Gender.MALE,
    address: null,
    emergencyContact: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should find user by ID", async () => {
      const userId = "user123";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserRepository.findById(userId);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it("should return null if user not found", async () => {
      const userId = "nonexistent";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await UserRepository.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find user by email (lowercase)", async () => {
      const email = "TEST@EXAMPLE.COM";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserRepository.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
      });
    });

    it("should return null if user not found", async () => {
      const email = "nonexistent@example.com";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await UserRepository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe("emailExists", () => {
    it("should return true if email exists", async () => {
      const email = "test@example.com";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user123",
      });

      const result = await UserRepository.emailExists(email);

      expect(result).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
    });

    it("should return false if email does not exist", async () => {
      const email = "nonexistent@example.com";
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await UserRepository.emailExists(email);

      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("should create user successfully", async () => {
      const createData = {
        email: "newuser@example.com",
        password: "hashedPassword",
        fullName: "New User",
        phone: "+1234567890",
        dateOfBirth: new Date("1990-01-01"),
        gender: Gender.MALE,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserRepository.create(createData);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: createData.email.toLowerCase(),
          password: createData.password,
          fullName: createData.fullName,
          phone: createData.phone,
          dateOfBirth: createData.dateOfBirth,
          gender: createData.gender,
          role: "USER",
          status: "ACTIVE",
        },
      });
    });

    it("should create user with default role and status", async () => {
      const createData = {
        email: "newuser@example.com",
        password: "hashedPassword",
        fullName: "New User",
        phone: "+1234567890",
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      await UserRepository.create(createData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "USER",
          status: "ACTIVE",
        }),
      });
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const userId = "user123";
      const updateData = {
        fullName: "Updated Name",
        phone: "+9876543210",
      };

      const updatedUser = { ...mockUser, ...updateData };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await UserRepository.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      const userId = "user123";
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserRepository.delete(userId);

      expect(result).toEqual(mockUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe("excludePassword", () => {
    it("should exclude password from user object", () => {
      const userWithPassword = {
        ...mockUser,
        password: "hashedPassword",
      };

      const result = UserRepository.excludePassword(userWithPassword);

      expect(result).not.toHaveProperty("password");
      expect(result).toHaveProperty("id", mockUser.id);
      expect(result).toHaveProperty("email", mockUser.email);
      expect(result).toHaveProperty("fullName", mockUser.fullName);
    });
  });

  describe("findMany", () => {
    it("should find users with pagination", async () => {
      const options = {
        page: 1,
        limit: 10,
      };

      const mockUsers = [mockUser];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await UserRepository.findMany(options);

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });

    it("should find users with search query", async () => {
      const options = {
        page: 1,
        limit: 10,
        search: "test",
      };

      const mockUsers = [mockUser];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await UserRepository.findMany(options);

      expect(result.users).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fullName: { contains: "test", mode: "insensitive" } },
            { email: { contains: "test", mode: "insensitive" } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should find users with status filter", async () => {
      const options = {
        page: 1,
        limit: 10,
        status: UserStatus.ACTIVE,
      };

      const mockUsers = [mockUser];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await UserRepository.findMany(options);

      expect(result.users).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          status: UserStatus.ACTIVE,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should use default pagination values", async () => {
      const options = {};

      const mockUsers = [mockUser];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await UserRepository.findMany(options);

      expect(result.users).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should calculate skip correctly for page > 1", async () => {
      const options = {
        page: 2,
        limit: 10,
      };

      const mockUsers = [mockUser];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(25);

      const result = await UserRepository.findMany(options);

      expect(result.users).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10, // (2 - 1) * 10
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
