import React, { useState } from "react";

interface PlayUrlViewProps {
  onPlay: (url: string) => void;
}

export default function PlayUrlView({ onPlay }: PlayUrlViewProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) onPlay(url);
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>Play from URL</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Paste any HLS stream URL (.m3u8) to play it directly in the video player.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontSize: "0.95rem", fontWeight: 500, color: "var(--text-primary)" }}>Stream URL</label>
          <input
            type="url"
            required
            placeholder="https://example.com/stream.m3u8"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ justifyContent: "center", padding: "14px", fontSize: "1rem" }} disabled={!url}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 3l14 9-14 9V3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Play Stream
        </button>
      </form>
    </div>
  );
}
