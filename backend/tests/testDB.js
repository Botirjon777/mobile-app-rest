// tests/testDB.js
const mongoose = require("mongoose");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Removed dropDatabase to prevent data loss on real DB
afterAll(async () => {
  await mongoose.connection.close();
});
