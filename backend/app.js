import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import multer from "multer";
import { spawn } from "node:child_process";

const app = express();

const rootDir = import.meta.dirname;
const uploadDir = path.join(rootDir, "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

const upload = multer({ storage: storage });

app.use((req, res, next) => {
  console.log("requested path", req.path);

  next();
});

app.use(cors());

app.get("/", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send("hello world!");
});

app.get("/uploads/*path", (req, res, next) => {
  const filePath = path.join(uploadDir, path.join("/", ...req.params.path));

  if (!fs.existsSync(filePath)) throw new Error("file doesnt exist!");

  const readStream = fs.createReadStream(filePath);

  // when data come then send to client
  readStream.on("data", (chunk) => {
    // console.log("writing data to client!");
    if (!res.write(chunk)) readStream.pause();
  });

  // restart sending data after all buffered data sent
  res.on("drain", () => {
    // console.log("internal buffer cleared!");
    readStream.resume();
  });

  readStream.on("end", () => res.end());

  readStream.on("error", (error) => {
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });

  res.on("close", () => readStream.destroy());
  res.on("error", () => readStream.destroy());
});

app.post("/uploads", upload.single("file"), (req, res, next) => {
  if (!req.file) throw new Error("file is required!");

  const videoPath = req.file.path;
  const lectureId = crypto.randomUUID();
  const outputPath = path.join(uploadDir, "courses", lectureId);
  const hlsPath = path.join(outputPath, "index.m3u8");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const ffmpegCommand = `ffmpeg -i ${videoPath} \
      -map 0:v:0 -map 0:a:0 \
      -map 0:v:0 -map 0:a:0 \
      -map 0:v:0 -map 0:a:0 \
      -c:v libx264 -c:a aac -ar 48000 \
      -filter:v:0 scale=w=640:h=360  -b:v:0 800k  -maxrate:v:0 1000k -bufsize:v:0 1600k \
      -filter:v:1 scale=w=854:h=480  -b:v:1 1400k -maxrate:v:1 1800k -bufsize:v:1 2800k \
      -filter:v:2 scale=w=1280:h=720 -b:v:2 2800k -maxrate:v:2 3500k -bufsize:v:2 5600k \
      -b:a:0 96k -b:a:1 128k -b:a:2 128k \
      -preset medium \
      -g 48 -keyint_min 48 -sc_threshold 0 \
      -f hls \
      -hls_time 6 \
      -hls_playlist_type vod \
      -hls_flags independent_segments \
      -master_pl_name master.m3u8 \
      -var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p" \
      -hls_segment_filename "${outputPath}/%v/segment%03d.ts" \
      "${outputPath}/%v/index.m3u8"
  `;

  const childProcess = spawn("bash", ["-c", ffmpegCommand]);

  childProcess.stdout.on("data", process.stdout.write);
  childProcess.stderr.on("data", process.stderr.write);

  childProcess.on("error", (error) => {
    console.log(JSON.stringify(error));
  });
  childProcess.on("close", (code, signal) => {
    if (code !== 0) {
      const err = new Error("Operation failed!");
      return next(err);
    }

    const videoUrl = `http://localhost:8080/uploads/courses/${lectureId}/master.m3u8`;

    res.json({
      message: "Video converted to HLS format",
      videoUrl,
      lectureId,
    });
  });
});

app.listen(8080, (error) => {
  if (error) return console.log(error);
  console.log("Server is running at port 8080");
});
