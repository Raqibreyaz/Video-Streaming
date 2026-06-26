import "./App.css";
import VideoPlayer, { type StreamPlayer } from "@/components/Player";
import { useRef } from "react";
import videojs from "video.js";

function App() {
  const playerRef = useRef<StreamPlayer | null>(null);
  const videoLink =
    "http://localhost:8080/uploads/courses/6f1c0aba-4691-42ea-b572-82f9f6b1ee13/master.m3u8";

  const videoPlayerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: videoLink,
        type: "application/x-mpegURL",
      },
    ],
  };
  const handlePlayerReady = (player: StreamPlayer) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };
  return (
    <>
      <div>
        <h1>Video player</h1>
      </div>
      <VideoPlayer options={videoPlayerOptions} onReady={handlePlayerReady} />
    </>
  );
}

export default App;
