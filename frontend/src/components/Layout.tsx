import React from "react";

interface LayoutProps {
  activeView: "list" | "upload" | "player" | "play-url";
  onNavigate: (view: "list" | "upload" | "play-url") => void;
  children: React.ReactNode;
}

export default function Layout({ activeView, onNavigate, children }: LayoutProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(7, 11, 20, 0.8)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          {/* Logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => onNavigate("list")}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 3l14 9-14 9V3z" fill="white" />
              </svg>
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              Stream<span style={{ color: "var(--accent-2)" }}>Vault</span>
            </span>
          </div>

          {/* Nav tabs */}
          <nav style={{ display: "flex", gap: 4 }}>
            {(["list", "upload", "play-url"] as const).map((view) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    activeView === view
                      ? "rgba(124, 58, 237, 0.2)"
                      : "transparent",
                  color:
                    activeView === view
                      ? "var(--accent-3)"
                      : "var(--text-secondary)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  cursor: "pointer",
                  ...(activeView === view
                    ? { outline: "1px solid rgba(124,58,237,0.4)", outlineOffset: 0 }
                    : {}),
                }}
              >
                {view === "list" ? "My Videos" : view === "upload" ? "Upload" : "Play URL"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: "40px 24px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          StreamVault · HLS Adaptive Streaming via CloudFront
        </p>
      </footer>
    </div>
  );
}
