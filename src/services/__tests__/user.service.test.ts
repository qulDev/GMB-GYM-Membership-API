import { UserService, UserServiceError } from "../user.service";
import { UserRepository } from "../../models";
import { Gender, UserRole, UserStatus } from "../../generated/prisma";

jest.mock("../../models", () => ({
  UserRepository: {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    emailExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    excludePassword: jest.fn(),
  },
}));

describe("UserService", () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    password: "hashedPassword",
    fullName: "Test User",
    phone: "+1234567890",
    dateOfBirth: new Date("1990-01-01"),
    gender: Gender.MALE,
    address: "123 Main St",
    emergencyContact: "+0987654321",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: mockUser.id,
    email: mockUser.email,
    fullName: mockUser.fullName,
    phone: mockUser.phone,
    dateOfBirth: mockUser.dateOfBirth,
    gender: mockUser.gender,
    address: mockUser.address,
    emergencyContact: mockUser.emergencyContact,
    role: mockUser.role,
    status: mockUser.status,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (UserRepository.excludePassword as jest.Mock).mockImplementation((user) => {
      const { password, ...rest } = user;
      return rest;
    });
  });

  describe("getProfile", () => {
    it("should get user profile successfully", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getProfile("user123");

      expect(result).toEqual(mockUserWithoutPassword);
      expect(UserRepository.findById).toHaveBeenCalledWith("user123");
      expect(UserRepository.excludePassword).toHaveBeenCalledWith(mockUser);
    });

    it("should throw NOT_FOUND error if user not found", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.getProfile("nonexistent")).rejects.toThrow(
        UserServiceError
      );
      await expect(UserService.getProfile("nonexistent")).rejects.toMatchObject(
        {
          message: "User not found",
          code: "NOT_FOUND",
        }
      );
    });
  });

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      const updateInput = {
        fullName: "Updated Name",
        phone: "+1111111111",
        dateOfBirth: "1995-05-05",
        gender: "female" as const,
        address: "New Address",
        emergencyContact: "+2222222222",
      };

      const updatedUser = {
        ...mockUser,
        fullName: updateInput.fullName,
        phone: updateInput.phone,
        dateOfBirth: new Date(updateInput.dateOfBirth),
        gender: Gender.FEMALE,
        address: updateInput.address,
        emergencyContact: updateInput.emergencyContact,
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      await UserService.updateProfile("user123", updateInput);

      expect(UserRepository.findById).toHaveBeenCalledWith("user123");
      expect(UserRepository.update).toHaveBeenCalledWith("user123", {
        fullName: updateInput.fullName,
        phone: updateInput.phone,
        dateOfBirth: expect.any(Date),
        gender: Gender.FEMALE,
        address: updateInput.address,
        emergencyContact: updateInput.emergencyContact,
      });
      expect(UserRepository.excludePassword).toHaveBeenCalledWith(updatedUser);
    });

    it("should update profile without optional fields", async () => {
      const updateInput = {
        fullName: "Updated Name",
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateInput,
      });

      await UserService.updateProfile("user123", updateInput);

      expect(UserRepository.update).toHaveBeenCalledWith("user123", {
        fullName: updateInput.fullName,
        phone: undefined,
        dateOfBirth: undefined,
        gender: undefined,
        address: undefined,
        emergencyContact: undefined,
      });
    });

    it("should throw NOT_FOUND error if user not found", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.updateProfile("nonexistent", { fullName: "Test" })
      ).rejects.toMatchObject({
        message: "User not found",
        code: "NOT_FOUND",
      });
    });
  });

  describe("listUsers", () => {
    it("should list users with pagination", async () => {
      const mockUsers = [mockUser];
      (UserRepository.findMany as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: 1,
      });

      const result = await UserService.listUsers({ page: 1, limit: 10 });

      expect(result.users).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(UserRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        status: undefined,
      });
    });

    it("should use default pagination values", async () => {
      (UserRepository.findMany as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      await UserService.listUsers({});

      expect(UserRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        status: undefined,
      });
    });

    it("should filter users by status", async () => {
      (UserRepository.findMany as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      await UserService.listUsers({ status: "active" });

      expect(UserRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        status: UserStatus.ACTIVE,
      });
    });

    it("should search users", async () => {
      (UserRepository.findMany as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      await UserService.listUsers({ search: "test" });

      expect(UserRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "test",
        status: undefined,
      });
    });

    it("should calculate totalPages correctly", async () => {
      (UserRepository.findMany as jest.Mock).mockResolvedValue({
        users: [mockUser],
        total: 25,
      });

      const result = await UserService.listUsers({ page: 1, limit: 10 });

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe("getUserById", () => {
    it("should get user by ID successfully", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserById("user123");

      expect(result).toEqual(mockUserWithoutPassword);
      expect(UserRepository.findById).toHaveBeenCalledWith("user123");
    });

    it("should throw NOT_FOUND error if user not found", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.getUserById("nonexistent")
      ).rejects.toMatchObject({
        message: "User not found",
        code: "NOT_FOUND",
      });
    });
  });
});
