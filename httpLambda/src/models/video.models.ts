import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
  },
  videoName: {
    type: String,
    required: true,
  },
  originalSize: {
    type: Number,
    required: true,
    min: 1024, //1KB
    max: 2 * 1024 ** 3, //2GB
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
});

const Video = mongoose.model("Video", videoSchema);
export default Video;
