import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  MONGOURI: process.env.MONGOURI || "mongodb://localhost:27017/db",
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  VIDEO_SECRET: process.env.VIDEO_SECRET || "default_video_secret",
  CLIENT_ID: process.env.CLIENT_ID || "google_client_id",
  CLIENT_SECRET: process.env.CLIENT_SECRET || "google_client_secret",
  NSFW_THRESHOLD: process.env.NSFW_THRESHOLD || 0.7,
  HLS_ENC: process.env.HLS_ENC || "HLS_ENC_CODE",
  BASE_URL: process.env.BASE_URL || "http://localhost:3000"
};

if (!env) {
  throw new Error("Missing essential environment variables");
}
