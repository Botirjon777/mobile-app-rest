const express = require("express");
const router = express.Router();

const userRoutes = require("./user.routes");
const accountRoutes = require("./account.routes");
const transactionRoutes = require("./transaction.routes");

router.use("/user", userRoutes);
router.use("/account", accountRoutes);
router.use("/transaction", transactionRoutes);

module.exports = router;
