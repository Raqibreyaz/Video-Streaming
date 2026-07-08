import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import transcodeVideo from "./src/transcodeVideo.js";
import {
  deleteS3andLocalObject,
  downloadS3Object,
  uploadDirectory,
} from "./src/s3.js";

const UPLOAD_ROOT = "/tmp";
const jobId = process.env["JOB_ID"];
const inputBucket = process.env["INPUT_BUCKET"];
const inputKey = process.env["INPUT_KEY"];
const outputBucket = process.env["OUTPUT_BUCKET"];

if (!jobId || !inputBucket || !inputKey || !outputBucket)
  throw new Error(
    "Job Id, Input Bucket, Input Key and Output Bucket all are required!",
  );

try {
  // create the output directory to store the transcoded segments
  const objectUniqueName = path.basename(inputKey, path.extname(inputKey));
  const outputPath = path.join(UPLOAD_ROOT, objectUniqueName);
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }

  const incomingFilepath = await downloadS3Object(
    inputBucket,
    inputKey,
    UPLOAD_ROOT,
  );

  // finally transcode the video and save it
  await transcodeVideo(incomingFilepath, outputPath);

  // upload the transcoded multi-resolution segments
  await uploadDirectory(outputPath, outputBucket, objectUniqueName);

  // remove the original now
  await deleteS3andLocalObject(inputBucket, inputKey, incomingFilepath);
} catch (err) {
  console.error(err);
  process.exit(1);
}
