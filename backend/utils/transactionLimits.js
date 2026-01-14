// Exchange rates (simplified - in production, use a real API)
const exchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  INR: 83.12,
  JPY: 110.0,
  UZS: 11000,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
};

// Convert any amount to USD for limit checking
const convertToUSD = (amount, currency) => {
  return amount / exchangeRates[currency];
};

// Check if transaction exceeds single transaction limit
const checkTransactionLimit = (amount, currency) => {
  const maxTransactionUSD = parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 10000;
  const amountInUSD = convertToUSD(amount, currency);
  
  if (amountInUSD > maxTransactionUSD) {
    return {
      valid: false,
      message: `Transaction amount exceeds maximum limit of $${maxTransactionUSD} USD`,
    };
  }
  
  return { valid: true };
};

// Check and update daily transaction limit
const checkDailyLimit = async (user, amount, currency) => {
  const dailyLimitUSD = parseFloat(process.env.DAILY_TRANSACTION_LIMIT) || 50000;
  const amountInUSD = convertToUSD(amount, currency);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Reset daily total if it's a new day
  if (!user.lastTransactionDate || user.lastTransactionDate < today) {
    user.dailyTransactionTotal = 0;
    user.lastTransactionDate = new Date();
  }
  
  const newTotal = user.dailyTransactionTotal + amountInUSD;
  
  if (newTotal > dailyLimitUSD) {
    return {
      valid: false,
      message: `Daily transaction limit of $${dailyLimitUSD} USD exceeded. Current total: $${user.dailyTransactionTotal.toFixed(2)} USD`,
    };
  }
  
  // Update daily total
  user.dailyTransactionTotal = newTotal;
  await user.save();
  
  return { valid: true };
};

module.exports = {
  checkTransactionLimit,
  checkDailyLimit,
  convertToUSD,
};
