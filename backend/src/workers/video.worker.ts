import { Worker } from "bullmq";
import redisConnection from "@configs/redis.config";
import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import { env } from "@configs/env.config";
import os from "os";

const CPU_CORES = os.cpus().length;

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

const getDuration = (file: string): number =>
  parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file}"`,
    ).toString(),
  );

const toSec = (t: any): number => {
  const [h, m, s] = t.split(":");
  return +h * 3600 + +m * 60 + parseFloat(s);
};

const getResolution = (file: string): { width: number; height: number } => {
  const [w, h] = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${file}"`,
  )
    .toString()
    .trim()
    .split(",");

  return { width: Number(w), height: Number(h) };
};

const pruneQualities = (inputHeight: number, cpuCores: number) =>
  QUALITIES.filter((q) => {
    if (q.h > inputHeight) return false;
    if (cpuCores < 4 && q.h > 720) return false;
    if (cpuCores < 8 && q.h > 1080) return false;
    return true;
  });

const outRoot = path.resolve(__dirname, "../hls");

const safeCleanUp = (dir: string) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

new Worker(
  "video-queue",
  async (job) => {
    const { videoId, inputPath } = job.data;
    if (!videoId || !inputPath) throw new Error("Invalid job payload");

    const absInPath = path.resolve(inputPath);
    const videoDir = path.join(outRoot, videoId);
    fs.mkdirSync(videoDir, { recursive: true });

    const { height } = getResolution(absInPath);
    const ACTIVE_QUALITIES = pruneQualities(height, CPU_CORES);

    if (!ACTIVE_QUALITIES.length) {
      safeCleanUp(videoDir);
      throw new Error("No valid qualities after pruning");
    }

    const encPath = path.join(videoDir, "enc.key");
    const encInfoPath = path.join(videoDir, "encInfo.txt");

    fs.writeFileSync(encPath, randomBytes(32));
    fs.writeFileSync(
      encInfoPath,
      [`${env.BASE_URL}/key/${videoId}`, encPath, env.HLS_ENC].join("\n"),
    );

    ACTIVE_QUALITIES.forEach((_, i) => {
      fs.mkdirSync(path.join(videoDir, `v${i}`), { recursive: true });
    });

    const duration = getDuration(absInPath);

    const filter = ACTIVE_QUALITIES.map(
      (q, i) => `[0:v]scale=${q.w}:${q.h}:flags=fast_bilinear[v${i}]`,
    ).join(";");

    const args: string[] = [
      "-i",
      absInPath,
      "-filter_complex",
      filter,
      "-preset",
      "veryfast",
      "-vsync",
      "1",
      "-r",
      "30",
      "-g",
      "60",
      "-keyint_min",
      "60",
      "-sc_threshold",
      "0",
      "-pix_fmt",
      "yuv420p",
    ];

    ACTIVE_QUALITIES.forEach((q, i) => {
      args.push(
        "-map",
        `[v${i}]`,
        "-map",
        "0:a?",
        `-c:v:${i}`,
        "libx264",
        `-b:v:${i}`,
        q.br,
        `-c:a:${i}`,
        "aac",
        `-b:a:${i}`,
        "128k",
        "-ac",
        "2",
      );
    });

    args.push(
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_flags",
      "independent_segments+periodic_rekey",
      "-hls_key_info_path",
      encInfoPath,
      "-hls_segment_filename",
      path.join(videoDir, "v%v", "seg_%03d.ts"),
      "-master_pl_name",
      "master.m3u8",
      "-var_stream_map",
      ACTIVE_QUALITIES.map((_, i) => `v:${i},a:${i}`).join(" "),
      path.join(videoDir, "v%v", "index.m3u8"),
      "-y",
    );

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", args);

      ffmpeg.stderr.on("data", (data) => {
        const match = data.toString().match(/time=(\d+:\d+:\d+\.\d+)/);
        if (!match || !duration) return;

        job.updateProgress(
          Math.min(100, Math.floor((toSec(match[1]) / duration) * 100)),
        );
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          fs.unlinkSync(absInPath);
          resolve({ status: "completed" });
        } else {
          safeCleanUp(videoDir);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", (err) => {
        safeCleanUp(videoDir);
        reject(err);
      });
    });
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);
