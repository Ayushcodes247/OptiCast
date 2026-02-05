import { Schema, model, Types } from "mongoose";
import Joi, { ValidationResult } from "joi";

export interface IVideo {
  videoName: string;
  videoId: string;
  userId: Types.ObjectId;
  status: "queued" | "processing" | "completed" | "failed";
  jobId: string;
  deliveryPath?: string | null;
  mediaCollectionId: Types.ObjectId;
}

const VideoSchema = new Schema<IVideo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    videoId: {
      type: String,
      required: true,
      index: true,
    },

    videoName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },

    jobId: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    deliveryPath: {
      type: String,
      default: null,
    },

    mediaCollectionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MediaCollection",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

VideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export function validateVideoSchema(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(),
    videoId: Joi.string().required(),
    videoName: Joi.string().min(2).max(50).required(),
    jobId: Joi.string().required(),

    status: Joi.string()
      .valid("queued", "processing", "completed", "failed")
      .optional(),

    mediaCollectionId: Joi.string().hex().length(24).required(),

    deliveryPath: Joi.string().optional(),
  }).unknown(false);

  return schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
}

export const Video = model<IVideo>("Video", VideoSchema);
