import crypto from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import fs from "fs/promises";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { spawn } from "node:child_process";

const UPLOAD_ROOT = "/tmp";
const outputBucket = process.env["OUTPUT_BUCKET"]!;
const s3Client = new S3Client({ region: "ap-south-1" });

const handler = async (bucketName: string, objectKey: string) => {
  const result = await s3Client.send(
    new GetObjectCommand({ Bucket: bucketName, Key: objectKey }),
  );

  const contentType = result.ContentType;
  if (!contentType?.startsWith("video/")) {
    console.log("non-video file detected, skipping...");
    return;
  }

  if (!result.Body) {
    console.log("file doesn't have any content!, skipping...");
    return;
  }

  const incomingFilepath = path.join(
    UPLOAD_ROOT,
    crypto.randomUUID(),
    path.extname(objectKey),
  );
  const bodyStream = result.Body as Readable;
  const writeStream = createWriteStream(incomingFilepath);
  bodyStream.pipe(writeStream, { end: true });

  const outputName = crypto.randomUUID();
  const outputPath = path.join(UPLOAD_ROOT, outputName);

  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }

  const ffmpegCommand = `ffmpeg -i ${incomingFilepath} \
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
  childProcess.on("close", async (code) => {
    if (code !== 0) {
      const err = new Error("Operation failed!");
      throw err;
    }

    // upload the transcoded multi-resolution segments
    await uploadDirectory(outputPath);

    // remove the original now
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey }),
    );
  });
};

const uploadDirectory = async (directoryPath: string) => {
  const dirEntries = await fs.readdir(directoryPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (const dirEntry of dirEntries) {
    if (dirEntry.isDirectory()) return;

    const filepath = path.join(
      dirEntry.parentPath.replace(`${UPLOAD_ROOT}/`, ""),
      dirEntry.name,
    );
    await s3Client.send(
      new PutObjectCommand({ Bucket: outputBucket, Key: filepath }),
    );
  }
};
