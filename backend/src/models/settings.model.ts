import { Schema, Document, model, Types } from "mongoose";
import Joi, { ValidationResult } from "joi";

export interface ISettings extends Document {
  userId: Types.ObjectId;
  mediaCollectionId: Types.ObjectId;
  playbackSpeed: number[];
  iconColor: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    mediaCollectionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MediaCollection",
      index: true,
    },

    playbackSpeed: {
      type: [Number],
      enum: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
      default: [1],
      required: true,
    },

    iconColor: {
      type: String,
      required: true,
      default: "#00C950",
    },
  },
  {
    timestamps: true,
  },
);

SettingsSchema.index({ userId: 1, mediaCollectionId: 1 }, { unique: true });

export function validateSettings(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(),
    mediaCollectionId: Joi.string().hex().length(24).required(),

    playbackSpeed: Joi.array()
      .items(Joi.number().valid(0.25, 0.5, 0.75, 1, 1.25, 1.5, 2))
      .min(1)
      .required(),

    iconColor: Joi.string()
      .pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .required(),
  }).unknown(false);

  return schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
}

export const Settings = model<ISettings>("Settings", SettingsSchema);
