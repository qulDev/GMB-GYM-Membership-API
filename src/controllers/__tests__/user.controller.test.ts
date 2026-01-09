import { Request, Response, NextFunction } from "express";
import { UserController } from "../user.controller";
import { UserService, UserServiceError } from "../../services";
import { ResponseHelper } from "../../utils";

jest.mock("../../services", () => {
  const actual = jest.requireActual("../../services");
  return {
    ...actual,
    UserService: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      listUsers: jest.fn(),
      getUserById: jest.fn(),
    },
  };
});

describe("UserController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: "user123",
        email: "test@example.com",
        role: "USER",
        type: "access" as const,
      },
    };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(ResponseHelper, "success");
    jest.spyOn(ResponseHelper, "error");
    jest.spyOn(ResponseHelper, "validationError");
    jest.spyOn(ResponseHelper, "notFound");
    jest.spyOn(ResponseHelper, "internalError");
  });

  const mockUser = {
    id: "user123",
    email: "test@example.com",
    fullName: "Test User",
    phone: "+1234567890",
    role: "USER",
    isActive: true,
  };

  describe("getProfile", () => {
    it("should return user profile successfully", async () => {
      (UserService.getProfile as jest.Mock).mockResolvedValue(mockUser);

      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getProfile).toHaveBeenCalledWith("user123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockUser,
        200
      );
    });

    it("should return 404 when user not found", async () => {
      (UserService.getProfile as jest.Mock).mockRejectedValue(
        new UserServiceError("User not found", "NOT_FOUND")
      );

      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "User not found"
      );
    });

    it("should return 500 on internal error", async () => {
      (UserService.getProfile as jest.Mock).mockRejectedValue(
        new UserServiceError("Internal error", "INTERNAL")
      );

      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Internal error"
      );
    });

    it("should call next on unexpected error", async () => {
      const error = new Error("Unexpected error");
      (UserService.getProfile as jest.Mock).mockRejectedValue(error);

      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateProfile", () => {
    const updateData = {
      fullName: "Updated Name",
      phone: "+9876543210",
    };

    it("should update user profile successfully", async () => {
      mockRequest.body = updateData;
      const updatedUser = { ...mockUser, ...updateData };
      (UserService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

      await UserController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.updateProfile).toHaveBeenCalledWith(
        "user123",
        updateData
      );
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        updatedUser,
        200
      );
    });

    it("should call next on unexpected error", async () => {
      mockRequest.body = updateData;
      const error = new Error("Unexpected");
      (UserService.updateProfile as jest.Mock).mockRejectedValue(error);

      await UserController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should return 404 when user not found", async () => {
      mockRequest.body = updateData;
      (UserService.updateProfile as jest.Mock).mockRejectedValue(
        new UserServiceError("User not found", "NOT_FOUND")
      );

      await UserController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "User not found"
      );
    });
  });

  describe("listUsers", () => {
    const mockUserList = {
      users: [mockUser],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it("should list users with pagination", async () => {
      mockRequest.query = { page: "1", limit: "10" };
      (UserService.listUsers as jest.Mock).mockResolvedValue(mockUserList);

      await UserController.listUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.listUsers).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockUserList,
        200
      );
    });

    it("should list users with search filter", async () => {
      mockRequest.query = { search: "test", page: "1", limit: "10" };
      (UserService.listUsers as jest.Mock).mockResolvedValue(mockUserList);

      await UserController.listUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.listUsers).toHaveBeenCalled();
      expect(ResponseHelper.success).toHaveBeenCalled();
    });

    it("should return validation error for invalid query params", async () => {
      mockRequest.query = { page: "invalid" };

      await UserController.listUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should get user by ID successfully", async () => {
      mockRequest.params = { userId: "user123" };
      (UserService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await UserController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getUserById).toHaveBeenCalledWith("user123");
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockUser,
        200
      );
    });

    it("should return 404 when user not found", async () => {
      mockRequest.params = { userId: "nonexistent" };
      (UserService.getUserById as jest.Mock).mockRejectedValue(
        new UserServiceError("User not found", "NOT_FOUND")
      );

      await UserController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "User not found"
      );
    });

    it("should return validation error for invalid userId param", async () => {
      mockRequest.params = {}; // missing userId

      await UserController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });
});
