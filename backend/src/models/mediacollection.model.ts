/**
 * ---------------------------------------------------------
 * MEDIA COLLECTION MODEL
 * ---------------------------------------------------------
 * Represents a logical container for videos.
 *
 * Responsibilities:
 * - Store user-owned video collections
 * - Secure access via hashed access token
 * - Manage allowed embed origins
 * - Track background deletion jobs
 * ---------------------------------------------------------
 */

import { Schema, Types, model, Model, Document } from "mongoose";
import Joi, { ValidationResult } from "joi";
import bcrypt from "bcrypt";

/**
 * ---------------------------------------------------------
 * MEDIA COLLECTION INTERFACE
 * ---------------------------------------------------------
 */
export interface IMediaCollection {
  userId: Types.ObjectId; // Owner reference
  mediaCollectionName: string; // Unique per user
  videosId: Types.ObjectId[]; // Associated videos
  accessTokenHash?: string; // Hashed embed access token
  allowedOrigins: string[]; // Whitelisted domains
  deliveryPath: string[]; // CDN / HLS delivery paths
  jobId: string; // Background deletion job reference

  compareAccessToken(candidateAccessToken: string): Promise<boolean>;
  isDomainAllowed(origin: string): boolean;
}

/**
 * ---------------------------------------------------------
 * STATIC METHODS INTERFACE
 * ---------------------------------------------------------
 */
export interface MediaCollectionModelType extends Model<IMediaCollection> {
  hashAccessToken(candidateAccessToken: string): Promise<string>;
}

/**
 * Combined Document Type
 */
export type MediaCollectionDocument = IMediaCollection & Document;

/**
 * ---------------------------------------------------------
 * SCHEMA DEFINITION
 * ---------------------------------------------------------
 */
const MediaCollectionSchema = new Schema<MediaCollectionDocument>(
  {
    /**
     * Owner (User reference)
     */
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    /**
     * Collection name (unique per user)
     */
    mediaCollectionName: {
      type: String,
      required: true,
      minlength: [2, "Media collection name must be at least 2 characters"],
      maxlength: [50, "Media collection name must be at most 50 characters"],
      index: true,
      trim: true,
    },

    /**
     * Video references
     */
    videosId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
        select: true,
        required: false,
      },
    ],

    /**
     * Delivery paths (HLS master paths, etc.)
     */
    deliveryPath: [
      {
        type: String,
        required: false,
        select: true,
      },
    ],

    /**
     * Hashed access token (never store raw token)
     */
    accessTokenHash: {
      type: String,
      required: true,
      select: true,
    },

    /**
     * Allowed embed origins (whitelisted domains)
     */
    allowedOrigins: {
      type: [String],
      required: true,
    },

    /**
     * Background deletion job reference
     */
    jobId: {
      type: String,
      required: false,
      select: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * ---------------------------------------------------------
 * INDEXES
 * ---------------------------------------------------------
 * Ensures:
 * - A user cannot create two collections with same name
 */
MediaCollectionSchema.index(
  { userId: 1, mediaCollectionName: 1 },
  { unique: true },
);

/**
 * ---------------------------------------------------------
 * PRE-SAVE HOOK
 * ---------------------------------------------------------
 * Normalizes allowed origins:
 * - Lowercase
 * - Remove trailing slash
 */
MediaCollectionSchema.pre("save", function () {
  if (this.allowedOrigins?.length) {
    this.allowedOrigins = this.allowedOrigins.map((origin) =>
      origin.toLowerCase().replace(/\/$/, ""),
    );
  }
});

/**
 * ---------------------------------------------------------
 * INSTANCE METHODS
 * ---------------------------------------------------------
 */

/**
 * Compare provided access token with hashed token
 */
MediaCollectionSchema.methods.compareAccessToken = async function (
  candidateAccessToken: string,
): Promise<boolean> {
  if (!this.accessTokenHash) return false;
  return await bcrypt.compare(candidateAccessToken, this.accessTokenHash);
};

/**
 * Check if request origin is allowed
 */
MediaCollectionSchema.methods.isDomainAllowed = function (
  origin: string,
): boolean {
  const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");
  return this.allowedOrigins.includes(normalizedOrigin);
};

/**
 * ---------------------------------------------------------
 * STATIC METHODS
 * ---------------------------------------------------------
 */

/**
 * Hash access token before storing
 */
MediaCollectionSchema.statics.hashAccessToken = async function (
  candidateAccessToken: string,
): Promise<string> {
  return await bcrypt.hash(candidateAccessToken, 12);
};

/**
 * ---------------------------------------------------------
 * DOMAIN VALIDATION REGEX
 * ---------------------------------------------------------
 * Allows:
 * - localhost
 * - IP addresses
 * - Standard domains
 * - Optional ports
 */
const domainRegex =
  /^https?:\/\/(localhost|\d{1,3}(\.\d{1,3}){3}|([a-z0-9-]+\.)+[a-z]{2,})(:\d{2,5})?$/i;

/**
 * ---------------------------------------------------------
 * JOI VALIDATION
 * ---------------------------------------------------------
 */
export function validateMediaCollectionSchema(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(),

    mediaCollectionName: Joi.string().min(2).max(50).required(),

    videos: Joi.array().items(Joi.string().hex().length(24)).optional(),

    allowedOrigins: Joi.array()
      .items(Joi.string().trim().pattern(domainRegex))
      .min(1)
      .required(),
  }).unknown(false);

  return schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
}

/**
 * ---------------------------------------------------------
 * MODEL EXPORT
 * ---------------------------------------------------------
 */
export const MediaCollectionModel = model<
  MediaCollectionDocument,
  MediaCollectionModelType
>("MediaCollection", MediaCollectionSchema);
