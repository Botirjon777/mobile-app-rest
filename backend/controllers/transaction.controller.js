const Transaction = require("../models/transactionModel");

exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate("userId", "firstName lastName")
      .populate("targetId", "firstName lastName")
      .sort({ date: -1 });

    const formatted = transactions.map((tx) => ({
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.date,
      senderName: tx.userId
        ? `${tx.userId.firstName} ${tx.userId.lastName}`
        : "-",
      targetName: tx.targetId
        ? `${tx.targetId.firstName} ${tx.targetId.lastName}`
        : tx.targetName || "-",
    }));

    res.status(200).json({ transactions: formatted });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: "Failed to fetch transaction history" });
  }
};

exports.getOneTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findById(id)
      .populate("userId", "firstName lastName")
      .populate("targetId", "firstName lastName");

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const formatted = {
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.date,
      senderName: tx.userId
        ? `${tx.userId.firstName} ${tx.userId.lastName}`
        : "-",
      targetName: tx.targetId
        ? `${tx.targetId.firstName} ${tx.targetId.lastName}`
        : tx.targetName || "-",
    };

    res.status(200).json({ transaction: formatted });
  } catch (err) {
    console.error("Error fetching transaction:", err);
    res.status(500).json({ message: "Failed to fetch transaction" });
  }
};
