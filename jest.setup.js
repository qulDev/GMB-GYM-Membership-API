// Jest setup file
// Mock environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.MIDTRANS_CLIENT_KEY = "test-client-key";
process.env.MIDTRANS_SERVER_KEY = "test-server-key";
process.env.MIDTRANS_IS_PRODUCTION = "false";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
