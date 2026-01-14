jest.setTimeout(15000);
require("./testDB");
require("dotenv").config();

const request = require("supertest");
const app = require("../app");

let token;

beforeAll(async () => {
  // Create a real user to get a valid token
  const res = await request(app)
    .post("/api/v1/user/signup")
    .send({
      username: `test${Date.now()}@mail.com`,
      password: "123456",
      firstName: "Transaction",
      lastName: "Tester",
    });

  token = res.body.token;
});

describe("Transaction", () => {
  it("should fetch transaction history (unauthorized)", async () => {
    const res = await request(app).get("/api/v1/transaction/history");
    expect(res.statusCode).toBe(401); // should be unauthorized without token
  });

  it("should return 404 for non-existent transaction", async () => {
    const res = await request(app)
      .get("/api/v1/transaction/history/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  // Optional: add a working one if you create a real transaction
  // it("should fetch transaction history (authorized)", async () => {
  //   const res = await request(app)
  //     .get("/api/v1/transaction/history")
  //     .set("Authorization", `Bearer ${token}`);
  //   expect(res.statusCode).toBe(200);
  //   expect(Array.isArray(res.body.transactions)).toBe(true);
  // });
});
