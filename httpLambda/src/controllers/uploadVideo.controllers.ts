import path from "node:path";
import { Request, Response } from "express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import Video from "../models/video.models.js";

interface BodyType {
  fileName: string;
  fileType: string;
  fileSize: number;
  duration: number;
}

const s3Client = new S3Client({ region: "ap-south-1" });

const BUCKET_NAME = process.env["BUCKET_NAME"]!;

// create a new video document in the DB according to the received metadata of the file
// send a pre-signed url to client directly upload to s3
export default async function uploadVideo(
  req: Request<{}, {}, BodyType>,
  res: Response,
) {
  const videoName = req.body.fileName;
  const originalSize = req.body.fileSize;
  const duration = req.body.duration;
  const videoExtension = path.extname(videoName);
  const isUnSupportedFile =
    !req.body.fileType ||
    !req.body.fileType.startsWith("video/") ||
    ![".mkv", ".mp4"].some((extension) => extension === videoExtension);

  if (isUnSupportedFile) throw new Error("Unsupported file provided!");

  // object key by UUID with video extension
  const objectUniqueName = crypto.randomUUID();
  const s3ObjectKey = objectUniqueName + videoExtension;

  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3ObjectKey,
    ContentType: req.body.fileType,
    ContentLength: originalSize,
  });

  const signedUrl = await getS3SignedUrl(s3Client, putObjectCommand, {
    expiresIn: 30,
  });

  await Video.insertOne({
    videoId: objectUniqueName,
    videoName,
    duration,
    originalSize,
  });

  res.json({ message: "Video uploaded successfully!", signedUrl });
}
