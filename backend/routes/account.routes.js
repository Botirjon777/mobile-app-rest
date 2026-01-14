const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protected routes
router.get("/balance", authMiddleware, accountController.getBalance);
router.post("/transfer", authMiddleware, accountController.transfer);
router.post("/exchange", authMiddleware, accountController.exchange);

module.exports = router;
