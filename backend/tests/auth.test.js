const request = require("supertest");
const app = require("../app");
const { User } = require("../models");
const bcrypt = require("bcrypt");
require("./testDB");

describe("Authentication Tests", () => {
  const validUser = {
    username: `testuser${Date.now()}@mail.com`,
    password: "Test123456",
    firstName: "Test",
    lastName: "User",
  };

  const weakPasswordUser = {
    username: `weak${Date.now()}@mail.com`,
    password: "weak",
    firstName: "Weak",
    lastName: "User",
  };

  afterEach(async () => {
    // Clean up test users
    await User.deleteMany({ username: { $regex: /test|weak/ } });
  });

  describe("POST /api/v1/user/signup", () => {
    it("should register a new user with valid data", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.userId).toBeDefined();
      expect(res.body.message).toMatch(/registered/i);
    });

    it("should hash the password with bcrypt", async () => {
      await request(app).post("/api/v1/user/signup").send(validUser);

      const user = await User.findOne({ username: validUser.username });
      expect(user).toBeDefined();
      expect(user.password).not.toBe(validUser.password);
      
      // Verify it's a bcrypt hash
      const isValidHash = await bcrypt.compare(validUser.password, user.password);
      expect(isValidHash).toBe(true);
    });

    it("should reject weak passwords (less than 8 characters)", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(weakPasswordUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/password/i);
    });

    it("should reject passwords without uppercase letter", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          ...validUser,
          password: "test123456",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/uppercase/i);
    });

    it("should reject passwords without lowercase letter", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          ...validUser,
          password: "TEST123456",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/lowercase/i);
    });

    it("should reject passwords without number", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          ...validUser,
          password: "TestPassword",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/number/i);
    });

    it("should reject duplicate email", async () => {
      await request(app).post("/api/v1/user/signup").send(validUser);
      
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/already in use/i);
    });

    it("should create account with $1000 USD balance", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);

      const { Account } = require("../models");
      const account = await Account.findOne({ userId: res.body.userId });
      
      expect(account).toBeDefined();
      expect(account.balances.USD).toBe(1000);
    });

    it("should generate verification token", async () => {
      await request(app).post("/api/v1/user/signup").send(validUser);

      const user = await User.findOne({ username: validUser.username });
      expect(user.verificationToken).toBeDefined();
      expect(user.emailVerified).toBe(false);
    });
  });

  describe("POST /api/v1/user/signin", () => {
    beforeEach(async () => {
      // Create a user for signin tests
      await request(app).post("/api/v1/user/signup").send(validUser);
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/v1/user/signin")
        .send({
          username: validUser.username,
          password: validUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.message).toMatch(/successful/i);
    });

    it("should reject incorrect password", async () => {
      const res = await request(app)
        .post("/api/v1/user/signin")
        .send({
          username: validUser.username,
          password: "WrongPassword123",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should reject non-existent user", async () => {
      const res = await request(app)
        .post("/api/v1/user/signin")
        .send({
          username: "nonexistent@mail.com",
          password: "Test123456",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should store refresh token in database", async () => {
      const res = await request(app)
        .post("/api/v1/user/signin")
        .send({
          username: validUser.username,
          password: validUser.password,
        });

      const user = await User.findOne({ username: validUser.username });
      expect(user.refreshTokens).toContain(res.body.refreshToken);
    });
  });

  describe("POST /api/v1/user/refresh", () => {
    let refreshToken;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);
      refreshToken = res.body.refreshToken;
    });

    it("should generate new access token with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/user/refresh")
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it("should reject invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/user/refresh")
        .send({ refreshToken: "invalid.token.here" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should reject missing refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/user/refresh")
        .send({});

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/required/i);
    });
  });

  describe("POST /api/v1/user/logout", () => {
    let accessToken, refreshToken;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it("should logout and remove refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/user/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);

      // Verify refresh token is removed
      const user = await User.findOne({ username: validUser.username });
      expect(user.refreshTokens).not.toContain(refreshToken);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/v1/user/logout")
        .send({ refreshToken });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/user/getUser", () => {
    let accessToken;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send(validUser);
      accessToken = res.body.accessToken;
    });

    it("should get user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/v1/user/getUser")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe(validUser.username);
      expect(res.body.firstName).toBe(validUser.firstName);
      expect(res.body.lastName).toBe(validUser.lastName);
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/api/v1/user/getUser");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/token missing/i);
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/user/getUser")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/invalid token/i);
    });
  });
});
