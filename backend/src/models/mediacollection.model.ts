import { Schema, Types, model, Model, Document } from "mongoose";
import Joi, { ValidationResult } from "joi";
import bcrypt from "bcrypt";

export interface IMediaCollection {
  userId: Types.ObjectId;
  mediaCollectionName: string;
  videosId: Types.ObjectId[];
  accessTokenHash?: string;
  allowedOrigins: string[];
  deliveryPath : string[];

  compareAccessToken(candidateAccessToken: string): Promise<boolean>;
  isDomainAllowed(origin: string): boolean;
}

export interface MediaCollectionModelType extends Model<IMediaCollection> {
  hashAccessToken(candidateAccessToken: string): Promise<string>;
}

export type MediaCollectionDocument = IMediaCollection & Document;

const MediaCollectionSchema = new Schema<MediaCollectionDocument>(
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

    videosId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    deliveryPath:{

    },

    accessTokenHash: {
      type: String,
      required: true,
      select: true,
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

MediaCollectionSchema.pre("save", function () {
  if (this.allowedOrigins?.length) {
    this.allowedOrigins = this.allowedOrigins.map((origin) =>
      origin.toLowerCase().replace(/\/$/, ""),
    );
  }
});

MediaCollectionSchema.methods.compareAccessToken = async function (
  candidateAccessToken: string,
): Promise<boolean> {
  if (!this.accessTokenHash) return false;
  return await bcrypt.compare(candidateAccessToken, this.accessTokenHash);
};

MediaCollectionSchema.methods.isDomainAllowed = function (
  origin: string,
): boolean {
  const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");
  return this.allowedOrigins.includes(normalizedOrigin);
};

MediaCollectionSchema.statics.hashAccessToken = async function (
  candidateAccessToken: string,
): Promise<string> {
  return await bcrypt.hash(candidateAccessToken, 12);
};

const domainRegex =
  /^https?:\/\/(localhost|\d{1,3}(\.\d{1,3}){3}|([a-z0-9-]+\.)+[a-z]{2,})(:\d{2,5})?$/i;

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

export const MediaCollectionModel = model<
  MediaCollectionDocument,
  MediaCollectionModelType
>("MediaCollection", MediaCollectionSchema);
