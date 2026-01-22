import { Schema, model, Document } from "mongoose";
import Joi, { ValidationResult } from "joi";

export interface BlackToken extends Document {
  token: string;
  expiresAt: Date;
}

const blackListTokenSchema = new Schema<BlackToken>(
  {
    token: {
      type: String,
      required: true,
      match: [
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        "Invalid JWT format.",
      ],
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    collection: "blacklist_tokens",
  },
);

export function validateBlackToken(data: { token: string }): ValidationResult {
  const schema = Joi.object({
    token: Joi.string()
      .trim()
      .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
      .required(),
  });

  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
}

export const BlackTokenModel = model<BlackToken>(
  "BlackToken",
  blackListTokenSchema,
);
