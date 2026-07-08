import { useCallback, useEffect, useState } from "react";
import { listVideos } from "../api";
import type { Video } from "../types";

interface VideoListProps {
  onPlay: (video: Video) => void;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

/** Deterministic pastel gradient per video id */
function cardGradient(id: string): string {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues: [number, number][] = [
    [255, 200], [200, 160], [160, 290], [290, 330], [330, 50],
  ];
  const [h1, h2] = hues[hash % hues.length];
  return `linear-gradient(135deg, hsl(${h1},70%,20%) 0%, hsl(${h2},60%,15%) 100%)`;
}

function VideoCardSkeleton() {
  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      <div className="skeleton" style={{ height: 160 }} />
      <div style={{ padding: "16px 18px" }}>
        <div className="skeleton" style={{ height: 18, width: "70%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 14, width: "40%" }} />
      </div>
    </div>
  );
}

export default function VideoList({ onPlay }: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listVideos();
      setVideos(data.videos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const filtered = videos.filter((v) =>
    v.videoName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="animate-fade-up">
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: 6 }}>My Videos</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {loading ? "Loading…" : `${videos.length} video${videos.length !== 1 ? "s" : ""} uploaded`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              id="video-search-input"
              type="text"
              placeholder="Search videos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 38,
                paddingRight: 14,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                width: 220,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <button className="btn-ghost" onClick={fetchVideos} style={{ padding: "9px 14px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="glass-card"
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            borderColor: "rgba(244,63,94,0.3)",
            background: "rgba(244,63,94,0.08)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p style={{ color: "#fda4af" }}>{error}</p>
          <button className="btn-ghost" onClick={fetchVideos} style={{ marginLeft: "auto" }}>
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
          : filtered.length === 0
          ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "80px 24px",
                color: "var(--text-muted)",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.2"
                style={{ margin: "0 auto 16px" }}
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: "1rem", marginBottom: 8 }}>
                {search ? "No videos match your search" : "No videos yet"}
              </p>
              <p style={{ fontSize: "0.875rem" }}>
                {search ? "Try a different term" : "Upload your first video to get started"}
              </p>
            </div>
          )
          : filtered.map((video, i) => (
            <VideoCard key={video._id} video={video} index={i} onPlay={onPlay} />
          ))}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  index,
  onPlay,
}: {
  video: Video;
  index: number;
  onPlay: (v: Video) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      id={`video-card-${video._id}`}
      className="glass-card"
      onClick={() => onPlay(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        overflow: "hidden",
        animation: `fadeSlideUp 0.35s ${index * 0.05}s ease both`,
      }}
    >
      {/* Thumbnail placeholder */}
      <div
        style={{
          height: 160,
          background: cardGradient(video._id),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          transition: "opacity 0.2s",
          opacity: hovered ? 0.9 : 1,
        }}
      >
        {/* Play overlay */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: hovered ? "rgba(124,58,237,0.85)" : "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.25s",
            boxShadow: hovered ? "0 0 24px var(--accent-glow)" : "none",
            transform: hovered ? "scale(1.1)" : "scale(1)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
        </div>

        {/* Duration badge */}
        <span
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {formatDuration(video.duration)}
        </span>

        {/* HLS badge */}
        <span
          className="badge badge-purple"
          style={{ position: "absolute", top: 10, left: 10 }}
        >
          HLS
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "var(--text-primary)",
            marginBottom: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={video.videoName}
        >
          {video.videoName}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            💾 {formatSize(video.originalSize)}
          </span>
        </div>
      </div>
    </div>
  );
}
