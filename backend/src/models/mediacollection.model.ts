import { Schema, Types, model, Model } from "mongoose";
import Joi, { ValidationResult } from "joi";
import bcrypt from "bcrypt";

export interface IMediaCollection {
  userId: Types.ObjectId;
  mediaCollectionName: string;
  videos: Types.ObjectId[];
  accessTokenHash?: string;
  allowedOrigins: string[];

  compareAccessToken(candidateAccessToken: string): Promise<boolean>;
  isDomainAllowed(origin: string): boolean;
}

export interface MediaCollectionModelType extends Model<IMediaCollection> {
  hashAccessToken(candidateAccessToken: string): Promise<string>;
}

const MediaCollectionSchema = new Schema<IMediaCollection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    mediaCollectionName: {
      type: String,
      required: true,
      minlength: [2, "Media collection name must be at least 2 characters"],
      maxlength: [50, "Media collection name must be at most 50 characters"],
      index: true,
      trim: true,
    },

    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    accessTokenHash: {
      type: String,
      select: false,
    },

    allowedOrigins: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

MediaCollectionSchema.index(
  { userId: 1, mediaCollectionName: 1 },
  { unique: true },
);

MediaCollectionSchema.pre("save", async function () {
  if (this.allowedOrigins?.length) {
    this.allowedOrigins = this.allowedOrigins.map((origins) =>
      origins.toLowerCase().replace(/\/$/, ""),
    );
  }
});

MediaCollectionSchema.methods.compareAccessToken = async function (
  candidateAccessToken: string,
): Promise<boolean> {
  if (!this.accessTokenHash) return false;
  return bcrypt.compare(candidateAccessToken, this.accessTokenHash);
};

MediaCollectionSchema.methods.isDomainAllowed = function (
  origin: string,
): boolean {
  const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");
  return this.allowedDomain.includes(normalizedOrigin);
};

MediaCollectionSchema.statics.hashAccessToken = async function (
  candidateAccessToken: string,
): Promise<string> {
  return bcrypt.hash(candidateAccessToken, 12);
};

const domainRegex = /^https?:\/\/localhost(:\d{2,5})?$/;

export function validateMediaCollectionSchema(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(),
    mediaCollectionName: Joi.string().min(2).max(50).required(),

    videos: Joi.array().items(Joi.string().hex().length(24)).optional(),

    allowedDomain: Joi.array()
      .items(Joi.string().trim().pattern(domainRegex))
      .min(1)
      .required(),
  }).unknown(false);

  return schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
}

export const MediaCollectionModel = model<
  IMediaCollection,
  MediaCollectionModelType
>("MediaCollection", MediaCollectionSchema);
