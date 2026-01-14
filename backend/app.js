const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const mainRouter = require("./routes");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");

const app = express();

// Security middleware
app.use(helmet()); // Security headers

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(",") 
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Logging
app.use(morgan("combined")); // Log all requests

// Body parsing
app.use(express.json());

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Rate limiting for all API routes
app.use("/api/v1", apiLimiter);

// Routes
app.use("/api/v1", mainRouter);

module.exports = app;
