"use client"

import { useCallback, useEffect, useState } from "react"
import { Heart, ListMusic, Play, Shuffle, Trash2, Plus, ArrowLeft } from "lucide-react"
import { formatDuration } from "@/lib/client-utils"
import type { AppTrack } from "@/lib/types"
import { useLibraryStore } from "@/store/library-store"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"
import { TrackRow } from "../track-row"
import { Artwork } from "../artwork"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function PlaylistView({ id }: { id: string }) {
  const [detail, setDetail] = useState<{ name: string; tracks: AppTrack[] } | null>(null)
  const [missing, setMissing] = useState(false)
  const fetchPlaylistDetail = useLibraryStore((s) => s.fetchPlaylistDetail)
  const removeTrackFromPlaylist = useLibraryStore((s) => s.removeTrackFromPlaylist)
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist)
  const playTracks = usePlayerStore((s) => s.playTracks)
  const goBack = useUIStore((s) => s.goBack)
  const { toast } = useToast()

  const load = useCallback(async () => {
    const d = await fetchPlaylistDetail(id)
    return d
  }, [id, fetchPlaylistDetail])

  useEffect(() => {
    let cancelled = false
    load().then((d) => {
      if (cancelled) return
      if (!d) setMissing(true)
      else setDetail({ name: d.name, tracks: d.tracks })
    })
    return () => {
      cancelled = true
    }
  }, [load])

  if (missing) {
    return (
      <div className="lyra-view-enter flex flex-col items-center gap-3 py-24 text-center">
        <ListMusic size={30} className="text-muted-foreground opacity-40" />
        <p className="text-sm font-medium">Playlist not found</p>
        <Button variant="outline" size="sm" onClick={goBack} className="rounded-full">
          <ArrowLeft size={14} className="mr-1" /> Go back
        </Button>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="lyra-view-enter flex flex-col gap-5">
        <div className="flex items-end gap-5">
          <div className="lyra-skeleton h-36 w-36 rounded-2xl md:h-44 md:w-44" />
          <div className="flex-1 pb-2">
            <div className="lyra-skeleton h-4 w-20 rounded" />
            <div className="lyra-skeleton mt-3 h-10 w-1/2 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
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

  const { name, tracks } = detail
  const totalMinutes = Math.round(tracks.reduce((acc, t) => acc + (t.duration || 0), 0) / 60)

  const handleRemove = async (trackId: string) => {
    await removeTrackFromPlaylist(id, trackId)
    setDetail((d) => (d ? { ...d, tracks: d.tracks.filter((t) => t.id !== trackId) } : d))
    toast({ title: "Removed from playlist" })
  }

  return (
    <div className="lyra-view-enter flex flex-col gap-6 pb-6">
      {/* hero */}
      <div className="flex flex-col items-start gap-5 rounded-3xl border border-border/50 bg-gradient-to-br from-secondary/80 to-background p-6 md:flex-row md:items-end md:p-8">
        <Artwork
          src={tracks.find((t) => t.artwork)?.artwork ?? null}
          alt={`${name} cover`}
          className="h-36 w-36 shadow-2xl md:h-44 md:w-44"
          rounded="rounded-2xl"
          iconSize={40}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Playlist</p>
          <h1 className="mt-1 break-words text-3xl md:text-5xl font-extrabold tracking-tight">{name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            {tracks.length > 0 && ` · about ${totalMinutes} min`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              disabled={tracks.length === 0}
              onClick={() => playTracks(tracks, 0)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button
              disabled={tracks.length === 0}
              onClick={() => playTracks(tracks, 0, true)}
              className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] disabled:opacity-40"
            >
              <Shuffle size={15} /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* tracks */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <ListMusic size={30} className="text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">This playlist is empty</p>
          <p className="text-xs text-muted-foreground">
            Use the “⋯” menu on any track and choose “Add to playlist”.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {tracks.map((t, i) => (
            <TrackRow
              key={`${t.source}:${t.id}:${i}`}
              track={t}
              index={i}
              onPlay={() => playTracks(tracks, i)}
              onRemove={() => void handleRemove(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
