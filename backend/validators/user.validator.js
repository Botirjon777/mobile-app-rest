const Joi = require("joi");

const signupSchema = Joi.object({
  username: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "string.min": "Password must be at least 8 characters long"
    }),
});

const signinSchema = Joi.object({
  username: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { signupSchema, signinSchema };
