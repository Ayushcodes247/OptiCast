import { Schema, model, Types } from "mongoose";
import Joi, { ValidationResult } from "joi";

export interface IVideo {
  videoname: string;
  videoId: string;
  userId: Types.ObjectId;
  status: "queued" | "processing" | "completed" | "failed";
  jobId: string;
  deliveryPath?: string;
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
      unique: true,
      index: true,
    },

    videoname: {
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
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

VideoSchema.index({ userId: 1, videoId: 1 });

export function validateVideoSchema(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(),
    videoId: Joi.string().required(),
    videoname: Joi.string().min(2).max(50).required(),
    jobId: Joi.string().required(),
    status: Joi.string()
      .valid("queued", "processing", "completed", "failed")
      .optional(),
  });

  return schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
}

export const Video = model<IVideo>("Video", VideoSchema);
