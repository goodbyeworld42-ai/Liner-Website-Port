import type { AppTrack, TrackSource } from "./types"

/** Resolve the playable URL for a track through the streaming proxy. */
export function streamUrlFor(track: { id: string; source: TrackSource }): string {
  return `/api/music/stream/${encodeURIComponent(track.source)}:${encodeURIComponent(track.id)}`
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds < 0 || !Number.isFinite(seconds)) return "0:00"
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  return `${m}:${String(s % 60).padStart(2, "0")}`
}

export function formatCount(n?: number | null): string {
  if (!n || n <= 0) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return String(n)
}

export function trackKey(t: Pick<AppTrack, "id" | "source">): string {
  return `${t.source}:${t.id}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Up late?"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}
