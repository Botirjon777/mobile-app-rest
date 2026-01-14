const Joi = require("joi");

const transferSchema = Joi.object({
  to: Joi.string().required(),
  currency: Joi.string().valid("USD", "EUR", "GBP", "INR", "JPY", "UZS", "CAD", "AUD", "CHF", "CNY").required(),
  amount: Joi.number().positive().max(10000).required(),
});

const exchangeSchema = Joi.object({
  fromCurrency: Joi.string().valid("USD", "EUR", "GBP", "INR", "JPY", "UZS", "CAD", "AUD", "CHF", "CNY").required(),
  toCurrency: Joi.string().valid("USD", "EUR", "GBP", "INR", "JPY", "UZS", "CAD", "AUD", "CHF", "CNY").required(),
  fromAmount: Joi.number().positive().max(10000).required(),
  toAmount: Joi.number().positive().required(),
});

module.exports = { transferSchema, exchangeSchema };
