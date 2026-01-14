const jwt = require("jsonwebtoken");
const { User, Account } = require("../models");
const { JWT_SECRET } = require("../config/jwt");
const { signupSchema, signinSchema } = require("../validators/user.validator");

exports.signup = async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser)
      return res.status(409).json({ message: "Email already in use" });

    const user = await User.create(req.body);

    await Account.create({
      userId: user._id,
      balances: {
        USD: 1000,
        EUR: 0,
        GBP: 0,
        INR: 0,
        JPY: 0,
        UZS: 0,
        CAD: 0,
        AUD: 0,
        CHF: 0,
        CNY: 0,
      },
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res
      .status(201)
      .json({ message: "User registered", token, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

exports.signin = async (req, res) => {
  const { error } = signinSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.status(200).json({ message: "Login successful", token });
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, firstName, lastName } = user;
    res.status(200).json({ username, firstName, lastName });
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find({}).lean();
  const formatted = users.map(({ _id, username, firstName, lastName }) => ({
    userid: _id,
    username,
    firstName,
    lastName,
  }));
  res.status(200).json({ users: formatted });
};

exports.bulkSearch = async (req, res) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [
      { firstName: { $regex: filter, $options: "i" } },
      { lastName: { $regex: filter, $options: "i" } },
    ],
  }).lean();

  const formatted = users.map(({ _id, username, firstName, lastName }) => ({
    userid: _id,
    username,
    firstName,
    lastName,
  }));
  res.status(200).json({ users: formatted });
};

exports.getOtherUsers = async (req, res) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [
      { firstName: { $regex: filter, $options: "i" } },
      { lastName: { $regex: filter, $options: "i" } },
    ],
  }).lean();

  const filtered = users.filter((u) => u._id.toString() !== req.userId);
  const formatted = filtered.map(({ _id, username, firstName, lastName }) => ({
    userid: _id,
    username,
    firstName,
    lastName,
  }));
  res.status(200).json({ users: formatted });
};
