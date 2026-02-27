import { Schema, model, Types } from "mongoose";
import Joi, { ValidationResult } from "joi";

/**
 * IVideo Interface
 * Represents a single video document stored in MongoDB.
 * This tracks the full lifecycle of a transcoding job.
 */
export interface IVideo {
  videoName: string; // Original name of the uploaded video
  videoId: string; // Public-facing unique identifier for the video
  userId: Types.ObjectId; // Reference to the owner (User collection)
  status: "queued" | "processing" | "completed" | "failed"; // Processing lifecycle state
  jobId: string; // BullMQ job ID associated with transcoding
  deliveryPath?: string | null; // Final output path after processing (if completed)
  mediaCollectionId: Types.ObjectId; // Reference to parent media collection
}

/**
 * Mongoose Schema Definition
 * Defines how the Video document is stored in MongoDB.
 */
const VideoSchema = new Schema<IVideo>(
  {
    /**
     * Reference to the User who uploaded the video.
     * Indexed for faster dashboard queries.
     */
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    /**
     * Public unique video identifier.
     * Indexed to allow fast lookups.
     */
    videoId: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * Human-readable video name.
     * Trimmed and length restricted for consistency.
     */
    videoName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },

    /**
     * Associated BullMQ job ID.
     * Used to track background processing state.
     */
    jobId: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * Current processing state of the video.
     * Defaults to "queued" when created.
     */
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    /**
     * Final storage path after successful processing.
     * Null until video processing is completed.
     */
    deliveryPath: {
      type: String,
      default: null,
    },

    /**
     * Reference to the MediaCollection this video belongs to.
     * Indexed for efficient collection-based queries.
     */
    mediaCollectionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MediaCollection",
      index: true,
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
 * Ensures a user cannot create duplicate videoId entries.
 */
VideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

/**
 * Joi Validation Schema
 * Validates incoming request payload before creating Video document.
 * Prevents overposting and ensures strong data integrity.
 */
export function validateVideoSchema(data: object): ValidationResult {
  const schema = Joi.object({
    userId: Joi.string().hex().length(24).required(), // Must be valid Mongo ObjectId
    videoId: Joi.string().required(), // Required public ID
    videoName: Joi.string().min(2).max(50).required(), // Name constraints
    jobId: Joi.string().required(), // Must be associated with background job

    status: Joi.string()
      .valid("queued", "processing", "completed", "failed")
      .optional(), // Optional during creation

    mediaCollectionId: Joi.string().hex().length(24).required(), // Parent reference

    deliveryPath: Joi.string().optional(), // Added after processing completes
  }).unknown(false); // Reject unknown fields

  return schema.validate(data, {
    stripUnknown: true, // Remove extra properties
    abortEarly: false, // Return all validation errors
  });
}

/**
 * Video Model Export
 * Used throughout the application for CRUD operations.
 */
export const Video = model<IVideo>("Video", VideoSchema);
