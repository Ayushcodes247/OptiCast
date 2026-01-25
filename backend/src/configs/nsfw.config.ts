import * as tf from "@tensorflow/tfjs";
import nsfw, { NSFWJS, PredictionType } from "nsfwjs";
import { createCanvas, loadImage } from "canvas";
import crypto from "crypto";
import { env } from "./env.config";

let model: NSFWJS;

const cache = new Map();
const MAX_CACHE_SIZE = 500;

async function loadModel(): Promise<NSFWJS> {
  if (!model) {
    model = await nsfw.load();
    console.info("[NSFW] Model loaded successfully");
  }
  return model;
}

function generateHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function moderateFrame(
  frameBuffer: Buffer,
): Promise<PredictionType[]> {
  const hash = generateHash(frameBuffer);

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

  tensor.dispose();

  // simple cache eviction
  if (cache.size >= MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value);
  }

  cache.set(hash, predictions);

  return predictions;
}

export function isNSFW(
  predictions: PredictionType[],
  threshold: number = Number(env.NSFW_THRESHOLD ?? 0.7),
): boolean {
  const flaggedClasses = new Set(["Porn", "Hentai", "Sexy"]);

  return predictions.some(
    (p) => flaggedClasses.has(p.className) && p.probability >= threshold,
  );
}
