const request = require("supertest");
const app = require("../app");
require("./testDB");

const userData = {
  username: `testuser${Date.now()}@mail.com`,
  password: "123456",
  firstName: "Test",
  lastName: "User",
};

describe("Auth", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/v1/user/signup").send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it("should login the user", async () => {
    await request(app).post("/api/v1/user/signup").send(userData); // ensure user exists

    const res = await request(app).post("/api/v1/user/signin").send({
      username: userData.username,
      password: userData.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
