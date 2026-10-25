import type { AppTrack } from "./types"

interface ItunesResult {
  wrapperType?: string
  kind?: string
  trackId?: number
  trackName?: string
  artistName?: string
  collectionName?: string
  artistId?: number
  artworkUrl100?: string
  artworkUrl60?: string
  trackTimeMillis?: number
  previewUrl?: string
  primaryGenreName?: string
  releaseDate?: string
}

interface ItunesResponse {
  resultCount: number
  results: ItunesResult[]
}

export function upscaleArtwork(url?: string): string | null {
  if (!url) return null
  return url.replace(/\/\d+x\d+bb\.(jpg|png)/, "/600x600bb.$1")
}

/**
 * Search Apple's public iTunes catalog. These are 30-second previews,
 * shown in the app with a "PREVIEW" badge.
 */
export async function searchItunesTracks(query: string, limit = 12): Promise<AppTrack[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?media=music&entity=song&limit=${limit}&term=${encodeURIComponent(query)}`,
      { next: { revalidate: 120 }, signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return []
    const json = (await res.json()) as ItunesResponse
    const tracks: AppTrack[] = []
    for (const r of json.results ?? []) {
      if (r.kind !== "song" || !r.trackId || !r.trackName || !r.previewUrl) continue
      tracks.push({
        id: String(r.trackId),
        source: "itunes",
        title: r.trackName,
        artist: r.artistName ?? "Unknown artist",
        artistId: null,
        artwork: upscaleArtwork(r.artworkUrl100 ?? r.artworkUrl60),
        duration: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 30,
        genre: r.primaryGenreName ?? null,
        releaseDate: r.releaseDate ?? null,
        isPreview: true,
      })
    }
    return tracks
  } catch {
    return []
  }
}

/** Resolve the preview URL for an itunes track id (used by the stream proxy). */
export async function resolveItunesPreview(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as ItunesResponse
    const hit = (json.results ?? []).find((r) => String(r.trackId) === id)
    return hit?.previewUrl ?? null
  } catch {
    return null
  }
}
