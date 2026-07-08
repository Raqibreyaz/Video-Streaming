import "./App.css";
import "./index.css";
import { useState } from "react";
import Layout from "@/components/Layout";
import VideoList from "@/components/VideoList";
import UploadView from "@/components/UploadView";
import PlayUrlView from "@/components/PlayUrlView";
import Player from "@/components/Player";
import { streamVideo } from "./api";
import type { Video } from "./types";

type View = "list" | "upload" | "player" | "play-url";

function App() {
  const [view, setView] = useState<View>("list");
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [streamError, setStreamError] = useState("");
  const [loadingStream, setLoadingStream] = useState(false);

  const handlePlay = async (video: Video) => {
    try {
      setLoadingStream(true);
      setStreamError("");
      const { videoUrl: url } = await streamVideo(video._id);
      setVideoUrl(url);
      setActiveVideo(video);
      setView("player");
    } catch (e) {
      setStreamError(e instanceof Error ? e.message : "Failed to start stream");
    } finally {
      setLoadingStream(false);
    }
  };

  const handleBack = () => {
    setView("list");
    setActiveVideo(null);
    setVideoUrl("");
  };

  const handleNavigate = (v: "list" | "upload" | "play-url") => {
    setView(v);
    if (v === "list" || v === "upload" || v === "play-url") {
      setActiveVideo(null);
      setVideoUrl("");
    }
  };

  const handlePlayUrl = (url: string) => {
    setVideoUrl(url);
    setActiveVideo({
      _id: "custom-url",
      videoId: "custom-url",
      videoName: "Custom Stream",
      originalSize: 0,
      duration: 0,
    });
    setView("player");
  };

  return (
    <Layout activeView={view} onNavigate={handleNavigate}>
      {/* Stream load overlay */}
      {loadingStream && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7,11,20,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            zIndex: 200,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: "3px solid rgba(124,58,237,0.2)",
              borderTopColor: "var(--accent-2)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            Generating signed stream…
          </p>
        </div>
      )}

      {/* Stream error toast */}
      {streamError && (
        <div
          className="glass-card"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 300,
            borderColor: "rgba(244,63,94,0.3)",
            background: "rgba(244,63,94,0.1)",
            maxWidth: 380,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p style={{ color: "#fda4af", fontWeight: 500 }}>{streamError}</p>
          <button
            className="btn-ghost"
            onClick={() => setStreamError("")}
            style={{ padding: "4px 8px", marginLeft: "auto" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Views */}
      {view === "list" && <VideoList onPlay={handlePlay} />}
      {view === "upload" && <UploadView onSuccess={() => handleNavigate("list")} />}
      {view === "play-url" && <PlayUrlView onPlay={handlePlayUrl} />}
      {view === "player" && activeVideo && (
        <Player videoUrl={videoUrl} video={activeVideo} onBack={handleBack} />
      )}
    </Layout>
  );
}

export default App;
