export interface Video {
  _id: string;
  videoId: string;
  videoName: string;
  originalSize: number; // bytes
  duration: number; // seconds
}

export interface ListVideosResponse {
  message: string;
  videos: Video[];
}

export interface UploadVideoResponse {
  message: string;
  signedUrl: string;
}

export interface StreamVideoResponse {
  success: boolean;
  videoUrl: string;
}
