import type {
  ListVideosResponse,
  StreamVideoResponse,
  UploadVideoResponse,
} from "./types";

// Set VITE_API_BASE_URL in .env.local to your Lambda Function URL
// e.g. VITE_API_BASE_URL=https://xxxx.lambda-url.ap-south-1.on.aws
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function listVideos(): Promise<ListVideosResponse> {
  const res = await fetch(`${BASE_URL}/`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch video list");
  return res.json();
}

export interface UploadVideoMeta {
  fileName: string;
  fileType: string;
  fileSize: number;
  duration: number;
}

export async function getUploadUrl(
  meta: UploadVideoMeta,
): Promise<UploadVideoResponse> {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Upload failed");
  }
  return res.json();
}

export async function streamVideo(id: string): Promise<StreamVideoResponse> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get stream URL");
  return res.json();
}

/** Upload a file directly to an S3 pre-signed URL with progress tracking */
export function uploadToS3(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed: ${xhr.status}`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.send(file);
  });
}

/** Read the duration of a video File using a hidden <video> element */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration"));
    };
    video.src = url;
  });
}
