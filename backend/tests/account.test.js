const request = require("supertest");
const app = require("../app");
const { User, Account } = require("../models");
const Transaction = require("../models/transactionModel");
require("./testDB");

jest.setTimeout(20000);

describe("Account Tests", () => {
  let senderToken, receiverId, senderId;

  const senderData = {
    username: `sender${Date.now()}@mail.com`,
    password: "Sender123",
    firstName: "Sender",
    lastName: "User",
  };

  const receiverData = {
    username: `receiver${Date.now()}@mail.com`,
    password: "Receiver123",
    firstName: "Receiver",
    lastName: "User",
  };

  beforeAll(async () => {
    // Clean up first
    await User.deleteMany({ username: { $regex: /sender|receiver|account/ } });
    await Account.deleteMany({});
    await Transaction.deleteMany({});

    // Create sender
    const senderRes = await request(app)
      .post("/api/v1/user/signup")
      .send(senderData);
    senderToken = senderRes.body.accessToken;
    senderId = senderRes.body.userId;

    // Create receiver
    const receiverRes = await request(app)
      .post("/api/v1/user/signup")
      .send(receiverData);
    receiverId = receiverRes.body.userId;
  });

  afterAll(async () => {
    await User.deleteMany({ username: { $regex: /sender|receiver|account/ } });
    await Account.deleteMany({});
    await Transaction.deleteMany({});
  });

  describe("GET /api/v1/account/balance", () => {
    it("should get balance for authenticated user", async () => {
      const res = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.balances).toBeDefined();
      expect(res.body.balances.USD).toBe(1000);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/v1/account/balance");

      expect(res.statusCode).toBe(401);
    });

    it("should return all currency balances", async () => {
      const res = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);

      const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "UZS", "CAD", "AUD", "CHF", "CNY"];
      currencies.forEach(currency => {
        expect(res.body.balances).toHaveProperty(currency);
      });
    });
  });

  describe("POST /api/v1/account/transfer", () => {
    it("should transfer money successfully", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: 100,
          currency: "USD",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/successful/i);
    });

    it("should update sender balance", async () => {
      const beforeRes = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);
      const beforeBalance = beforeRes.body.balances.USD;

      await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: 50,
          currency: "USD",
        });

      const afterRes = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);
      const afterBalance = afterRes.body.balances.USD;

      expect(afterBalance).toBe(beforeBalance - 50);
    });

    it("should update receiver balance", async () => {
      const receiverAccount = await Account.findOne({ userId: receiverId });
      const beforeBalance = receiverAccount.balances.USD;

      await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: 75,
          currency: "USD",
        });

      const updatedAccount = await Account.findOne({ userId: receiverId });
      expect(updatedAccount).not.toBeNull();
      expect(updatedAccount.balances.USD).toBe(beforeBalance + 75);
    });

    it("should reject transfer with insufficient funds", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: 5000, // Less than 10K limit but more than balance
          currency: "USD",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/insufficient|limit/i);
    });

    it("should reject transfer to non-existent user", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: "000000000000000000000000",
          amount: 50,
          currency: "USD",
        });

      expect([400, 404]).toContain(res.statusCode);
    });

    it("should reject invalid currency", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: 50,
          currency: "INVALID",
        });

      expect(res.statusCode).toBe(400);
    });

    it("should reject negative amounts", async () => {
      const res = await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: -50,
          currency: "USD",
        });

      expect(res.statusCode).toBe(400);
    });

    it("should create transaction record", async () => {
      await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: receiverId,
          amount: 25,
          currency: "USD",
        });

      const historyRes = await request(app)
        .get("/api/v1/transaction/history")
        .set("Authorization", `Bearer ${senderToken}`);

      expect(historyRes.body.transactions).toBeDefined();
      expect(historyRes.body.transactions.length).toBeGreaterThan(0);
      
      // Find the transaction with amount 25
      const transaction = historyRes.body.transactions.find(tx => tx.amount === 25);
      expect(transaction).toBeDefined();
      expect(transaction.type).toBe("send");
      expect(transaction.currency).toBe("USD");
    });
  });

  describe("POST /api/v1/account/exchange", () => {
    it("should exchange currency successfully", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          fromCurrency: "USD",
          toCurrency: "EUR",
          fromAmount: 100,
          toAmount: 85,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/successful/i);
    });

    it("should update balances correctly", async () => {
      const beforeRes = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);
      
      expect(beforeRes.body.balances).toBeDefined();
      const beforeUSD = beforeRes.body.balances.USD;
      const beforeEUR = beforeRes.body.balances.EUR;

      await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          fromCurrency: "USD",
          toCurrency: "EUR",
          fromAmount: 50,
          toAmount: 42.5,
        });

      const afterRes = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);

      expect(afterRes.body.balances.USD).toBe(beforeUSD - 50);
      expect(afterRes.body.balances.EUR).toBe(beforeEUR + 42.5);
    });

    it("should reject exchange with insufficient funds", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          fromCurrency: "USD",
          toCurrency: "EUR",
          fromAmount: 5000, // Less than limit but more than balance
          toAmount: 4250,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/insufficient|limit/i);
    });

    it("should reject invalid currencies", async () => {
      const res = await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          fromCurrency: "INVALID",
          toCurrency: "EUR",
          fromAmount: 100,
          toAmount: 85,
        });

      expect(res.statusCode).toBe(400);
    });

    it("should create transaction record", async () => {
      await request(app)
        .post("/api/v1/account/exchange")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          fromCurrency: "USD",
          toCurrency: "GBP",
          fromAmount: 30,
          toAmount: 22,
        });

      const historyRes = await request(app)
        .get("/api/v1/transaction/history")
        .set("Authorization", `Bearer ${senderToken}`);

      const exchangeTransaction = historyRes.body.transactions.find(
        tx => tx.type === "exchange" && tx.amount === 30 && tx.currency === "USD"
      );

      expect(exchangeTransaction).toBeDefined();
      if (exchangeTransaction) {
        expect(exchangeTransaction.targetName).toMatch(/GBP/);
      }
    });
  });

  describe("Transaction Atomicity", () => {
    it("should rollback on error", async () => {
      const beforeRes = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);
      
      expect(beforeRes.body.balances).toBeDefined();
      const beforeBalance = beforeRes.body.balances.USD;

      // Try to transfer to invalid user
      await request(app)
        .post("/api/v1/account/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          to: "invalid_id",
          amount: 50,
          currency: "USD",
        });

      const afterRes = await request(app)
        .get("/api/v1/account/balance")
        .set("Authorization", `Bearer ${senderToken}`);

      // Balance should remain unchanged
      expect(afterRes.body.balances.USD).toBe(beforeBalance);
    });
  });
});
