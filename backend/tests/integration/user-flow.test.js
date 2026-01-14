const request = require("supertest");
const app = require("../../app"); // Fixed path
const { User, Account } = require("../../models"); // Fixed path
const Transaction = require("../../models/transactionModel"); // Fixed path
require("../testDB"); // Fixed path

jest.setTimeout(30000);

describe("End-to-End User Flow Integration Test", () => {
  const timestamp = Date.now();
  const user1Data = {
    username: `user1${timestamp}@mail.com`,
    password: "User1Pass123",
    firstName: "User",
    lastName: "One",
  };

  const user2Data = {
    username: `user2${timestamp}@mail.com`,
    password: "User2Pass123",
    firstName: "User",
    lastName: "Two",
  };

  let user1Token, user1RefreshToken, user1Id;
  let user2Token, user2Id;

  beforeAll(async () => {
    // Clean up before starting
    await User.deleteMany({ username: { $regex: /user1|user2/ } });
    await Account.deleteMany({});
    await Transaction.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({ username: { $regex: /user1|user2/ } });
    await Account.deleteMany({});
    await Transaction.deleteMany({});
  });

  it("Step 1: User 1 signs up", async () => {
    const res = await request(app)
      .post("/api/v1/user/signup")
      .send(user1Data);

    expect(res.statusCode).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.userId).toBeDefined();

    user1Token = res.body.accessToken;
    user1RefreshToken = res.body.refreshToken;
    user1Id = res.body.userId;
  });

  it("Step 2: User 1 gets their profile", async () => {
    const res = await request(app)
      .get("/api/v1/user/getUser")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(user1Data.username);
    expect(res.body.firstName).toBe(user1Data.firstName);
    expect(res.body.lastName).toBe(user1Data.lastName);
  });

  it("Step 3: User 1 checks their balance", async () => {
    const res = await request(app)
      .get("/api/v1/account/balance")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.balances.USD).toBe(1000);
  });

  it("Step 4: User 2 signs up", async () => {
    const res = await request(app)
      .post("/api/v1/user/signup")
      .send(user2Data);

    expect(res.statusCode).toBe(201);
    user2Token = res.body.accessToken;
    user2Id = res.body.userId;
  });

  it("Step 5: User 1 searches for User 2", async () => {
    const res = await request(app)
      .get(`/api/v1/user/bulk?filter=${user2Data.firstName}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBeGreaterThan(0);
    
    const foundUser = res.body.users.find(u => u.userid === user2Id);
    expect(foundUser).toBeDefined();
  });

  it("Step 6: User 1 transfers money to User 2", async () => {
    const res = await request(app)
      .post("/api/v1/account/transfer")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        to: user2Id,
        amount: 200,
        currency: "USD",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/successful/i);
  });

  it("Step 7: User 1 balance is reduced", async () => {
    const res = await request(app)
      .get("/api/v1/account/balance")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.balances.USD).toBe(800);
  });

  it("Step 8: User 2 balance is increased", async () => {
    const res = await request(app)
      .get("/api/v1/account/balance")
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.balances.USD).toBe(1200);
  });

  it("Step 9: User 1 exchanges USD to EUR", async () => {
    const res = await request(app)
      .post("/api/v1/account/exchange")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        fromCurrency: "USD",
        toCurrency: "EUR",
        fromAmount: 100,
        toAmount: 85,
      });

    expect(res.statusCode).toBe(200);
  });

  it("Step 10: User 1 has EUR balance", async () => {
    const res = await request(app)
      .get("/api/v1/account/balance")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.balances.USD).toBe(700);
    expect(res.body.balances.EUR).toBe(85);
  });

  it("Step 11: User 1 views transaction history", async () => {
    const res = await request(app)
      .get("/api/v1/transaction/history")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.transactions).toBeDefined();
    expect(res.body.transactions.length).toBeGreaterThanOrEqual(2); // transfer + exchange

    // Check transfer transaction
    const transferTx = res.body.transactions.find(tx => tx.type === "send" && tx.amount === 200);
    expect(transferTx).toBeDefined();
    if (transferTx) {
      expect(transferTx.currency).toBe("USD");
    }

    // Check exchange transaction
    const exchangeTx = res.body.transactions.find(tx => tx.type === "exchange" && tx.amount === 100);
    expect(exchangeTx).toBeDefined();
    if (exchangeTx) {
      expect(exchangeTx.currency).toBe("USD");
    }
  });

  it("Step 12: User 1 refreshes access token", async () => {
    const res = await request(app)
      .post("/api/v1/user/refresh")
      .send({ refreshToken: user1RefreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.accessToken).not.toBe(user1Token);

    // Update token for next test
    user1Token = res.body.accessToken;
  });

  it("Step 13: User 1 can use new access token", async () => {
    const res = await request(app)
      .get("/api/v1/user/getUser")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(user1Data.username);
  });

  it("Step 14: User 1 logs out", async () => {
    const res = await request(app)
      .post("/api/v1/user/logout")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ refreshToken: user1RefreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it("Step 15: User 1 cannot use refresh token after logout", async () => {
    const res = await request(app)
      .post("/api/v1/user/refresh")
      .send({ refreshToken: user1RefreshToken });

    expect(res.statusCode).toBe(403);
  });

  it("Step 16: User 1 can sign in again", async () => {
    const res = await request(app)
      .post("/api/v1/user/signin")
      .send({
        username: user1Data.username,
        password: user1Data.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});
