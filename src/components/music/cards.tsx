"use client"

import { Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount, trackKey } from "@/lib/client-utils"
import type { AppArtist, AppPlaylistCollection, AppTrack } from "@/lib/types"
import { Artwork } from "./artwork"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"

/* --------------------------------- track ---------------------------------- */

interface TrackCardProps {
  track: AppTrack
  onPlay: () => void
}

export function TrackCard({ track, onPlay }: TrackCardProps) {
  const current = usePlayerStore((s) => s.queue[s.currentIndex])
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isCurrent = current && trackKey(current) === trackKey(track)
  const active = Boolean(isCurrent && isPlaying)

  return (
    <div
      className="group relative flex w-full flex-col gap-2 rounded-xl p-2.5 transition-colors hover:bg-white/[0.05] not-dark:hover:bg-black/[0.04] cursor-pointer"
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onPlay()
        }
      }}
      aria-label={`Play ${track.title}`}
    >
      <div className="relative">
        <Artwork
          src={track.artwork}
          alt={`${track.title} cover art`}
          className="aspect-square w-full"
          rounded="rounded-lg"
          iconSize={28}
        />
        <button
          className={cn(
            "absolute bottom-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-black/40",
            "translate-y-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:opacity-100",
            active && "translate-y-0 opacity-100"
          )}
          aria-label={active ? "Pause" : "Play"}
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
        >
          {active ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
      <div className="min-w-0">
        <div className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>{track.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {track.isPreview && <span className="mr-1 rounded-[3px] border border-border px-1 text-[9px] font-semibold">PREVIEW</span>}
          {track.artist}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- artist --------------------------------- */

interface ArtistCardProps {
  artist: AppArtist
  onClick?: () => void
}

export function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const navigate = useUIStore((s) => s.navigate)
  return (
    <div
      className="group flex w-full flex-col items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-white/[0.05] not-dark:hover:bg-black/[0.04] cursor-pointer text-center"
      onClick={onClick ?? (() => navigate({ name: "artist", id: artist.id }))}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          ;(onClick ?? (() => navigate({ name: "artist", id: artist.id })))()
        }
      }}
      aria-label={`Open artist ${artist.name}`}
    >
      <Artwork
        src={artist.avatar}
        alt={`${artist.name} avatar`}
        className="h-24 w-24 lg:h-28 lg:w-28"
        rounded="rounded-full"
        iconSize={28}
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{artist.name}</div>
        <div className="text-xs text-muted-foreground">{formatCount(artist.followers)} followers</div>
      </div>
    </div>
  )
}

/* ------------------------------- collection ------------------------------- */

interface CollectionCardProps {
  collection: AppPlaylistCollection
  onClick?: () => void
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  return (
    <div
      className="group flex w-full flex-col gap-2 rounded-xl p-2.5 transition-colors hover:bg-white/[0.05] not-dark:hover:bg-black/[0.04] cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`Open playlist ${collection.name}`}
    >
      <Artwork
        src={collection.artwork}
        alt={`${collection.name} cover`}
        className="aspect-square w-full"
        rounded="rounded-lg"
        iconSize={28}
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{collection.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {collection.trackCount} tracks · {collection.owner}
        </div>
      </div>
    </div>
  )
}

/* --------------------------- horizontal scroller -------------------------- */

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef } from "react"

export function ScrollRow({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 480, behavior: "smooth" })
  }
  return (
    <div className="group/row relative">
      <div
        ref={ref}
        className="flex gap-1 overflow-x-auto lyra-scroll pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={ariaLabel}
      >
        {children}
      </div>
      <button
        onClick={() => scrollBy(-1)}
        className="absolute -left-3 top-[38%] hidden h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur md:flex opacity-0 group-hover/row:opacity-100 transition-opacity"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => scrollBy(1)}
        className="absolute -right-3 top-[38%] hidden h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur md:flex opacity-0 group-hover/row:opacity-100 transition-opacity"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
