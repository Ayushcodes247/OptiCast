import { Schema, model, Document, Model } from "mongoose";
import Joi, { ValidationResult } from "joi";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "@configs/env.config";

export interface User extends Document {
  username: string;
  email: string;
  password?: string;
  videocount: number;
  socketId: string;

  provider: "local" | "google";
  googleId?: string;

  generateAuthToken(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface UserModelInterface extends Model<User> {
  hashPassword(password: string): Promise<string>;
}

const UserSchema = new Schema<User, UserModelInterface>(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
      index: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },

    password: {
      type: String,
      select: false,
      minlength: 8,
      required: function (): boolean {
        return this.provider === "local";
      },
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },

    googleId: {
      type: String,
      index: true,
      sparse: true,
    },

    videocount: {
      type: Number,
      default: 0,
    },

    socketId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

UserSchema.index({ username: 1, email: 1 });

UserSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

UserSchema.statics.hashPassword = async function (
  candidatePassword: string,
): Promise<string> {
  return bcrypt.hash(candidatePassword, 12);
};

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export function validateUserSchema(data: object): ValidationResult {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.when("provider", {
      is: "local",
      then: Joi.string().min(8).required(),
      otherwise: Joi.optional(),
    }),
    provider: Joi.string().valid("local", "google").default("local"),
    googleId: Joi.when("provider", {
      is: "google",
      then: Joi.string().required(),
      otherwise: Joi.forbidden(),
    }),
    videocount: Joi.number().optional(),
    socketId: Joi.string().optional(),
  }).unknown(false);

  return schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
}

export const UserModel = model<User, UserModelInterface>("User", UserSchema);
