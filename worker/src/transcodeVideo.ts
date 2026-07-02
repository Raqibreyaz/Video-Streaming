import { spawn } from "node:child_process";

export default function transcodeVideo(
  inputFilepath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-i",
      inputFilepath,

      // stream mapping
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",

      // codecs and audio sample rate
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-ar",
      "48000",

      // 360p
      "-filter:v:0",
      "scale=w=640:h=360",
      "-b:v:0",
      "800k",
      "-maxrate:v:0",
      "1000k",
      "-bufsize:v:0",
      "1600k",

      // 480p
      "-filter:v:1",
      "scale=w=854:h=480",
      "-b:v:1",
      "1400k",
      "-maxrate:v:1",
      "1800k",
      "-bufsize:v:1",
      "2800k",

      // 720p
      "-filter:v:2",
      "scale=w=1280:h=720",
      "-b:v:2",
      "2800k",
      "-maxrate:v:2",
      "3500k",
      "-bufsize:v:2",
      "5600k",

      // audio bitrates
      "-b:a:0",
      "96k",
      "-b:a:1",
      "128k",
      "-b:a:2",
      "128k",

      // H.264 / HLS tuning
      "-preset",
      "medium",
      "-g",
      "48",
      "-keyint_min",
      "48",
      "-sc_threshold",
      "0",

      // HLS output settings
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_flags",
      "independent_segments",
      "-master_pl_name",
      "master.m3u8",
      "-var_stream_map",
      "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p",
      "-hls_segment_filename",
      `${outputPath}/%v/segment%03d.ts`,
      `${outputPath}/%v/index.m3u8`,
    ];
    const childProcess = spawn("ffmpeg", args);

    childProcess.stdout.on("data", (chunk: Buffer) =>
      process.stdout.write(chunk),
    );
    childProcess.stderr.on("data", (chunk: Buffer) =>
      process.stderr.write(chunk),
    );

    childProcess.on("error", reject);
    childProcess.on("close", async (code) => {
      if (code !== 0) {
        return reject(new Error("Operation failed!"));
      }
      resolve(undefined);
    });
  });
}
