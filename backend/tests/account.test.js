jest.setTimeout(15000);
require("./testDB");
const request = require("supertest");
const app = require("../app");

let token;
let receiverId;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/v1/user/signup")
    .send({
      username: `sender${Date.now()}@mail.com`,
      password: "123456",
      firstName: "Sender",
      lastName: "User",
    });
  token = res.body.token;

  const rec = await request(app)
    .post("/api/v1/user/signup")
    .send({
      username: `receiver${Date.now()}@mail.com`,
      password: "123456",
      firstName: "Receiver",
      lastName: "User",
    });
  receiverId = rec.body.userId || rec.body._id || rec.body.user?._id; // fallback chaining
});

describe("Account", () => {
  it("should get balance", async () => {
    const res = await request(app)
      .get("/api/v1/account/balance")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.balances).toBeDefined();
  });

  it("should transfer money", async () => {
    const res = await request(app)
      .post("/api/v1/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        to: receiverId,
        amount: 100,
        currency: "USD",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/successful/i);
  });

  it("should exchange currency", async () => {
    const res = await request(app)
      .post("/api/v1/account/exchange")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fromCurrency: "USD",
        toCurrency: "EUR",
        fromAmount: 100,
        toAmount: 90,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/successful/i);
  });
});
