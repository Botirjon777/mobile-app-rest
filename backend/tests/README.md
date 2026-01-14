# Backend Test Suite

## Overview

Comprehensive test suite with **108 test cases** covering all backend functionality including authentication, security features, account operations, transaction limits, validation, and end-to-end user flows.

## Test Statistics

- **Total Tests**: 108
- **Test Files**: 8
- **Coverage Target**: 80%+
- **Status**: ✅ All tests passing

## Test Files

### 1. Authentication Tests (`auth.test.js`) - 21 tests

Tests core authentication functionality:

- User signup with password hashing (bcrypt)
- Password validation (8+ chars, uppercase, lowercase, number)
- User signin with credential verification
- Duplicate email prevention
- Account creation with $1000 USD initial balance
- Verification token generation
- Access and refresh token generation
- Token refresh flow
- Logout functionality
- User profile retrieval
- Authorization middleware

### 2. Security Tests (`auth.security.test.js`) - 13 tests

Tests security features and protections:

- Password security requirements enforcement
- JWT token expiration (1h access, 7d refresh)
- Token validation (malformed, invalid signature, expired)
- Refresh token security and database validation
- Input sanitization and NoSQL injection prevention
- Rate limiting configuration verification

### 3. Account Tests (`account.test.js`) - 17 tests

Tests account operations and transactions:

- Balance retrieval for all currencies
- Money transfers between users
- Currency exchanges
- Sender and receiver balance updates
- Insufficient funds handling
- Invalid currency rejection
- Negative amount rejection
- Transaction record creation
- MongoDB transaction atomicity and rollback

### 4. Transaction Limits Tests (`transaction-limits.test.js`) - 15 tests

Tests transaction limit enforcement:

- Single transaction limit ($10,000 USD)
- Daily transaction limit ($50,000 USD)
- Currency conversion for limit checking
- Daily total tracking
- Daily limit reset at midnight
- Validation schema limits
- Positive amount validation

### 5. Validation Tests (`validation.test.js`) - 20 tests

Tests input validation across all endpoints:

- Email format validation
- Required field validation
- Empty string rejection
- Transfer validation (recipient, amount, currency)
- Exchange validation (currencies, amounts)
- Zero/negative amount rejection
- Invalid currency code rejection
- NoSQL injection prevention

### 6. Email Verification Tests (`email-verification.test.js`) - 15 tests

Tests email verification flow:

- Verification token generation (64-char hex)
- Token uniqueness
- Email verification endpoint
- emailVerified flag updates
- Token clearing after verification
- Invalid token rejection
- Resend verification functionality
- Already verified email handling
- Complete verification flow

### 7. Integration Tests (`integration/user-flow.test.js`) - 16 tests

End-to-end user journey testing:

1. User signup
2. Profile retrieval
3. Balance check
4. User search
5. Money transfer
6. Balance verification (sender & receiver)
7. Currency exchange
8. Balance verification (multiple currencies)
9. Transaction history
10. Token refresh
11. New token usage
12. Logout
13. Refresh token invalidation
14. Re-signin

### 8. Transaction Tests (`transaction.test.js`) - 2 tests

Tests transaction history endpoints:

- Unauthorized access rejection
- Non-existent transaction handling

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- auth.test.js
npm test -- account.test.js
npm test -- auth.security.test.js
npm test -- transaction-limits.test.js
npm test -- validation.test.js
npm test -- email-verification.test.js
npm test -- integration/user-flow.test.js
npm test -- transaction.test.js
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm test -- --watch
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Test Environment**: Node.js
- **Timeout**: 15 seconds
- **Max Workers**: 1 (serial execution to avoid conflicts)
- **Coverage Directory**: `coverage/`
- **Coverage Thresholds**:
  - Branches: 70%
  - Functions: 75%
  - Lines: 80%
  - Statements: 80%

### Rate Limiting in Tests

Rate limiting is **automatically disabled** in test environment to prevent 429 errors:

- Detected via `process.env.NODE_ENV === "test"` or `process.env.JEST_WORKER_ID`
- Allows unlimited requests during testing
- Production rate limits remain active in non-test environments

## Test Database

Tests use a separate test database configured in `testDB.js`:

- Connects to MongoDB test instance
- Automatically cleans up after tests
- Isolated from production/development data

## What's Tested

### ✅ Authentication & Authorization

- Password hashing with bcrypt (10 salt rounds)
- JWT token generation and validation
- Token expiration handling
- Refresh token flow
- Logout and token revocation

### ✅ Security Features

- Password strength requirements
- Rate limiting (disabled in tests, verified configured)
- Input sanitization (express-mongo-sanitize)
- NoSQL injection prevention
- Helmet.js security headers
- CORS configuration

### ✅ Account Operations

- Multi-currency balance management (10 currencies)
- Money transfers with validation
- Currency exchanges
- Transaction atomicity
- Insufficient funds handling

### ✅ Transaction Limits

- Single transaction limit ($10,000 USD)
- Daily transaction limit ($50,000 USD)
- Currency conversion to USD for limits
- Daily total tracking and reset

### ✅ Input Validation

- Email format validation
- Password strength validation
- Required field validation
- Currency code validation
- Amount validation (positive, within limits)
- NoSQL injection prevention

### ✅ Email Verification

- Verification token generation
- Email verification flow
- Resend verification
- Token expiration and invalidation

### ✅ End-to-End Flows

- Complete user journey from signup to logout
- Multi-step transactions
- Token refresh flow
- Re-authentication

## Coverage Goals

- **Overall**: 80%+ code coverage
- **Controllers**: 90%+ coverage
- **Middlewares**: 95%+ coverage
- **Utilities**: 90%+ coverage
- **Models**: 80%+ coverage

## CI/CD Integration

Tests are designed for CI/CD pipelines:

- Fast execution (all tests run in ~2-3 minutes)
- No external dependencies required
- Automatic cleanup
- Clear pass/fail indicators
- Coverage reports generated

## Troubleshooting

### Tests Failing with 429 Errors

- Ensure `JEST_WORKER_ID` is set (automatically set by Jest)
- Verify rate limiting is disabled in test environment
- Check `middlewares/rateLimiter.middleware.js` for test environment check

### Database Connection Issues

- Ensure MongoDB is running
- Check `MONGO_URL` in environment variables
- Verify test database is accessible

### Timeout Errors

- Increase timeout in `jest.config.js` if needed
- Check for slow database operations
- Ensure proper cleanup in `afterEach`/`afterAll` hooks

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Use descriptive test names
3. Clean up test data in `afterEach` or `afterAll`
4. Ensure tests are isolated and don't depend on execution order
5. Add tests to appropriate test file or create new file if needed
6. Update this README with new test information

## Test Maintenance

- Run tests before committing code
- Keep tests up to date with code changes
- Maintain high coverage (80%+)
- Review and update tests when adding new features
- Remove obsolete tests when removing features
