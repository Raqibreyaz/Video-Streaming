import crypto from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { pipeline } from "node:stream/promises";

const s3Client = new S3Client({ region: "ap-south-1" });

export async function uploadDirectory(
  directoryPath: string,
  outputBucket: string,
  uploadPrefix: string,
) {
  const dirEntries = await fs.readdir(directoryPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (const dirEntry of dirEntries) {
    if (dirEntry.isDirectory()) continue;

    const absolutePath = path.join(dirEntry.parentPath, dirEntry.name);

    // Path relative to the directory you’re walking
    const relativeFromRoot = path.relative(directoryPath, absolutePath);
    // This will be "720p/index.m3u8" when directoryPath = "/tmp/uuid"

    const s3Key = path.join(uploadPrefix, relativeFromRoot);

    const readStream = createReadStream(absolutePath);
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputBucket,
          Key: s3Key,
          Body: readStream,
        }),
      );
    } catch (error) {
      throw new Error(`Failed to upload ${s3Key}: ${error}`);
    }
  }
}

export async function downloadS3Object(
  bucketName: string,
  objectKey: string,
  downloadPath: string,
) {
  try {
    const result = await s3Client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: objectKey }),
    );

    const contentType = result.ContentType;
    if (!contentType?.startsWith("video/")) {
      throw new Error("non-video file detected, skipping...");
    }

    if (!result.Body) {
      throw new Error("file doesn't have any content!, skipping...");
    }

    // save the file locally first
    const incomingFilepath = path.join(
      downloadPath,
      crypto.randomUUID() + path.extname(objectKey),
    );
    const bodyStream = result.Body as Readable;
    await pipeline(bodyStream, createWriteStream(incomingFilepath));

    return incomingFilepath;
  } catch (error) {
    throw new Error(`Failed to download ${objectKey}: ${error}`);
  }
}

export async function deleteS3andLocalObject(
  bucketName: string,
  objectKey: string,
  localFilepath: string,
) {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey }),
  );
  await fs.rm(localFilepath);
}
