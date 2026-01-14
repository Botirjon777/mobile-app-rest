const request = require("supertest");
const app = require("../app");
const { User } = require("../models");
const crypto = require("crypto");
require("./testDB");

jest.setTimeout(15000);

describe("Email Verification Tests", () => {
  let token, userId, verificationToken;
  const timestamp = Date.now();
  
  const userData = {
    username: `emailtest${timestamp}@mail.com`,
    password: "Email123",
    firstName: "Email",
    lastName: "Test",
  };

  beforeAll(async () => {
    // Clean up first
    await User.deleteMany({ username: { $regex: /emailtest|unique/ } });
  });

  beforeEach(async () => {
    // Create fresh user for each test
    const res = await request(app)
      .post("/api/v1/user/signup")
      .send({
        username: `emailtest${Date.now()}@mail.com`,
        password: "Email123",
        firstName: "Email",
        lastName: "Test",
      });
    
    token = res.body.accessToken;
    userId = res.body.userId;

    const user = await User.findById(userId);
    if (user) {
      verificationToken = user.verificationToken;
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (userId) {
      await User.findByIdAndDelete(userId);
    }
  });

  afterAll(async () => {
    await User.deleteMany({ username: { $regex: /emailtest|unique/ } });
  });

  describe("Verification Token Generation", () => {
    it("should generate verification token on signup", async () => {
      const user = await User.findById(userId);
      
      expect(user).not.toBeNull();
      expect(user.verificationToken).toBeDefined();
      expect(user.verificationToken).toHaveLength(64); // 32 bytes hex = 64 chars
    });

    it("should set emailVerified to false on signup", async () => {
      const user = await User.findById(userId);
      expect(user).not.toBeNull();
      expect(user.emailVerified).toBe(false);
    });

    it("should generate unique tokens", async () => {
      const user1 = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `unique1${Date.now()}@mail.com`,
          password: "Unique123",
          firstName: "Unique",
          lastName: "One",
        });

      const user2 = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `unique2${Date.now()}@mail.com`,
          password: "Unique123",
          firstName: "Unique",
          lastName: "Two",
        });

      const dbUser1 = await User.findById(user1.body.userId);
      const dbUser2 = await User.findById(user2.body.userId);

      expect(dbUser1).not.toBeNull();
      expect(dbUser2).not.toBeNull();
      expect(dbUser1.verificationToken).not.toBe(dbUser2.verificationToken);

      // Cleanup
      await User.findByIdAndDelete(user1.body.userId);
      await User.findByIdAndDelete(user2.body.userId);
    });
  });

  describe("GET /api/v1/user/verify-email/:token", () => {
    it("should verify email with valid token", async () => {
      const res = await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/verified/i);
    });

    it("should set emailVerified to true", async () => {
      await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);

      const user = await User.findById(userId);
      expect(user).not.toBeNull();
      expect(user.emailVerified).toBe(true);
    });

    it("should clear verification token after verification", async () => {
      await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);

      const user = await User.findById(userId);
      expect(user).not.toBeNull();
      expect(user.verificationToken).toBeUndefined();
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/user/verify-email/invalidtoken123");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should reject already used token", async () => {
      // Verify once
      await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);

      // Try to verify again with same token
      const res = await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /api/v1/user/resend-verification", () => {
    it("should resend verification email", async () => {
      const res = await request(app)
        .post("/api/v1/user/resend-verification")
        .set("Authorization", `Bearer ${token}`);

      // If email service is configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/sent/i);
      } else {
        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch(/not configured/i);
      }
    });

    it("should generate new verification token", async () => {
      const oldToken = verificationToken;

      await request(app)
        .post("/api/v1/user/resend-verification")
        .set("Authorization", `Bearer ${token}`);

      const user = await User.findById(userId);
      expect(user).not.toBeNull();
      expect(user.verificationToken).toBeDefined();
      expect(user.verificationToken).not.toBe(oldToken);
    });

    it("should reject if email already verified", async () => {
      // Verify email first
      await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);

      // Try to resend
      const res = await request(app)
        .post("/api/v1/user/resend-verification")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already verified/i);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/v1/user/resend-verification");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("Email Verification Flow", () => {
    it("should complete full verification flow", async () => {
      // 1. Signup (already done in beforeEach)
      const user1 = await User.findById(userId);
      expect(user1).not.toBeNull();
      expect(user1.emailVerified).toBe(false);
      expect(user1.verificationToken).toBeDefined();

      // 2. Verify email
      const verifyRes = await request(app)
        .get(`/api/v1/user/verify-email/${verificationToken}`);
      expect(verifyRes.statusCode).toBe(200);

      // 3. Check user is verified
      const user2 = await User.findById(userId);
      expect(user2).not.toBeNull();
      expect(user2.emailVerified).toBe(true);
      expect(user2.verificationToken).toBeUndefined();

      // 4. Cannot resend verification
      const resendRes = await request(app)
        .post("/api/v1/user/resend-verification")
        .set("Authorization", `Bearer ${token}`);
      expect(resendRes.statusCode).toBe(400);
    });
  });
});
