import { Worker } from "bullmq";
import { spawn, execSync } from "child_process";
import { env } from "../configs/env.config";
import redisConnetion from "../configs/redis.config";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

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

const outDir = path.resolve(__dirname, "../hls");

const getDuration = (file: string): number => {
  return parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file}"`,
    ).toString(),
  );
};

const safeCleanUp = (dir: string) => {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
};

const hasAudio = (file: string): boolean => {
  try {
    const output = execSync(
      `ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "${file}"`,
    )
      .toString()
      .trim();

    return output.length > 0;
  } catch {
    return false;
  }
};

const toSec = (t: any): number => {
  const [h, m, s] = t.split(":");
  return Number(h) * 3600 + Number(m) * 60 + parseFloat(s);
};

new Worker(
  "transcode-queue",
  async (job) => {
    console.info("PROCESSING JOB:", job.id);

    const { mediaCollectionId , videoId, inputPath } = job.data;

    if (!inputPath) {
      throw new Error("inputPath is missing in job.data");
    }

    const absInPath = path.resolve(inputPath);

    const vidDir = path.join(outDir, videoId);
    fs.mkdirSync(vidDir, { recursive: true });

    QUALITIES.forEach((_, i) => {
      fs.mkdirSync(path.join(vidDir, `v${i}`), { recursive: true });
    });

    const duration = getDuration(absInPath);
    const audioExists = hasAudio(absInPath);

    console.info("Audio detected:", audioExists);

    const encPath = path.join(vidDir, "enc.encrypt");
    const encInfoPath = path.join(vidDir, "encInfo.txt");
    fs.writeFileSync(encPath, randomBytes(16));

    const encInfoData = [
      `${env.BASE_URL}/api/media-collection/${mediaCollectionId}/enc/${videoId}`,
      encPath,
      env.HLS_ENC,
    ].join("\n");
    fs.writeFileSync(encInfoPath, encInfoData);

    const filter = QUALITIES.map(
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

    QUALITIES.forEach((q, i) => {
      args.push("-map", `[v${i}]`);

      if (audioExists) {
        args.push(
          "-map",
          "0:a:0",
          `-c:a:${i}`,
          "aac",
          `-b:a:${i}`,
          "128k",
          "-ac",
          "2",
        );
      }

      args.push(`-c:v:${i}`, "libx264", `-b:v:${i}`, q.br);
    });

    const streamMap = audioExists
      ? QUALITIES.map((_, i) => `v:${i},a:${i}`).join(" ")
      : QUALITIES.map((_, i) => `v:${i}`).join(" ");

    args.push(
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_flags",
      "independent_segments+periodic_rekey",
      "-hls_key_info_file",
      encInfoPath,
      "-hls_segment_filename",
      path.join(vidDir, "v%v", "seg_%03d.ts"),
      "-master_pl_name",
      "master.m3u8",
      "-var_stream_map",
      streamMap,
      path.join(vidDir, "v%v", "index.m3u8"),
      "-y",
    );

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", args);

      ffmpeg.stderr.on("data", (det) => {
        const m = det.toString().match(/time=(\d+:\d+:\d+\.\d+)/);
        if (!m) return;

        job.updateProgress(Math.floor((toSec(m[1]) / duration) * 100));
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          console.info("PROCESSING JOB", job.id, "DONE.");
          fs.unlinkSync(absInPath);

          resolve({ hlsPath: `${mediaCollectionId}/hls/${videoId}/master.m3u8` });
        } else {
          safeCleanUp(vidDir);
          reject(new Error("FFmpeg failed with code " + code));
        }
      });

      ffmpeg.on("error", (err) => {
        console.error("VIDEO TRANSCODING FAILED:", err);
        safeCleanUp(vidDir);
        reject(err);
      });
    });
  },
  {
    connection: redisConnetion,
    concurrency: 2,
  },
);
