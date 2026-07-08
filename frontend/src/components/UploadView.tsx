import React, { useCallback, useRef, useState } from "react";
import { getUploadUrl, getVideoDuration, uploadToS3 } from "../api";

type UploadStatus = "idle" | "reading" | "uploading" | "success" | "error";

interface UploadViewProps {
  onSuccess: () => void;
}

const ACCEPTED = [".mp4", ".mkv"];

export default function UploadView({ onSuccess }: UploadViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
    setProgress(0);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleUpload = async () => {
    if (!file) return;
    try {
      setStatus("reading");
      setProgress(0);
      const duration = await getVideoDuration(file);

      setStatus("uploading");
      const { signedUrl } = await getUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        duration,
      });

      await uploadToS3(signedUrl, file, (pct) => setProgress(pct));

      setStatus("success");
      setTimeout(() => onSuccess(), 1800);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const isUploading = status === "uploading" || status === "reading";

  return (
    <div className="animate-fade-up" style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Page title */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>Upload a Video</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Supports <strong style={{ color: "var(--text-primary)" }}>.mp4</strong> and{" "}
          <strong style={{ color: "var(--text-primary)" }}>.mkv</strong> — up to 2 GB.
          Videos are transcoded to HLS automatically after upload.
        </p>
      </div>

      {/* Drop zone */}
      <div
        id="upload-dropzone"
        onClick={() => !isUploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          position: "relative",
          borderRadius: "var(--radius-xl)",
          border: `2px dashed ${isDragging ? "var(--accent-2)" : file ? "var(--border-focus)" : "var(--border)"}`,
          background: isDragging
            ? "rgba(124, 58, 237, 0.08)"
            : file
            ? "rgba(124, 58, 237, 0.04)"
            : "var(--bg-card)",
          padding: "52px 32px",
          textAlign: "center",
          cursor: isUploading ? "default" : "pointer",
          transition: "all 0.25s",
          boxShadow: isDragging ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.15))",
            border: "1px solid rgba(124,58,237,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 24px var(--accent-glow)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-3)" strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
          </svg>
        </div>

        {file ? (
          <>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
              {file.name}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {formatSize(file.size)} · {file.type}
            </p>
            {!isUploading && status !== "success" && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }}>
                Click to change file
              </p>
            )}
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, fontSize: "1.05rem" }}>
              Drop your video here
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              or click to browse
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {status === "reading" ? "Reading metadata…" : "Uploading to S3…"}
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-3)" }}>
              {status === "reading" ? "–" : `${progress}%`}
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 99,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: status === "reading" ? "10%" : `${progress}%`,
                borderRadius: 99,
                background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))",
                transition: "width 0.3s ease",
                boxShadow: "0 0 8px var(--accent-glow)",
              }}
            />
          </div>
        </div>
      )}

      {/* Success state */}
      {status === "success" && (
        <div
          className="glass-card"
          style={{
            marginTop: 20,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderColor: "rgba(34,197,94,0.3)",
            background: "rgba(34,197,94,0.08)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ color: "#86efac", fontWeight: 500 }}>
            Uploaded! Redirecting to your videos…
          </p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          className="glass-card"
          style={{
            marginTop: 20,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderColor: "rgba(244,63,94,0.3)",
            background: "rgba(244,63,94,0.08)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p style={{ color: "#fda4af", fontWeight: 500 }}>{errorMsg}</p>
        </div>
      )}

      {/* Upload button */}
      <div style={{ marginTop: 24 }}>
        <button
          id="upload-submit-btn"
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || isUploading || status === "success"}
          style={{ width: "100%", justifyContent: "center", padding: "13px 24px", fontSize: "1rem" }}
        >
          {isUploading ? (
            <>
              <div className="spinner" />
              {status === "reading" ? "Reading file…" : `Uploading ${progress}%`}
            </>
          ) : status === "success" ? (
            <>✓ Done</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
              </svg>
              Upload Video
            </>
          )}
        </button>
      </div>
    </div>
  );
}
