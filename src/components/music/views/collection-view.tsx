"use client"

import { useEffect, useState } from "react"
import { Play, Shuffle, Heart, ArrowLeft } from "lucide-react"
import type { AppPlaylistCollection, AppTrack } from "@/lib/types"
import { formatCount } from "@/lib/client-utils"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { useUIStore } from "@/store/ui-store"
import { TrackRow } from "../track-row"
import { Artwork } from "../artwork"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

/** Read-only view of a trending Audius playlist / collection. */
export function CollectionView({ collection }: { collection: AppPlaylistCollection }) {
  const [tracks, setTracks] = useState<AppTrack[] | null>(null)
  const playTracks = usePlayerStore((s) => s.playTracks)
  const goBack = useUIStore((s) => s.goBack)
  const createPlaylist = useLibraryStore((s) => s.createPlaylist)
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist)
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/music/playlist/${encodeURIComponent(collection.id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((j) => !cancelled && setTracks(j?.tracks ?? []))
      .catch(() => !cancelled && setTracks([]))
    return () => {
      cancelled = true
    }
  }, [collection.id])

  const saveToLibrary = async () => {
    if (!tracks || saving) return
    setSaving(true)
    const created = await createPlaylist(collection.name.slice(0, 80))
    if (created) {
      const ok = await addTracksToPlaylist(created.id, tracks)
      toast({
        title: ok ? "Saved to your library" : "Nothing to save",
        description: ok ? `${collection.name} · ${tracks.length} tracks` : undefined,
      })
    }
    setSaving(false)
  }

  return (
    <div className="lyra-view-enter flex flex-col gap-6 pb-6">
      <div className="flex flex-col items-start gap-5 rounded-3xl border border-border/50 bg-gradient-to-br from-secondary/80 to-background p-6 md:flex-row md:items-end md:p-8">
        <Artwork
          src={collection.artwork}
          alt={`${collection.name} cover`}
          className="h-36 w-36 shadow-2xl md:h-44 md:w-44"
          rounded="rounded-2xl"
          iconSize={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Playlist · Audius
            </p>
            <button onClick={goBack} className="md:hidden text-muted-foreground" aria-label="Go back">
              <ArrowLeft size={16} />
            </button>
          </div>
          <h1 className="mt-1 break-words text-2xl md:text-4xl font-extrabold tracking-tight">
            {collection.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            by {collection.owner} · {collection.trackCount} tracks ·{" "}
            {formatCount(collection.favoriteCount)} likes
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              disabled={!tracks || tracks.length === 0}
              onClick={() => playTracks(tracks ?? [], 0)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] disabled:opacity-40"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button
              disabled={!tracks || tracks.length === 0}
              onClick={() => playTracks(tracks ?? [], 0, true)}
              className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] disabled:opacity-40"
            >
              <Shuffle size={15} /> Shuffle
            </button>
            <Button
              variant="outline"
              disabled={!tracks || tracks.length === 0 || saving}
              onClick={() => void saveToLibrary()}
              className="rounded-full"
            >
              <Heart size={15} className="mr-1.5" /> {saving ? "Saving…" : "Save to my library"}
            </Button>
          </div>
        </div>
      </div>

      {tracks === null ? (
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
      ) : tracks.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">This playlist is empty.</p>
      ) : (
        <div className="flex flex-col">
          {tracks.map((t, i) => (
            <TrackRow key={`${t.source}:${t.id}:${i}`} track={t} index={i} onPlay={() => playTracks(tracks, i)} />
          ))}
        </div>
      )}
    </div>
  )
}
