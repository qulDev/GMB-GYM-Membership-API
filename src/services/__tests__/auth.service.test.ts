import { AuthService, AuthServiceError } from "../auth.service";
import { UserRepository } from "../../models/user.repository";
import { PasswordHelper } from "../../utils/password.helper";
import { JwtHelper } from "../../utils/jwt.helper";
import { UserRole, Gender } from "../../generated/prisma";

jest.mock("../../models/user.repository");
jest.mock("../../utils/password.helper");
jest.mock("../../utils/jwt.helper");

describe("AuthService", () => {
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
    status: "ACTIVE" as const,
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
  });

  describe("register", () => {
    const registerInput = {
      email: "test@example.com",
      password: "TestPassword123!",
      fullName: "Test User",
      phone: "+1234567890",
      dateOfBirth: "1990-01-01",
      gender: "male" as const,
    };

    it("should register user successfully", async () => {
      (UserRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (PasswordHelper.hash as jest.Mock).mockResolvedValue("hashedPassword");
      (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (JwtHelper.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900,
      });
      (UserRepository.excludePassword as jest.Mock).mockReturnValue(
        mockUserWithoutPassword
      );

      const result = await AuthService.register(registerInput);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.user).toEqual(mockUserWithoutPassword);
      expect(UserRepository.emailExists).toHaveBeenCalledWith(
        registerInput.email
      );
      expect(PasswordHelper.hash).toHaveBeenCalledWith(registerInput.password);
      expect(UserRepository.create).toHaveBeenCalled();
      expect(JwtHelper.generateTokenPair).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role
      );
    });

    it("should throw CONFLICT error if email already exists", async () => {
      (UserRepository.emailExists as jest.Mock).mockResolvedValue(true);

      await expect(AuthService.register(registerInput)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.register(registerInput)).rejects.toThrow(
        "User with this email already exists"
      );

      expect(UserRepository.emailExists).toHaveBeenCalledWith(
        registerInput.email
      );
      expect(PasswordHelper.hash).not.toHaveBeenCalled();
      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it("should handle optional fields", async () => {
      const registerInputMinimal = {
        email: "test@example.com",
        password: "TestPassword123!",
        fullName: "Test User",
        phone: "+1234567890",
      };

      (UserRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (PasswordHelper.hash as jest.Mock).mockResolvedValue("hashedPassword");
      (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (JwtHelper.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900,
      });
      (UserRepository.excludePassword as jest.Mock).mockReturnValue(
        mockUserWithoutPassword
      );

      const result = await AuthService.register(registerInputMinimal);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
    });
  });

  describe("login", () => {
    const loginInput = {
      email: "test@example.com",
      password: "TestPassword123!",
    };

    it("should login user successfully", async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (PasswordHelper.compare as jest.Mock).mockResolvedValue(true);
      (JwtHelper.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900,
      });
      (UserRepository.excludePassword as jest.Mock).mockReturnValue(
        mockUserWithoutPassword
      );

      const result = await AuthService.login(loginInput);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.user).toEqual(mockUserWithoutPassword);
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(
        loginInput.email
      );
      expect(PasswordHelper.compare).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password
      );
      expect(JwtHelper.generateTokenPair).toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED error if user not found", async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.login(loginInput)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(PasswordHelper.compare).not.toHaveBeenCalled();
      expect(JwtHelper.generateTokenPair).not.toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED error if password is incorrect", async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (PasswordHelper.compare as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.login(loginInput)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(JwtHelper.generateTokenPair).not.toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED error if user is inactive", async () => {
      const inactiveUser = {
        ...mockUser,
        status: "INACTIVE" as const,
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(inactiveUser);
      (PasswordHelper.compare as jest.Mock).mockResolvedValue(true);

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.login(loginInput)).rejects.toThrow(
        "Your account has been suspended or deactivated"
      );

      expect(JwtHelper.generateTokenPair).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    const refreshToken = "refresh-token";
    const mockPayload = {
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      type: "refresh" as const,
    };

    it("should refresh token successfully", async () => {
      (JwtHelper.verifyRefreshToken as jest.Mock).mockResolvedValue(
        mockPayload
      );
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (JwtHelper.invalidateRefreshToken as jest.Mock).mockResolvedValue(
        undefined
      );
      (JwtHelper.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresIn: 900,
      });
      (UserRepository.excludePassword as jest.Mock).mockReturnValue(
        mockUserWithoutPassword
      );

      const result = await AuthService.refreshToken(refreshToken);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(JwtHelper.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(UserRepository.findById).toHaveBeenCalledWith(mockPayload.userId);
      expect(JwtHelper.invalidateRefreshToken).toHaveBeenCalledWith(
        refreshToken
      );
      expect(JwtHelper.generateTokenPair).toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED error if refresh token is invalid", async () => {
      (JwtHelper.verifyRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        "Invalid or expired refresh token"
      );

      expect(UserRepository.findById).not.toHaveBeenCalled();
      expect(JwtHelper.generateTokenPair).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND error if user not found", async () => {
      (JwtHelper.verifyRefreshToken as jest.Mock).mockResolvedValue(
        mockPayload
      );
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        "User not found"
      );

      expect(JwtHelper.generateTokenPair).not.toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED error if user is inactive", async () => {
      const inactiveUser = {
        ...mockUser,
        status: "SUSPENDED" as const,
      };

      (JwtHelper.verifyRefreshToken as jest.Mock).mockResolvedValue(
        mockPayload
      );
      (UserRepository.findById as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        "Your account has been suspended or deactivated"
      );

      expect(JwtHelper.generateTokenPair).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    const accessToken = "access-token";

    it("should logout user successfully", async () => {
      (JwtHelper.invalidateAccessToken as jest.Mock).mockResolvedValue(
        undefined
      );
      (JwtHelper.decodeToken as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: "access" as const,
      });

      await AuthService.logout(accessToken);

      expect(JwtHelper.invalidateAccessToken).toHaveBeenCalledWith(
        accessToken
      );
      expect(JwtHelper.decodeToken).toHaveBeenCalledWith(accessToken);
    });

    it("should handle logout even if decode fails", async () => {
      (JwtHelper.invalidateAccessToken as jest.Mock).mockResolvedValue(
        undefined
      );
      (JwtHelper.decodeToken as jest.Mock).mockReturnValue(null);

      await AuthService.logout(accessToken);

      expect(JwtHelper.invalidateAccessToken).toHaveBeenCalledWith(
        accessToken
      );
    });
  });

  describe("getProfile", () => {
    it("should get user profile successfully", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.excludePassword as jest.Mock).mockReturnValue(
        mockUserWithoutPassword
      );

      const result = await AuthService.getProfile(mockUser.id);

      expect(result).toEqual(mockUserWithoutPassword);
      expect(UserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it("should throw NOT_FOUND error if user not found", async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.getProfile(mockUser.id)).rejects.toThrow(
        AuthServiceError
      );
      await expect(AuthService.getProfile(mockUser.id)).rejects.toThrow(
        "User not found"
      );
    });
  });
});
