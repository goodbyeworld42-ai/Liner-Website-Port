"use client"

import { useCallback, useRef, useState } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  ListMusic,
  Maximize2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration, trackKey } from "@/lib/client-utils"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { useUIStore } from "@/store/ui-store"
import { Artwork } from "./artwork"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

function ProgressBar({ compact = false }: { compact?: boolean }) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const seek = usePlayerStore((s) => s.seek)
  const [dragging, setDragging] = useState<number | null>(null)
  const pct = ((dragging ?? currentTime) / (duration || 1)) * 100

  const onSeek = useCallback(
    (vals: number[]) => {
      seek(vals[0])
      setDragging(null)
    },
    [seek]
  )

  return (
    <div className={cn("flex w-full items-center gap-2", compact ? "" : "px-0.5")}>
      {!compact && (
        <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
          {formatDuration(dragging ?? currentTime)}
        </span>
      )}
      <div className="relative flex-1">
        <Slider
          value={[Math.min(dragging ?? currentTime, duration || 1)]}
          max={Math.max(duration || 1, 1)}
          step={0.5}
          onValueChange={(v) => setDragging(v[0])}
          onValueCommit={onSeek}
          className="cursor-pointer"
          aria-label="Seek"
        />
        {/* tint the completed portion in accent red */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-primary/90"
          style={{ width: `calc(${Math.min(pct, 100)}% - ${pct > 2 ? "8px" : "0px"})`, maxWidth: "calc(100% - 8px)" }}
          aria-hidden
        />
      </div>
      {!compact && (
        <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  )
}

function TransportButton({ big = false }: { big?: boolean }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isLoading = usePlayerStore((s) => s.isLoading)
  const toggle = usePlayerStore((s) => s.toggle)
  const hasQueue = usePlayerStore((s) => s.queue.length > 0)

  return (
    <button
      onClick={toggle}
      disabled={!hasQueue}
      className={cn(
        "flex items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all",
        "hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100",
        big ? "h-12 w-12" : "h-10 w-10"
      )}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isLoading ? (
        <Loader2 size={big ? 20 : 17} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={big ? 20 : 17} fill="currentColor" />
      ) : (
        <Play size={big ? 20 : 17} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  )
}

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const effective = muted ? 0 : volume

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <button
        onClick={toggleMute}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {effective === 0 ? <VolumeX size={16} /> : effective < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="lyra-range w-20"
        style={{
          background: `linear-gradient(to right, var(--foreground) ${effective * 100}%, rgba(128,128,128,0.3) ${effective * 100}%)`,
        }}
        aria-label="Volume"
      />
    </div>
  )
}

export function PlayerBar() {
  const track = usePlayerStore((s) => s.queue[s.currentIndex])
  const queueLength = usePlayerStore((s) => s.queue.length)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)
  const next = usePlayerStore((s) => s.next)
  const previous = usePlayerStore((s) => s.previous)
  const setExpanded = usePlayerStore((s) => s.setExpanded)
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen)
  const queueOpen = usePlayerStore((s) => s.queueOpen)
  const error = usePlayerStore((s) => s.error)
  const toggleLike = useLibraryStore((s) => s.toggleLike)
  const isLiked = useLibraryStore((s) => s.isLiked)
  const navigate = useUIStore((s) => s.navigate)

  const [mobileSeek, setMobileSeek] = useState(0)
  const seekRef = useRef(usePlayerStore.getState().seek)
  seekRef.current = usePlayerStore.getState().seek

  if (!track) {
    return (
      <div className="h-[76px] md:h-[84px] border-t border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Pick a track to start listening</p>
      </div>
    )
  }

  const liked = isLiked(track)

  return (
    <div
      className="relative h-[76px] md:h-[84px] border-t border-border/60 bg-background/80 backdrop-blur-xl"
      role="region"
      aria-label="Player controls"
    >
      {error && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-destructive/90 px-3 py-1 text-xs text-white shadow-lg">
          {error}
        </div>
      )}

      <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-4">
        {/* left: track info */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="group relative shrink-0"
            onClick={() => setExpanded(true)}
            aria-label="Open fullscreen player"
          >
            <Artwork src={track.artwork} alt="" className="h-11 w-11 md:h-12 md:w-12" iconSize={16} rounded="rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 size={14} className="text-white" />
            </div>
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{track.title}</div>
            <button
              className="truncate text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => track.artistId && navigate({ name: "artist", id: track.artistId })}
            >
              {track.artist}
            </button>
          </div>
          <button
            onClick={() => void toggleLike(track)}
            className="ml-1 hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label={liked ? "Unlike" : "Like"}
          >
            {liked ? <Heart size={16} className="text-primary" fill="currentColor" /> : <Heart size={16} />}
          </button>
        </div>

        {/* center: transport + progress (desktop) */}
        <div className="hidden md:flex flex-col items-center gap-1.5 w-full max-w-xl">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              className={cn("h-8 w-8 rounded-full text-muted-foreground hover:text-foreground", shuffle && "text-primary")}
              aria-label={`Shuffle ${shuffle ? "on" : "off"}`}
            >
              <Shuffle size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={previous}
              className="h-9 w-9 rounded-full text-foreground/80 hover:text-foreground"
              aria-label="Previous"
            >
              <SkipBack size={18} fill="currentColor" />
            </Button>
            <TransportButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => next(true)}
              className="h-9 w-9 rounded-full text-foreground/80 hover:text-foreground"
              aria-label="Next"
            >
              <SkipForward size={18} fill="currentColor" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleRepeat}
              className={cn("h-8 w-8 rounded-full text-muted-foreground hover:text-foreground", repeat !== "off" && "text-primary")}
              aria-label={`Repeat mode: ${repeat}`}
            >
              {repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </Button>
          </div>
          <ProgressBar />
        </div>

        {/* right: volume, queue, expand */}
        <div className="flex items-center justify-end gap-1 md:gap-2">
          {/* mobile transport */}
          <div className="flex md:hidden items-center gap-1">
            <Button variant="ghost" size="icon" onClick={previous} className="h-9 w-9 rounded-full" aria-label="Previous">
              <SkipBack size={18} fill="currentColor" />
            </Button>
            <TransportButton />
            <Button variant="ghost" size="icon" onClick={() => next(true)} className="h-9 w-9 rounded-full" aria-label="Next">
              <SkipForward size={18} fill="currentColor" />
            </Button>
          </div>
          <VolumeControl />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQueueOpen(!queueOpen)}
            className={cn("h-9 w-9 rounded-full text-muted-foreground hover:text-foreground", queueOpen && "text-primary")}
            aria-label="Toggle queue"
          >
            <ListMusic size={17} />
            {queueLength > 0 && (
              <span className="ml-3.5 absolute text-[9px] font-semibold tabular-nums bg-primary text-white rounded-full px-1">
                {queueLength}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(true)}
            className="hidden md:inline-flex h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Fullscreen player"
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>

      {/* mobile progress line */}
      <div
        className="md:hidden absolute top-0 left-0 h-[2.5px] bg-primary transition-[width] duration-150"
        style={{ width: `${((mobileSeek || usePlayerStore.getState().currentTime) / (usePlayerStore.getState().duration || 1)) * 100}%` }}
        aria-hidden
      />
      <MobileProgressSync onTick={(t) => setMobileSeek(t)} />
    </div>
  )
}

/** lightweight subscription so the thin mobile progress line animates */
import { useEffect } from "react"
function MobileProgressSync({ onTick }: { onTick: (t: number) => void }) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  useEffect(() => {
    onTick(currentTime)
  }, [currentTime, onTick])
  return null
}
