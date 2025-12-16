import { UserRole, UserStatus, Gender } from "../generated/prisma";

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

// User without password
export interface UserWithoutPassword {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: Date | null;
  gender: Gender | null;
  address: string | null;
  emergencyContact: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Response
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  tokens: AuthTokens;
}

// Register Input
export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
}

// Login Input
export interface LoginInput {
  email: string;
  password: string;
}

// Refresh Token Input
export interface RefreshTokenInput {
  refreshToken: string;
}

// Token Storage in Redis
export interface StoredToken {
  userId: string;
  email: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}
