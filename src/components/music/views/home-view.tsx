"use client"

import { useEffect, useState } from "react"
import { Play, Pause, Clock3, Sparkles } from "lucide-react"
import type { AppArtist, AppPlaylistCollection, AppTrack } from "@/lib/types"
import { greeting } from "@/lib/client-utils"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { useUIStore } from "@/store/ui-store"
import { TrackCard, ArtistCard, CollectionCard, ScrollRow } from "../cards"
import { Artwork } from "../artwork"

const GENRES = [
  "Electronic",
  "Hip-Hop/Rap",
  "House",
  "Pop",
  "R&B/Soul",
  "Lo-Fi",
  "Rock",
  "Jazz",
  "Techno",
  "Ambient",
] as const

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  )
}

function TrackSkeletonRow() {
  return (
    <div className="flex gap-1 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-[150px] lg:w-[170px] shrink-0 rounded-xl p-2.5">
          <div className="lyra-skeleton aspect-square w-full rounded-lg" />
          <div className="lyra-skeleton mt-2 h-3.5 w-3/4 rounded" />
          <div className="lyra-skeleton mt-1.5 h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}

export function HomeView() {
  const [trending, setTrending] = useState<AppTrack[] | null>(null)
  const [underground, setUnderground] = useState<AppTrack[] | null>(null)
  const [collections, setCollections] = useState<AppPlaylistCollection[] | null>(null)
  const [genreMap, setGenreMap] = useState<Record<string, AppTrack[]>>({})
  const history = useLibraryStore((s) => s.history)
  const playTracks = usePlayerStore((s) => s.playTracks)
  const playNow = usePlayerStore((s) => s.playNow)
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const navigate = useUIStore((s) => s.navigate)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/music/trending?limit=24").then((r) => r.json()).catch(() => null),
      fetch("/api/music/underground").then((r) => r.json()).catch(() => null),
      fetch("/api/music/playlists-trending").then((r) => r.json()).catch(() => null),
    ]).then(([trendingRes, undergroundRes, collectionsRes]) => {
      if (cancelled) return
      setTrending(trendingRes?.tracks ?? [])
      setUnderground(undergroundRes?.tracks ?? [])
      setCollections(collectionsRes?.collections ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  // lazy-load two genre rows
  useEffect(() => {
    let cancelled = false
    const initial = ["Electronic", "Hip-Hop/Rap"]
    Promise.all(
      initial.map((g) =>
        fetch(`/api/music/trending?genre=${encodeURIComponent(g)}&limit=12`)
          .then((r) => r.json())
          .then((j) => [g, j?.tracks ?? []] as const)
          .catch(() => [g, []] as const)
      )
    ).then((entries) => {
      if (cancelled) return
      setGenreMap(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const currentTrack = queue[currentIndex]

  const renderTrackRow = (tracks: AppTrack[]) => (
    <ScrollRow ariaLabel="Track list">
      {tracks.map((t) => (
        <div key={`${t.source}:${t.id}`} className="w-[150px] lg:w-[170px] shrink-0">
          <TrackCard track={t} onPlay={() => playNow(t)} />
        </div>
      ))}
    </ScrollRow>
  )

  const renderHero = () => {
    const featured = trending?.[0]
    if (!featured) return null
    return (
      <button
        onClick={() => playTracks(trending ?? [], 0)}
        className="group relative w-full overflow-hidden rounded-2xl text-left"
        aria-label={`Play featured track ${featured.title}`}
      >
        <div className="relative h-56 md:h-64 w-full overflow-hidden">
          <Artwork src={featured.artwork} alt="" className="absolute inset-0 h-full w-full" rounded="rounded-none" iconSize={40} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 md:p-6">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              <Sparkles size={11} /> Featured today
            </div>
            <h1 className="truncate text-2xl md:text-3xl font-bold text-white [text-wrap:balance]">{featured.title}</h1>
            <p className="mt-1 truncate text-sm text-white/65">
              {featured.artist}
              {featured.genre ? ` · ${featured.genre}` : ""}
            </p>
          </div>
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-primary p-4 text-white shadow-xl shadow-primary/30 transition-transform group-hover:scale-105">
            {isPlaying && currentTrack?.id === featured.id ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="lyra-view-enter flex flex-col gap-8 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fresh music, picked for right now.</p>
      </div>

      {trending && trending.length > 0 && renderHero()}

      {/* recently played */}
      {history.length > 0 && (
        <section>
          <SectionHeading title="Jump back in" />
          {renderTrackRow(history.slice(0, 14))}
        </section>
      )}

      {/* trending */}
      <section>
        <SectionHeading title="Trending now" subtitle="Audius · this week" />
        {trending === null ? <TrackSkeletonRow /> : renderTrackRow(trending.slice(0, 16))}
      </section>

      {/* trending playlists */}
      {collections && collections.length > 0 && (
        <section>
          <SectionHeading title="Playlists for you" />
          <ScrollRow ariaLabel="Trending playlists">
            {collections.map((c) => (
              <div key={c.id} className="w-[150px] lg:w-[170px] shrink-0">
                <CollectionCard
                  collection={c}
                  onClick={() => navigate({ name: "collection", collection: c })}
                />
              </div>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* underground */}
      <section>
        <SectionHeading title="Underground gems" subtitle="Fresh from independent artists" />
        {underground === null ? <TrackSkeletonRow /> : renderTrackRow(underground.slice(0, 16))}
      </section>

      {/* genre rows */}
      {GENRES.slice(0, 4).map((genre) => {
        const tracks = genreMap[genre]
        if (tracks && tracks.length === 0) return null
        return (
          <section key={genre}>
            <SectionHeading title={`${genre}`} subtitle="Genre spotlight" />
            {tracks === undefined ? <TrackSkeletonRow /> : renderTrackRow(tracks.slice(0, 12))}
          </section>
        )
      })}
    </div>
  )
}
