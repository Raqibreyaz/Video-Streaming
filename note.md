# Topic: Video Streaming at Scale

- Lecture: How Video Streaming Works on Scale - System Design
- Date: 2026-06-24
- Area: System Design
- One-sentence summary: This lecture explores the evolution of video delivery from progressive downloads to adaptive bitrate streaming (ABR) using HLS and DASH protocols.

## 1. What is this topic?

- Definition: Video streaming is the delivery of multimedia content over the internet in chunks, allowing playback to start before the entire file is downloaded.
- Why it exists: Traditional "progressive downloads" caused high latency and bandwidth waste by forcing users to download entire files. ABR solves this by adapting quality to network conditions.
- Where it’s used: Video platforms like YouTube, Netflix, TikTok, and Instagram.

## 2. Mental model & intuition

Think of a video not as a single long file, but as a sequence of high-speed images (frames). If you try to hand someone a giant 5GB book (the video), they have to wait for the whole thing to finish printing before reading. Streaming is like breaking that book into small chapters (segments). You hand them chapter one first; they can start reading while you are still printing chapter two. If the reader's "reading speed" (internet connection) drops, you hand them a smaller, simpler summary version of the next chapter so they never stop reading.

## 3. Internal working (mechanism)

- Key steps:
  1. Source video upload (e.g., 4K).
  2. Encoding/Transcoding: The server processes the source into multiple quality levels (e.g., 240p, 480p, 720p, 1080p).
  3. Segmentation: Each quality level is cut into small time-based segments.
  4. Indexing: A manifest file (e.g., .m3u8 for HLS or .mpd for DASH) is created. This acts as a map for the client.
  5. Client selection: The player reads the manifest, detects the current network throughput/device capability, and requests the appropriate segment quality.
- Data flow: User requests manifest -> Client parses manifest -> Client fetches specific segment based on bandwidth -> Player buffers and renders.

## 4. Important terms & concepts

- Progressive Download: The old way; forces the user to download the full file before playback.
- Adaptive Bitrate Streaming (ABR): Dynamically changing the video quality based on real-time internet speeds.
- Manifest File (.m3u8 / .mpd): The index that lists all available quality segments and their locations.
- Segments: Small, discrete chunks of video files that a player requests sequentially.
- Encoding/Transcoding: The process of converting one video format/resolution to another.

## 5. Example(s)

- Minimal: A single MP4 file served directly (Progressive Download).
- Production: A client loads `master.m3u8`. It sees entries for 240p, 480p, and 1080p. On a slow 3G connection, the player chooses the 240p segment to prevent stuttering (buffering).

## 6. Code / commands / API patterns

javascript
// Typical HLS implementation logic in Video.js
player.src({
  src: 'path/to/video.m3u8',
  type: 'application/x-mpegURL'
});

Explanation: This command initializes the player to interpret the M3U8 manifest, allowing it to handle the switching of segments automatically.

## 7. Edge cases, gotchas, and failure modes

- Edge cases: Sudden network drops causing aggressive quality downgrades.
- Gotchas: Forgetting to provide multiple resolutions means the player cannot adapt, leading to constant buffering.
- Failure modes: Incomplete encoding pipelines or misconfigured CORS policies preventing the client from fetching segments.

## 8. Trade-offs and alternatives

- Trade-offs: Higher storage costs and complex infrastructure requirements for transcoding vs. better user experience.
- Alternatives:
  - RTMP/RTSP: Specialized protocols for ultra-low latency, often used for live broadcasting, but harder to scale over standard web HTTP.

## 9. Questions and doubts while learning

- Question: Why not just send 4K to everyone?
  - Understanding: It wastes bandwidth, causes buffering on slow connections, and exceeds the capabilities of small-screen devices.

## 10. Practice tasks from the lecture

- Task: Implement ABR using a service like ImageKit.
  - Goal: Understand the integration of HLS/DASH manifest files.
  - Approach: Use the provided documentation to append `master.m3u8` or `.mpd` to a video URL.

## 11. Key takeaways

- Video is a sequence of image frames.
- Progressive downloads are inefficient for modern web streaming.
- ABR (Adaptive Bitrate) improves the user experience by matching quality to network health.
- Manifest files act as the "map" for the video player.
- Using managed services like ImageKit simplifies complex transcoding/hosting pipelines.

## 12. Minimal self-test

1. What is the difference between Progressive Download and ABR?
2. What is the function of an M3U8 file?
3. How does the player decide which quality level to request?
4. What happens if a video is not transcoded into multiple segments?
5. Which protocols are primarily used for ABR?

---

# Implementation Notes (Raw)

## FFmpeg segment naming & `-start_number 0`

- `-hls_segment_filename "segment%03d.ts"` → numeric placeholder for segment files
- `%03d` = pad to 3 digits, does NOT cap total segments at 999
- progression: `segment000.ts` → `segment001.ts` → ... → `segment999.ts` → `segment1000.ts`
- `-start_number 0` → numbering starts from zero; explicit but usually matches default

## Why the frontend should load `master.m3u8`

- frontend must point to the **master playlist**, not a `.ts` file or a single-rendition playlist
- master playlist tells the player which quality variants exist
- player auto-selects the right variant, or exposes them for manual selection

## How multi-resolution HLS ladders work

- instead of one output → generate multiple renditions (360p, 480p, 720p, etc.)
- each rendition gets its own playlist + segment set
- master playlist contains `#EXT-X-STREAM-INF` entries referencing those variant playlists
- this is standard adaptive bitrate / quality-switching setup

## Migration: single-quality → multi-quality transcoding

### single-quality command

```bash
ffmpeg -i input.mp4 \
  -codec:v libx264 -codec:a aac \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "output/segment%03d.ts" \
  -start_number 0 \
  output/index.m3u8
```

### multi-quality ladder command

```bash
ffmpeg -i input.mp4 \
  -map 0:v:0 -map 0:a:0 \
  -map 0:v:0 -map 0:a:0 \
  -map 0:v:0 -map 0:a:0 \
  -c:v libx264 -c:a aac -ar 48000 \
  -filter:v:0 scale=w=640:h=360  -b:v:0 800k  -maxrate:v:0 1000k -bufsize:v:0 1600k \
  -filter:v:1 scale=w=854:h=480  -b:v:1 1400k -maxrate:v:1 1800k -bufsize:v:1 2800k \
  -filter:v:2 scale=w=1280:h=720 -b:v:2 2800k -maxrate:v:2 3500k -bufsize:v:2 5600k \
  -b:a:0 96k -b:a:1 128k -b:a:2 128k \
  -preset medium \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_flags independent_segments \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p" \
  -hls_segment_filename "output/%v/segment_%03d.ts" \
  "output/%v/index.m3u8"
```

## Why Video.js quality controls don't appear automatically

- loading `master.m3u8` alone is NOT enough to show a quality menu
- Video.js needs the quality-level plugin path + a compatible selector plugin
- some browsers use native HLS playback → bypasses the plugin path entirely
- in newer Video.js setups, force VHS non-native playback: `html5.vhs.overrideNative = true`
- even then, iOS / native HLS may still not expose manual quality switching