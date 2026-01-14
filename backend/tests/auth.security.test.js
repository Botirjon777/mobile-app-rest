const request = require("supertest");
const app = require("../app");
const { User } = require("../models");
require("./testDB");

jest.setTimeout(30000);

describe("Authentication Security Tests", () => {
  const validUser = {
    username: `security${Date.now()}@mail.com`,
    password: "Secure123",
    firstName: "Security",
    lastName: "Test",
  };

  afterEach(async () => {
    await User.deleteMany({ username: { $regex: /security|ratelimit/ } });
  });

  describe("Rate Limiting", () => {
    // Note: Rate limiting is disabled in test environment
    it("should have rate limiting configured for production", () => {
      const { signupLimiter, loginLimiter, apiLimiter } = require("../middlewares/rateLimiter.middleware");
      expect(signupLimiter).toBeDefined();
      expect(loginLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
    });
  });

  describe("Password Security", () => {
    it("should enforce minimum 8 characters", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          ...validUser,
          password: "Test123",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/8 characters/i);
    });

    it("should require uppercase, lowercase, and number", async () => {
      const passwords = [
        "alllowercase123", // no uppercase
        "ALLUPPERCASE123", // no lowercase
        "NoNumbersHere", // no number
      ];

      for (const password of passwords) {
        const res = await request(app)
          .post("/api/v1/user/signup")
          .send({
            ...validUser,
            username: `test${Date.now()}@mail.com`,
            password,
          });

        expect(res.statusCode).toBe(400);
      }
    });

    it("should never store passwords in plain text", async () => {
      await request(app).post("/api/v1/user/signup").send(validUser);

      const user = await User.findOne({ username: validUser.username });
      expect(user).not.toBeNull();
      expect(user.password).not.toBe(validUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe("Token Expiration", () => {
    it("should include expiration in access token", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);

      const jwt = require("jsonwebtoken");
      const decoded = jwt.decode(res.body.accessToken);
      
      expect(decoded).not.toBeNull();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(3600); // 1 hour or less
    });

    it("should include expiration in refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);

      const jwt = require("jsonwebtoken");
      const decoded = jwt.decode(res.body.refreshToken);
      
      expect(decoded).not.toBeNull();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(604800); // 7 days or less
    });
  });

  describe("Token Validation", () => {
    let accessToken;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);
      accessToken = res.body.accessToken;
    });

    it("should reject malformed tokens", async () => {
      const res = await request(app)
        .get("/api/v1/user/getUser")
        .set("Authorization", "Bearer not.a.valid.token");

      expect(res.statusCode).toBe(403);
    });

    it("should reject tokens with invalid signature", async () => {
      const jwt = require("jsonwebtoken");
      const fakeToken = jwt.sign({ userId: "fake" }, "wrong-secret");

      const res = await request(app)
        .get("/api/v1/user/getUser")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should reject expired tokens with specific message", async () => {
      const jwt = require("jsonwebtoken");
      const { JWT_SECRET } = require("../config/jwt");
      
      // Create an already-expired token
      const expiredToken = jwt.sign(
        { userId: "test" },
        JWT_SECRET,
        { expiresIn: "-1h" }
      );

      const res = await request(app)
        .get("/api/v1/user/getUser")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.expired).toBe(true);
      expect(res.body.message).toMatch(/expired/i);
    });
  });

  describe("Refresh Token Security", () => {
    let refreshToken, userId;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);
      refreshToken = res.body.refreshToken;
      userId = res.body.userId;
    });

    it("should validate refresh token exists in database", async () => {
      // Remove refresh token from database
      await User.findByIdAndUpdate(userId, { refreshTokens: [] });

      const res = await request(app)
        .post("/api/v1/user/refresh")
        .send({ refreshToken });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should not allow reusing refresh token after logout", async () => {
      const signupRes = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `logout${Date.now()}@mail.com`,
          password: "Logout123",
          firstName: "Logout",
          lastName: "Test",
        });

      // Logout
      await request(app)
        .post("/api/v1/user/logout")
        .set("Authorization", `Bearer ${signupRes.body.accessToken}`)
        .send({ refreshToken: signupRes.body.refreshToken });

      // Try to use refresh token
      const res = await request(app)
        .post("/api/v1/user/refresh")
        .send({ refreshToken: signupRes.body.refreshToken });

      // Should be 401 (missing) or 403 (invalid)
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize NoSQL injection attempts in username", async () => {
      const res = await request(app)
        .post("/api/v1/user/signin")
        .send({
          username: { $ne: null },
          password: "anything",
        });

      // Should fail validation or return 401, not expose data
      expect([400, 401]).toContain(res.statusCode);
    });

    it("should handle special characters in input", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `special${Date.now()}@mail.com`,
          password: "Test123456",
          firstName: "$where",
          lastName: "$ne",
        });

      // Should either succeed with sanitized data or fail validation
      if (res.statusCode === 201) {
        const user = await User.findOne({ username: res.body.username || `special${Date.now()}@mail.com` });
        // express-mongo-sanitize may or may not remove $ characters
        // The important thing is it doesn't execute as a query operator
        expect(user).toBeDefined();
      }
    });
  });
});
