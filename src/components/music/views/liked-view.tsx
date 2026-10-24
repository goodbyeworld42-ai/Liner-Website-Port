"use client"

import { Heart, Play, Shuffle } from "lucide-react"
import { useLibraryStore } from "@/store/library-store"
import { usePlayerStore } from "@/store/player-store"
import { TrackRow } from "../track-row"

export function LikedView() {
  const likes = useLibraryStore((s) => s.likes)
  const loaded = useLibraryStore((s) => s.loaded)
  const playTracks = usePlayerStore((s) => s.playTracks)

  const totalMinutes = Math.round(likes.reduce((acc, t) => acc + (t.duration || 0), 0) / 60)

  return (
    <div className="lyra-view-enter flex flex-col gap-6 pb-6">
      {/* hero */}
      <div className="flex flex-col items-start gap-5 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-6 md:flex-row md:items-end md:p-8">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-400 shadow-2xl shadow-primary/30 md:h-40 md:w-40">
          <Heart size={44} className="text-white" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Collection</p>
          <h1 className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">Liked Songs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {likes.length} {likes.length === 1 ? "track" : "tracks"}
            {likes.length > 0 && ` · about ${totalMinutes} min`}
          </p>
          {likes.length > 0 && (
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => playTracks(likes, 0)}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
              >
                <Play size={16} fill="currentColor" /> Play
              </button>
              <button
                onClick={() => playTracks(likes, 0, true)}
                className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              >
                <Shuffle size={15} /> Shuffle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* tracks */}
      {!loaded ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <div className="lyra-skeleton h-10 w-10 rounded-md" />
              <div className="flex-1">
                <div className="lyra-skeleton h-3.5 w-1/3 rounded" />
                <div className="lyra-skeleton mt-2 h-3 w-1/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : likes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Heart size={30} className="text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">No liked songs yet</p>
          <p className="text-xs text-muted-foreground">Tap the heart on any track to collect it here.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {likes.map((t, i) => (
            <TrackRow
              key={`${t.source}:${t.id}`}
              track={t}
              index={i}
              onPlay={() => playTracks(likes, i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
