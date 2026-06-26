import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";

type VideoSource = {
  src: string;
  type: string;
};

type VideoPlayerOptions = {
  autoplay?: boolean | "muted" | "play" | "any";
  controls?: boolean;
  responsive?: boolean;
  fluid?: boolean;
  poster?: string;
  preload?: "auto" | "metadata" | "none";
  sources: VideoSource[];
  html5?: {
    vhs?: {
      overrideNative?: boolean;
    };
    nativeAudioTracks?: boolean;
    nativeVideoTracks?: boolean;
  };
};

type VideoPlayerInstance = ReturnType<typeof videojs>;

export interface StreamPlayer extends VideoPlayerInstance {
  qualityLevels?: () => {
    length: number;
    [index: number]: {
      height?: number;
      enabled?: boolean;
    };
    on?: (event: string, handler: (...args: any[]) => void) => void;
  };
  hlsQualitySelector?: (options?: {
    displayCurrentQuality?: boolean;
  }) => void;
}

type VideoPlayerProps = {
  options: VideoPlayerOptions;
  onReady?: (player: StreamPlayer) => void;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  options,
  onReady,
}) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<StreamPlayer | null>(null);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, options, function () {
        videojs.log("player is ready");

        const qualityLevels = player.qualityLevels?.();
        videojs.log("quality levels:", qualityLevels?.length ?? 0);

        if (player.hlsQualitySelector) {
          player.hlsQualitySelector({
            displayCurrentQuality: true,
          });
        }

        onReady?.(player);
      }) as StreamPlayer);
    } else if (playerRef.current) {
      const player = playerRef.current;
      player.autoplay(options.autoplay ?? false);
      player.src(options.sources);
    }
  }, [options, onReady]);

  useEffect(() => {
    return () => {
      const player = playerRef.current;

      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player style={{ width: "600px" }}>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer; 