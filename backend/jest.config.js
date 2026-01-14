module.exports = {
  testEnvironment: "node",
  testTimeout: 15000,
  maxWorkers: 1, // Run tests serially to avoid rate limiting conflicts
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "models/**/*.js",
    "utils/**/*.js",
    "validators/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  }
};
