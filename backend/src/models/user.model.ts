/**
 * ---------------------------------------------------------
 * USER MODEL
 * ---------------------------------------------------------
 * Represents application users for both:
 * - Local authentication
 * - Google OAuth authentication
 *
 * Responsibilities:
 * - Schema definition
 * - Password hashing & comparison
 * - JWT generation
 * - Input validation (Joi)
 * ---------------------------------------------------------
 */

import { Schema, model, Document, Model } from "mongoose";
import Joi, { ValidationResult } from "joi";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "@configs/env.config";

/**
 * ---------------------------------------------------------
 * USER DOCUMENT INTERFACE
 * ---------------------------------------------------------
 * Extends mongoose Document
 */
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

/**
 * ---------------------------------------------------------
 * USER MODEL STATIC METHODS INTERFACE
 * ---------------------------------------------------------
 */
export interface UserModelInterface extends Model<User> {
  hashPassword(password: string): Promise<string>;
}

/**
 * ---------------------------------------------------------
 * USER SCHEMA
 * ---------------------------------------------------------
 */
const UserSchema = new Schema<User, UserModelInterface>(
  {
    /**
     * Username
     */
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
      index: true,
      trim: true,
    },

    /**
     * Email (unique identifier)
     */
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },

    /**
     * Password (local auth only)
     * - Hidden by default (`select: false`)
     */
    password: {
      type: String,
      select: false,
      minlength: 8,
      required: function (): boolean {
        return this.provider === "local";
      },
    },

    /**
     * Auth provider
     */
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },

    /**
     * Google OAuth ID (only for Google users)
     */
    googleId: {
      type: String,
      index: true,
      sparse: true,
    },

    /**
     * Total uploaded videos count
     */
    videocount: {
      type: Number,
      default: 0,
    },

    /**
     * Active WebSocket connection ID
     */
    socketId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Compound index for faster lookups
 */
UserSchema.index({ username: 1, email: 1 });

/**
 * ---------------------------------------------------------
 * INSTANCE METHODS
 * ---------------------------------------------------------
 */

/**
 * Generate JWT authentication token
 */
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

/**
 * Compare plain password with hashed password
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * ---------------------------------------------------------
 * STATIC METHODS
 * ---------------------------------------------------------
 */

/**
 * Hash password before storing
 */
UserSchema.statics.hashPassword = async function (
  candidatePassword: string,
): Promise<string> {
  return bcrypt.hash(candidatePassword, 12);
};

/**
 * ---------------------------------------------------------
 * JOI VALIDATION SCHEMA
 * ---------------------------------------------------------
 * Used during registration & user creation
 */
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

/**
 * ---------------------------------------------------------
 * USER MODEL EXPORT
 * ---------------------------------------------------------
 */
export const UserModel = model<User, UserModelInterface>("User", UserSchema);
