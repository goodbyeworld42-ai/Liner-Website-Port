export type TrackSource = "audius" | "itunes"

export interface AppTrack {
  id: string
  source: TrackSource
  title: string
  artist: string
  artistId: string | null
  artwork: string | null
  duration: number // seconds
  genre?: string | null
  mood?: string | null
  releaseDate?: string | null
  playCount?: number
  favoriteCount?: number
  isPreview?: boolean
}

export interface AppArtist {
  id: string
  name: string
  handle: string
  avatar: string | null
  cover: string | null
  followers: number
  trackCount?: number
  bio?: string | null
  location?: string | null
}

export interface AppPlaylistCollection {
  id: string
  name: string
  artwork: string | null
  owner: string
  ownerId: string | null
  trackCount: number
  favoriteCount?: number
  description?: string | null
}

export interface DbTrackRow {
  trackId: string
  source: string
  title: string
  artist: string
  artistId: string | null
  artwork: string | null
  duration: number
}

export function rowToTrack(row: DbTrackRow): AppTrack {
  return {
    id: row.trackId,
    source: (row.source as TrackSource) ?? "audius",
    title: row.title,
    artist: row.artist,
    artistId: row.artistId,
    artwork: row.artwork,
    duration: row.duration,
  }
}
