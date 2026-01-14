const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { loginLimiter, signupLimiter } = require("../middlewares/rateLimiter.middleware");

// Public
router.post("/signup", signupLimiter, userController.signup);
router.post("/signin", loginLimiter, userController.signin);
router.post("/refresh", userController.refreshToken);
router.get("/verify-email/:token", userController.verifyEmail);

// Protected
router.post("/logout", authMiddleware, userController.logout);
router.post("/resend-verification", authMiddleware, userController.resendVerification);
router.get("/getUser", authMiddleware, userController.getUser);
router.get("/getAllUsers", authMiddleware, userController.getAllUsers);
router.get("/bulk", authMiddleware, userController.bulkSearch);
router.get("/otherusers", authMiddleware, userController.getOtherUsers);

module.exports = router;
