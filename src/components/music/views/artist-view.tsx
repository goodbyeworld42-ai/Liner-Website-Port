"use client"

import { useEffect, useState } from "react"
import { Play, Shuffle, MapPin, ArrowLeft, BadgeCheck } from "lucide-react"
import type { AppArtist, AppTrack } from "@/lib/types"
import { formatCount } from "@/lib/client-utils"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"
import { TrackRow } from "../track-row"
import { Artwork } from "../artwork"
import { Button } from "@/components/ui/button"

export function ArtistView({ id }: { id: string }) {
  const [artist, setArtist] = useState<AppArtist | null>(null)
  const [tracks, setTracks] = useState<AppTrack[] | null>(null)
  const [missing, setMissing] = useState(false)
  const playTracks = usePlayerStore((s) => s.playTracks)
  const goBack = useUIStore((s) => s.goBack)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/music/artist/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((j) => {
        if (cancelled) return
        setArtist(j?.artist ?? null)
        setTracks(j?.tracks ?? [])
      })
      .catch(() => {
        if (!cancelled) setMissing(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (missing) {
    return (
      <div className="lyra-view-enter flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm font-medium">Artist not found</p>
        <Button variant="outline" size="sm" onClick={goBack} className="rounded-full">
          <ArrowLeft size={14} className="mr-1" /> Go back
        </Button>
      </div>
    )
  }

  if (!artist || tracks === null) {
    return (
      <div className="lyra-view-enter flex flex-col gap-6">
        <div className="lyra-skeleton h-52 w-full rounded-3xl md:h-64" />
        <div className="flex items-center gap-4 px-2">
          <div className="lyra-skeleton h-28 w-28 rounded-full" />
          <div>
            <div className="lyra-skeleton h-6 w-48 rounded" />
            <div className="lyra-skeleton mt-2 h-3.5 w-28 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2">
              <div className="lyra-skeleton h-10 w-10 rounded-md" />
              <div className="flex-1">
                <div className="lyra-skeleton h-3.5 w-1/3 rounded" />
                <div className="lyra-skeleton mt-2 h-3 w-1/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const topTracks = tracks.slice(0, 15)

  return (
    <div className="lyra-view-enter flex flex-col gap-6 pb-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="relative h-48 md:h-64 w-full">
          {artist.cover ? (
            <img src={artist.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/40 via-panel to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 p-5 md:p-7">
          <Artwork
            src={artist.avatar}
            alt={`${artist.name} avatar`}
            className="h-24 w-24 border-2 border-background shadow-xl md:h-32 md:w-32"
            rounded="rounded-full"
            iconSize={30}
          />
          <div className="min-w-0 pb-1">
            <div className="flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Artist
              </span>
            </div>
            <h1 className="mt-0.5 truncate text-2xl md:text-4xl font-extrabold tracking-tight">{artist.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span>{formatCount(artist.followers)} followers</span>
              <span>{formatCount(artist.trackCount)} tracks</span>
              {artist.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {artist.location}
                </span>
              )}
            </p>
          </div>
          <div className="ml-auto hidden md:flex gap-2 pb-1">
            <button
              disabled={topTracks.length === 0}
              onClick={() => playTracks(topTracks, 0)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] disabled:opacity-40"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button
              disabled={topTracks.length === 0}
              onClick={() => playTracks(topTracks, 0, true)}
              className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] disabled:opacity-40"
            >
              <Shuffle size={15} /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {artist.bio && (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
      )}

      {/* mobile action buttons */}
      <div className="flex gap-2.5 md:hidden">
        <button
          disabled={topTracks.length === 0}
          onClick={() => playTracks(topTracks, 0)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Play size={15} fill="currentColor" /> Play
        </button>
        <button
          disabled={topTracks.length === 0}
          onClick={() => playTracks(topTracks, 0, true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          <Shuffle size={14} /> Shuffle
        </button>
      </div>

      {/* top tracks */}
      <section>
        <h2 className="mb-2 text-lg font-bold tracking-tight">Popular tracks</h2>
        {topTracks.length === 0 ? (
          <p className="px-1 py-6 text-sm text-muted-foreground">No streamable tracks yet.</p>
        ) : (
          <div className="flex flex-col">
            {topTracks.map((t, i) => (
              <TrackRow
                key={`${t.source}:${t.id}`}
                track={t}
                index={i}
                onPlay={() => playTracks(topTracks, i)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
