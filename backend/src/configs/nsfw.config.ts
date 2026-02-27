/**
 * ---------------------------------------------------------
 * EXPLICIT CONTENT DETECTION CONFIG
 * ---------------------------------------------------------
 * Uses:
 * - TensorFlow.js
 * - NSFWJS pre-trained model
 *
 * Purpose:
 * - Analyze extracted video frames
 * - Detect explicit content (Porn / Hentai)
 * - Cache predictions for performance
 * ---------------------------------------------------------
 */

import * as tf from "@tensorflow/tfjs";
import * as nsfw from "nsfwjs";
import type { NSFWJS, PredictionType } from "nsfwjs";
import { createCanvas, loadImage } from "canvas";
import crypto from "crypto";
import { env } from "./env.config";

/**
 * Loaded NSFW model instance (singleton)
 */
let model: NSFWJS;

/**
 * Simple in-memory hash-based prediction cache
 * Prevents re-processing identical frames
 */
const cache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Load NSFW model once (lazy loading)
 */
export async function loadModel(): Promise<NSFWJS> {
  if (!model) {
    model = await nsfw.load();
    console.info("[NSFW] Model loaded successfully");
  }
  return model;
}

/**
 * Generate SHA-256 hash for frame buffer
 * Used for caching predictions
 */
function generateHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Moderate a single frame
 * - Resize to 224x224
 * - Convert to tensor
 * - Classify
 */
export async function moderateFrame(
  frameBuffer: Buffer,
): Promise<PredictionType[]> {
  const hash = generateHash(frameBuffer);

  // Return cached result if available
  if (cache.has(hash)) {
    return cache.get(hash)!;
  }

  const model = await loadModel();

  const img = await loadImage(frameBuffer);
  const canvas = createCanvas(224, 224);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, 224, 224);

  const tensor = tf.browser.fromPixels(canvas as any);

  const predictions = await model.classify(tensor);

  // Important: free memory
  tensor.dispose();

  // Basic FIFO cache eviction
  if (cache.size >= MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value);
  }

  cache.set(hash, predictions);

  return predictions;
}

/**
 * Determine if frame is NSFW
 *
 * Threshold configurable via env:
 * NSFW_THRESHOLD (default 0.7)
 */
export function isNSFW(
  predictions: PredictionType[],
  threshold: number = Number(env.NSFW_THRESHOLD ?? 0.7),
): boolean {
  const flaggedClasses = new Set(["Porn", "Hentai"]);

  return predictions.some(
    (p) => flaggedClasses.has(p.className) && p.probability >= threshold,
  );
}
