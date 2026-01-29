import { Worker } from "bullmq";
import redisConnection from "@configs/redis.config";
import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";

const QUALITIES = [
  { name: "144p", w: 256, h: 144, br: "150k" },
  { name: "240p", w: 426, h: 240, br: "300k" },
  { name: "360p", w: 640, h: 360, br: "800k" },
  { name: "480p", w: 854, h: 480, br: "1400k" },
  { name: "720p", w: 1280, h: 720, br: "2800k" },
  { name: "1080p", w: 1920, h: 1080, br: "5000k" },
  { name: "1440p", w: 2560, h: 1440, br: "8000k" },
  { name: "2160p", w: 3840, h: 2160, br: "16000k" },
];

const getDuration = (file: any): void => {
  parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file}"`,
    ).toString(),
  );
};

const toSec = (t: any): number => {
  const [h, m, s] = t.split(":");
  return +h * 3600 + +m * 60 + parseFloat(s);
};

const outPaths = path.join(__dirname, "../hls");

new Worker("video-queue", async (job) => {
  console.info(`JOB ${job.id} IS INITIATED.`);

  const { videoId, inputPath } = job.data;
  const absInPath = path.resolve(inputPath);

  const videoDir = path.join(outPaths, videoId);
  fs.mkdirSync(path.join(videoDir), { recursive: true });

  QUALITIES.forEach((_, i) => {
    fs.mkdirSync(path.join(videoDir, `v${i}`), { recursive: true });
  });

  const duration = getDuration(absInPath);

  const filter = QUALITIES.map((q,i) => {
    
  })
});
