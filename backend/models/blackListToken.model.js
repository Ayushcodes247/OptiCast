const mongoose = require("mongoose");
const Joi = require("joi");

const blackListTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(),
      expires: 60 * 60 * 24,
    },
  },
  {
    timestamps: false,
  }
);

function validateToken(data) {
  try {
    const schema = Joi.object({
      token: Joi.string()
        .trim()
        .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
        .required(),
    }).unknown(false);

    const validationTokenResult = schema.validate(data, { abortEarly: false });

    return validationTokenResult;
  } catch (error) {
    console.error("Error while validating user data:", error.message);
    return error;
  }
}

const blackListTokenModel = mongoose.model(
  "BlackListToken",
  blackListTokenSchema
);

module.exports = { blackListTokenModel, validateToken };
