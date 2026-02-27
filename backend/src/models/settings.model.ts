import { Schema, Document, model, Types } from "mongoose";
import Joi, { ValidationResult } from "joi";

/**
 * ISettings Interface
 * Represents playback and UI customization settings
 * for a specific MediaCollection belonging to a user.
 */
export interface ISettings extends Document {
  userId: Types.ObjectId; // Owner of the settings
  mediaCollectionId: Types.ObjectId; // Associated media collection
  playbackSpeed: number[]; // Allowed playback speed options for player
  iconColor: string; // UI accent color for player controls
}

/**
 * Settings Schema
 * Stores per-collection configuration for playback experience.
 */
const SettingsSchema = new Schema<ISettings>(
  {
    /**
     * Reference to the user who owns these settings.
     * Indexed for faster lookup.
     */
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    /**
     * Reference to the MediaCollection
     * Ensures settings are tied to a specific collection.
     */
    mediaCollectionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MediaCollection",
      index: true,
    },

    /**
     * Array of allowed playback speeds for the video player.
     * Restricted to predefined safe values.
     * Defaults to normal speed (1x).
     */
    playbackSpeed: {
      type: [Number],
      enum: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
      default: [1],
      required: true,
    },

    /**
     * Hex color code used for UI elements (e.g., player icons).
     * Defaults to green shade.
     */
    iconColor: {
      type: String,
      required: true,
      default: "#00C950",
    },
  },
  {
    /**
     * Automatically adds:
     * - createdAt
     * - updatedAt
     */
    timestamps: true,
  },
);

/**
 * Compound Unique Index
 * Ensures one settings document per:
 * (userId + mediaCollectionId) combination.
 */
SettingsSchema.index({ userId: 1, mediaCollectionId: 1 }, { unique: true });

/**
 * Joi Validation Schema
 * Validates incoming settings payload before saving.
 * Prevents invalid playback speeds and incorrect color formats.
 */
export function validateSettings(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(), // Must be valid Mongo ObjectId
    mediaCollectionId: Joi.string().hex().length(24).required(),

    playbackSpeed: Joi.array()
      .items(Joi.number().valid(0.25, 0.5, 0.75, 1, 1.25, 1.5, 2))
      .min(1)
      .required(), // At least one playback speed must be allowed

    iconColor: Joi.string()
      .pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .required(), // Must be valid 3 or 6 digit hex color
  }).unknown(false); // Reject unknown fields

  return schema.validate(data, {
    stripUnknown: true, // Remove extra properties
    abortEarly: false, // Return all validation errors
  });
}

/**
 * Settings Model Export
 * Used for CRUD operations related to playback configuration.
 */
export const Settings = model<ISettings>("Settings", SettingsSchema);
