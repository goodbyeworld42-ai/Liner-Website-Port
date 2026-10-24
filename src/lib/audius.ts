import type { AppArtist, AppPlaylistCollection, AppTrack, TrackSource } from "./types"

const APP_NAME = "LyraWeb"
const DISCOVERY_HOSTS = [
  "https://discoveryprovider.audius.co",
  "https://discoveryprovider2.audius.co",
  "https://discoveryprovider3.audius.co",
]

export function streamUrlFor(track: { id: string; source: TrackSource }): string {
  return `/api/music/stream/${encodeURIComponent(track.source)}:${encodeURIComponent(track.id)}`
}

function pickHost(json: unknown): string {
  const hosts = (json as { data?: string[] })?.data
  if (Array.isArray(hosts) && hosts.length > 0) return hosts[0]
  return DISCOVERY_HOSTS[0]
}

let cachedHost: string | null = null
async function getHost(): Promise<string> {
  if (cachedHost) return cachedHost
  try {
    const res = await fetch("https://api.audius.co", {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) cachedHost = pickHost(await res.json())
  } catch {
    // fall through to default
  }
  if (!cachedHost) cachedHost = DISCOVERY_HOSTS[0]
  return cachedHost
}

async function audiusFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  const host = await getHost()
  const sep = path.includes("?") ? "&" : "?"
  for (const candidate of [host, ...DISCOVERY_HOSTS.filter((h) => h !== host)]) {
    try {
      const res = await fetch(`${candidate}${path}${sep}app_name=${APP_NAME}`, {
        next: { revalidate },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const json = await res.json()
      return (json?.data ?? null) as T
    } catch {
      continue
    }
  }
  return null
}

/* ------------------------------ normalizers ------------------------------ */

interface AudiusProfileImage {
  "150x150"?: string
  "480x480"?: string
  "1000x1000"?: string
}

interface AudiusUser {
  id: string
  name: string
  handle: string
  profile_picture_sizes?: AudiusProfileImage
  cover_photo_sizes?: AudiusProfileImage
  cover_photo?: string
  follower_count?: number
  track_count?: number
  bio?: string
  location?: string
  is_deactivated?: boolean
}

interface AudiusTrack {
  id: string
  title: string
  duration: number
  genre?: string
  mood?: string
  release_date?: string
  play_count?: number
  favorite_count?: number
  is_streamable?: boolean
  is_delete?: boolean
  artwork?: AudiusProfileImage
  user?: AudiusUser
}

function artworkUrl(img?: AudiusProfileImage): string | null {
  if (!img) return null
  return img["480x480"] ?? img["150x150"] ?? img["1000x1000"] ?? null
}

function normalizeTrack(t: AudiusTrack): AppTrack | null {
  if (!t?.id || !t.title || t.is_delete) return null
  const streamable = t.is_streamable !== false
  if (!streamable) return null
  return {
    id: t.id,
    source: "audius",
    title: t.title,
    artist: t.user?.name ?? t.user?.handle ?? "Unknown artist",
    artistId: t.user?.id ?? null,
    artwork: artworkUrl(t.artwork),
    duration: typeof t.duration === "number" ? t.duration : 0,
    genre: t.genre ?? null,
    mood: t.mood ?? null,
    releaseDate: t.release_date ?? null,
    playCount: t.play_count ?? 0,
    favoriteCount: t.favorite_count ?? 0,
    isPreview: false,
  }
}

export function normalizeArtist(u: AudiusUser): AppArtist {
  return {
    id: u.id,
    name: u.name || u.handle,
    handle: u.handle,
    avatar: artworkUrl(u.profile_picture_sizes),
    cover: u.cover_photo_sizes?.["1000x1000"] ?? u.cover_photo_sizes?.["480x480"] ?? u.cover_photo ?? null,
    followers: u.follower_count ?? 0,
    trackCount: u.track_count ?? 0,
    bio: u.bio ?? null,
    location: u.location ?? null,
  }
}

function normalizeCollection(p: AudiusPlaylistLike): AppPlaylistCollection | null {
  if (!p?.id || !p.playlist_name) return null
  return {
    id: p.id,
    name: p.playlist_name,
    artwork: artworkUrl(p.artwork),
    owner: p.user?.name ?? p.user?.handle ?? "Unknown",
    ownerId: p.user?.id ?? null,
    trackCount: p.track_count ?? p.playlist_contents?.length ?? 0,
    favoriteCount: p.favorite_count ?? 0,
    description: p.description ?? null,
  }
}

interface AudiusPlaylistLike {
  id: string
  playlist_name: string
  artwork?: AudiusProfileImage
  user?: AudiusUser
  track_count?: number
  favorite_count?: number
  description?: string
  playlist_contents?: { track?: { track?: AudiusTrack } }[]
  is_album?: boolean
}

/* -------------------------------- endpoints ------------------------------- */

export async function fetchTrending(genre?: string, limit = 30): Promise<AppTrack[]> {
  const genrePart = genre ? `&genre=${encodeURIComponent(genre)}` : ""
  const data = await audiusFetch<AudiusTrack[]>(
    `/v1/tracks/trending?limit=${limit}&time=week${genrePart}`
  )
  if (!data) return []
  return data.map(normalizeTrack).filter((t): t is AppTrack => t !== null)
}

export async function fetchUnderground(limit = 20): Promise<AppTrack[]> {
  const data = await audiusFetch<AudiusTrack[]>(`/v1/tracks/trending/underground?limit=${limit}`)
  if (!data) return []
  return data.map(normalizeTrack).filter((t): t is AppTrack => t !== null)
}

export async function fetchTrack(id: string): Promise<AppTrack | null> {
  const data = await audiusFetch<AudiusTrack>(`/v1/tracks/${id}`)
  return data ? normalizeTrack(data) : null
}

export async function searchTracks(query: string, limit = 24): Promise<AppTrack[]> {
  if (!query.trim()) return []
  const data = await audiusFetch<AudiusTrack[]>(
    `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    120
  )
  if (!data) return []
  return data.map(normalizeTrack).filter((t): t is AppTrack => t !== null)
}

export async function searchArtists(query: string, limit = 12): Promise<AppArtist[]> {
  if (!query.trim()) return []
  const data = await audiusFetch<AudiusUser[]>(
    `/v1/users/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    120
  )
  if (!data) return []
  return data.filter((u) => !u.is_deactivated).map(normalizeArtist)
}

export async function fetchArtist(id: string): Promise<AppArtist | null> {
  const data = await audiusFetch<AudiusUser>(`/v1/users/${id}`)
  return data ? normalizeArtist(data) : null
}

export async function fetchArtistTracks(id: string, limit = 30): Promise<AppTrack[]> {
  const data = await audiusFetch<AudiusTrack[]>(`/v1/users/${id}/tracks?sort=plays&limit=${limit}`)
  if (!data) return []
  return data.map(normalizeTrack).filter((t): t is AppTrack => t !== null)
}

export async function fetchTrendingPlaylists(limit = 12): Promise<AppPlaylistCollection[]> {
  const data = await audiusFetch<AudiusPlaylistLike[]>(
    `/v1/playlists/trending?limit=${limit}&time=week`
  )
  if (!data) return []
  return data.map(normalizeCollection).filter((p): p is AppPlaylistCollection => p !== null)
}

export async function fetchPlaylist(id: string): Promise<{
  collection: AppPlaylistCollection
  tracks: AppTrack[]
} | null> {
  const data = await audiusFetch<AudiusPlaylistLike>(`/v1/playlists/${id}`)
  if (!data) return null
  const collection = normalizeCollection(data)
  if (!collection) return null
  const tracks: AppTrack[] = []
  for (const item of data.playlist_contents ?? []) {
    const t = item?.track?.track
    if (!t) continue
    const nt = normalizeTrack(t)
    if (nt) tracks.push(nt)
  }
  return { collection, tracks }
}
