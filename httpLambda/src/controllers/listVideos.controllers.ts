import { Request, Response } from "express";
import Video from "../models/video.models.js";

export default async function listVideos(_req: Request, res: Response) {
  const videos = await Video.find({}).lean();
  res.json({
    message: "videos fetched successfully!",
    videos,
  });
}