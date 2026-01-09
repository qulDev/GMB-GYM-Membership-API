# Unit Tests Documentation

## Overview

This project includes comprehensive unit tests for all major components of the GMB (GYM Membership Backend) application. The tests are written using Jest and TypeScript.

## Test Structure

### Utilities Tests (`src/utils/__tests__/`)
- **password.helper.test.ts**: Tests for password hashing and comparison
- **response.helper.test.ts**: Tests for all response helper methods (success, error, validation, etc.)
- **jwt.helper.test.ts**: Tests for JWT token generation, verification, and invalidation

### Services Tests (`src/services/__tests__/`)
- **auth.service.test.ts**: Tests for authentication service (register, login, refresh token, logout, get profile)

### Controllers Tests (`src/controllers/__tests__/`)
- **auth.controller.test.ts**: Tests for authentication controller endpoints

### Middlewares Tests (`src/middlewares/__tests__/`)
- **auth.middleware.test.ts**: Tests for authentication, authorization, and optional authentication middlewares
- **error.middleware.test.ts**: Tests for global error handler and not found handler

### Repositories Tests (`src/models/__tests__/`)
- **user.repository.test.ts**: Tests for user repository methods (CRUD operations, pagination, search)

### Config Tests (`src/config/__tests__/`)
- **jwt.config.test.ts**: Tests for JWT configuration and expiration time conversion

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with verbose output
```bash
npm run test:verbose
```

## Test Coverage

The tests cover:
- ✅ All utility functions (JWT, Password, Response helpers)
- ✅ Authentication service and controller
- ✅ Authentication and authorization middlewares
- ✅ Error handling middlewares
- ✅ User repository operations
- ✅ JWT configuration functions

## Bugs Fixed

1. **Api_spec.json - ResponseLogList Schema**: Fixed incorrect structure where `data` was an array instead of an object containing `logs` array and `pagination` object.

2. **src/index.ts - Port Configuration**: Fixed port parsing to convert string from environment variable to number.

## Test Configuration

- **Test Framework**: Jest 30.2.0
- **TypeScript Support**: ts-jest 29.4.6
- **Test Environment**: Node.js
- **Coverage Reports**: Text, LCOV, HTML formats

## Mocking Strategy

Tests use mocks for:
- External dependencies (bcrypt, jsonwebtoken, ioredis)
- Prisma client operations
- Express Request/Response objects
- Service dependencies

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: External dependencies are mocked to ensure fast and reliable tests
3. **Coverage**: Tests cover both success and error scenarios
4. **Clear Naming**: Test names clearly describe what is being tested
5. **Arrange-Act-Assert**: Tests follow the AAA pattern for clarity

## Adding New Tests

When adding new features, follow these guidelines:

1. Create test files in the appropriate `__tests__` directory
2. Follow the existing naming convention (`*.test.ts`)
3. Mock external dependencies
4. Test both success and error cases
5. Ensure tests are isolated and can run independently
6. Update this README if adding new test categories

## Troubleshooting

### Tests fail due to Redis connection
- Redis is mocked in tests, so this shouldn't occur
- If you see Redis errors, ensure mocks are properly set up

### Tests fail due to Prisma client
- Prisma client is mocked in repository tests
- Ensure mocks return the expected structure

### TypeScript errors in tests
- Ensure `tsconfig.json` includes test files
- Check that all types are properly imported
