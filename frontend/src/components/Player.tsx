import "media-chrome";
import "hls-video-element";
import type { Video } from "../types";

interface PlayerProps {
  videoUrl: string;
  video: Video;
  onBack: () => void;
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

export default function Player({ videoUrl, video, onBack }: PlayerProps) {
  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Back button + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          className="btn-ghost"
          onClick={onBack}
          style={{ padding: "8px 14px", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {video.videoName}
          </h2>
          <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              🕐 {formatDuration(video.duration)}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              💾 {formatSize(video.originalSize)}
            </span>
            <span className="badge badge-purple">HLS</span>
          </div>
        </div>
      </div>

      {/* Player */}
      <div
        style={{
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-glow)",
          background: "#000",
        }}
      >
        <media-controller>
          <hls-video
            slot="media"
            src={videoUrl}
            crossOrigin="use-credentials"
            preload="auto"
          />
          <media-loading-indicator slot="centered-chrome" noautohide="" />
          <media-control-bar>
            <media-play-button />
            <media-mute-button />
            <media-volume-range />
            <media-time-display showduration="" />
            <media-time-range />
            <media-playback-rate-button />
            <media-pip-button />
            <media-fullscreen-button />
          </media-control-bar>
        </media-controller>
      </div>

      {/* Info card */}
      <div
        className="glass-card"
        style={{ padding: "20px 24px", display: "flex", gap: 32, flexWrap: "wrap" }}
      >
        {[
          { label: "FILE NAME", value: video.videoName },
          { label: "DURATION", value: formatDuration(video.duration) },
          { label: "ORIGINAL SIZE", value: formatSize(video.originalSize) },
          { label: "FORMAT", value: "HLS Adaptive (master.m3u8)" },
          { label: "CDN", value: "AWS CloudFront" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.06em" }}>
              {label}
            </p>
            <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}