const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { User, Account } = require("../models");
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require("../config/jwt");
const { signupSchema, signinSchema } = require("../validators/user.validator");
const { sendVerificationEmail } = require("../utils/emailService");

exports.signup = async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser)
      return res.status(409).json({ message: "Email already in use" });

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      ...req.body,
      password: hashedPassword,
      verificationToken,
      emailVerified: false,
    });

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

    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    
    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Send verification email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendVerificationEmail(user.username, verificationToken);
    }

    res
      .status(201)
      .json({ 
        message: "User registered. Please check your email to verify your account.", 
        accessToken,
        refreshToken,
        userId: user._id 
      });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const { error } = signinSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    
    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({ 
      message: "Login successful", 
      accessToken,
      refreshToken 
    });
  } catch (err) {
    res.status(500).json({ message: "Signin failed", error: err.message });
  }
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

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Check if refresh token exists in user's tokens
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Remove refresh token from user's tokens
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }
    
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();
    
    // Send verification email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendVerificationEmail(user.username, verificationToken);
      res.status(200).json({ message: "Verification email sent" });
    } else {
      res.status(500).json({ message: "Email service not configured" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to resend verification", error: err.message });
  }
};
