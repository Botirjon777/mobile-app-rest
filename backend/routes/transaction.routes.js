const express = require("express");
const router = express.Router();
const {
  getTransactionHistory,
  getOneTransaction,
} = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/history", authMiddleware, getTransactionHistory);
router.get("/history/:id", authMiddleware, getOneTransaction);

module.exports = router;
