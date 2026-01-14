const mongoose = require("mongoose");
const { Account, User } = require("../models");
const Transaction = require("../models/transactionModel");
const { transferSchema, exchangeSchema } = require("../validators/account.validator");
const { checkTransactionLimit, checkDailyLimit } = require("../utils/transactionLimits");

exports.getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.userId });
    if (!account) return res.status(404).json({ message: "Account not found" });

    res.status(200).json({ balances: account.balances });
  } catch {
    res.status(500).json({ message: "Failed to fetch balance" });
  }
};

exports.transfer = async (req, res) => {
  const { to, currency, amount } = req.body;
  
  // Validate input
  const { error } = transferSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check transaction limit
    const limitCheck = checkTransactionLimit(amount, currency);
    if (!limitCheck.valid) {
      await session.abortTransaction();
      return res.status(400).json({ message: limitCheck.message });
    }
    
    // Get sender user for daily limit check
    const senderUser = await User.findById(req.userId).session(session);
    if (!senderUser) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check daily limit
    const dailyCheck = await checkDailyLimit(senderUser, amount, currency);
    if (!dailyCheck.valid) {
      await session.abortTransaction();
      return res.status(400).json({ message: dailyCheck.message });
    }
    
    const sender = await Account.findOne({ userId: req.userId }).session(
      session
    );
    if (!sender || (sender.balances[currency] ?? 0) < amount) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Insufficient funds or account not found" });
    }

    const receiver = await Account.findOne({ userId: to }).session(session);
    const receiverUser = await User.findById(to);
    if (!receiver || !receiverUser) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Receiver not found" });
    }

    await Account.updateOne(
      { userId: req.userId },
      { $inc: { [`balances.${currency}`]: -amount } }
    ).session(session);

    await Account.updateOne(
      { userId: to },
      { $inc: { [`balances.${currency}`]: amount } }
    ).session(session);

    await Transaction.create(
      [
        {
          userId: req.userId,
          type: "send",
          amount,
          currency,
          targetId: to,
          targetName: `${receiverUser.firstName} ${receiverUser.lastName}`,
          date: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: "Transfer successful" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Transfer failed", error: error.message });
  } finally {
    session.endSession();
  }
};

exports.exchange = async (req, res) => {
  const { fromCurrency, toCurrency, fromAmount, toAmount } = req.body;
  
  // Validate input
  const { error } = exchangeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check transaction limit
    const limitCheck = checkTransactionLimit(fromAmount, fromCurrency);
    if (!limitCheck.valid) {
      await session.abortTransaction();
      return res.status(400).json({ message: limitCheck.message });
    }
    
    // Get user for daily limit check
    const user = await User.findById(req.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check daily limit
    const dailyCheck = await checkDailyLimit(user, fromAmount, fromCurrency);
    if (!dailyCheck.valid) {
      await session.abortTransaction();
      return res.status(400).json({ message: dailyCheck.message });
    }
    
    const account = await Account.findOne({ userId: req.userId }).session(
      session
    );
    if (!account || (account.balances[fromCurrency] ?? 0) < fromAmount) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Insufficient funds or account not found" });
    }

    await Account.updateOne(
      { userId: req.userId },
      {
        $inc: {
          [`balances.${fromCurrency}`]: -fromAmount,
          [`balances.${toCurrency}`]: toAmount,
        },
      }
    ).session(session);

    await Transaction.create(
      [
        {
          userId: req.userId,
          type: "exchange",
          amount: fromAmount,
          currency: fromCurrency,
          targetName: `→ ${toCurrency}`,
          date: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: "Exchange successful" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Exchange failed", error: error.message });
  } finally {
    session.endSession();
  }
};
