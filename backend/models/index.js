const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

// Account Schema with balances per currency
const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balances: {
    USD: { type: Number, default: 0 },
    EUR: { type: Number, default: 0 },
    GBP: { type: Number, default: 0 },
    INR: { type: Number, default: 0 },
    JPY: { type: Number, default: 0 },
    UZS: { type: Number, default: 0 },
    CAD: { type: Number, default: 0 },
    AUD: { type: Number, default: 0 },
    CHF: { type: Number, default: 0 },
    CNY: { type: Number, default: 0 },
  },
});

const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);

module.exports = { User, Account };
