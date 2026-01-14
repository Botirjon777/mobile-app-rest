const Joi = require("joi");

const signupSchema = Joi.object({
  username: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

const signinSchema = Joi.object({
  username: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { signupSchema, signinSchema };
