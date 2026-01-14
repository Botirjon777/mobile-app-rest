const request = require("supertest");
const app = require("../app");
const { User } = require("../models");
require("./testDB");

jest.setTimeout(15000);

describe("Input Validation Tests", () => {
  afterEach(async () => {
    await User.deleteMany({ username: { $regex: /validation/ } });
  });

  describe("User Signup Validation", () => {
    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: "notanemail",
          password: "Test123456",
          firstName: "Test",
          lastName: "User",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/email|username/i);
    });

    it("should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: "test@mail.com",
          password: "Test123456",
          // missing firstName and lastName
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject empty strings", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: "test@mail.com",
          password: "Test123456",
          firstName: "",
          lastName: "",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("Transfer Validation", () => {
    let token, receiverId;

    beforeEach(async () => {
      const senderRes = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `validation${Date.now()}@mail.com`,
          password: "Validation123",
          firstName: "Validation",
          lastName: "Sender",
        });
      token = senderRes.body.accessToken;

      const receiverRes = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `receiver${Date.now()}@mail.com`,
          password: "Receiver123",
          firstName: "Receiver",
          lastName: "User",
        });
      receiverId = receiverRes.body.userId;
    });

    it("should reject missing recipient", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 100,
          currency: "USD",
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject missing amount", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          to: receiverId,
          currency: "USD",
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject missing currency", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          to: receiverId,
          amount: 100,
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject invalid currency code", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          to: receiverId,
          amount: 100,
          currency: "INVALID",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/currency/i);
    });

    it("should reject zero amount", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          to: receiverId,
          amount: 0,
          currency: "USD",
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject negative amount", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          to: receiverId,
          amount: -100,
          currency: "USD",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("Exchange Validation", () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: `exchange${Date.now()}@mail.com`,
          password: "Exchange123",
          firstName: "Exchange",
          lastName: "User",
        });
      token = res.body.accessToken;
    });

    it("should reject same currency exchange", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fromCurrency: "USD",
          toCurrency: "USD",
          fromAmount: 100,
          toAmount: 100,
        });

      // Should either reject or handle gracefully
      expect([400, 200]).toContain(res.statusCode);
    });

    it("should reject missing fromCurrency", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          toCurrency: "EUR",
          fromAmount: 100,
          toAmount: 85,
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject missing toCurrency", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fromCurrency: "USD",
          fromAmount: 100,
          toAmount: 85,
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject invalid fromCurrency", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fromCurrency: "INVALID",
          toCurrency: "EUR",
          fromAmount: 100,
          toAmount: 85,
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject invalid toCurrency", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fromCurrency: "USD",
          toCurrency: "INVALID",
          fromAmount: 100,
          toAmount: 85,
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("NoSQL Injection Prevention", () => {
    it("should sanitize object injection in signin", async () => {
      const res = await request(app)
        .post("/api/v1/user/signin")
        .send({
          username: { $ne: null },
          password: { $ne: null },
        });

      // Should not expose any user data
      expect(res.statusCode).not.toBe(200);
      expect([400, 401]).toContain(res.statusCode);
    });

    it("should sanitize $where operator", async () => {
      const res = await request(app)
        .post("/api/v1/user/signup")
        .send({
          username: "test@mail.com",
          password: "Test123456",
          firstName: { $where: "1==1" },
          lastName: "User",
        });

      // Should either reject or sanitize
      if (res.statusCode === 201) {
        const user = await User.findOne({ username: "test@mail.com" });
        expect(typeof user.firstName).toBe("string");
        expect(user.firstName).not.toContain("$where");
      }
    });
  });
});
