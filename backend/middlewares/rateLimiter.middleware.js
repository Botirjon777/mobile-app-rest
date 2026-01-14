const rateLimit = require("express-rate-limit");

// Skip rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

// Rate limiter for login attempts
const loginLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for signup
const signupLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per windowMs
  message: "Too many signup attempts, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, signupLimiter, apiLimiter };
