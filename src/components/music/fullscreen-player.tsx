"use client"

import { useEffect, useMemo } from "react"
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/client-utils"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { Artwork } from "./artwork"
import { Slider } from "@/components/ui/slider"

interface FullscreenPlayerProps {
  open: boolean
  onClose: () => void
}

function hashString(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function FullscreenPlayer({ open, onClose }: FullscreenPlayerProps) {
  const track = usePlayerStore((s) => s.queue[s.currentIndex])
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isLoading = usePlayerStore((s) => s.isLoading)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const toggle = usePlayerStore((s) => s.toggle)
  const next = usePlayerStore((s) => s.next)
  const previous = usePlayerStore((s) => s.previous)
  const seek = usePlayerStore((s) => s.seek)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen)
  const queueOpen = usePlayerStore((s) => s.queueOpen)
  const toggleLike = useLibraryStore((s) => s.toggleLike)
  const isLiked = useLibraryStore((s) => s.isLiked)

  // deterministic aurora palette derived from the track id
  const hues = useMemo(() => {
    if (!track) return [350, 20, 45]
    const h = hashString(`${track.source}:${track.id}`)
    const base = h % 360
    return [base, (base + 40) % 360, (base + 320) % 360]
  }, [track])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open || !track) return null

  const liked = isLiked(track)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] overflow-hidden bg-black transition-opacity duration-300",
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen player"
    >
      {/* animated aurora background */}
      <div className="absolute inset-0" aria-hidden>
        <div
          className="lyra-blob"
          style={{
            background: `hsl(${hues[0]} 85% 45%)`,
            width: "55vmax",
            height: "55vmax",
            left: "-10vmax",
            top: "-12vmax",
          }}
        />
        <div
          className="lyra-blob"
          style={{
            background: `hsl(${hues[1]} 80% 40%)`,
            width: "48vmax",
            height: "48vmax",
            right: "-8vmax",
            top: "10vmax",
            animationDelay: "-8s",
          }}
        />
        <div
          className="lyra-blob"
          style={{
            background: `hsl(${hues[2]} 75% 38%)`,
            width: "42vmax",
            height: "42vmax",
            left: "25vmax",
            bottom: "-16vmax",
            animationDelay: "-16s",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />
      </div>

      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2 text-white/70">
          <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            Now playing
          </span>
          {track.isPreview && (
            <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-bold">PREVIEW</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setQueueOpen(!queueOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors",
              queueOpen && "text-white bg-white/10"
            )}
            aria-label="Toggle queue"
          >
            <ListMusic size={17} />
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close fullscreen player"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* main content */}
      <div className="relative z-10 mx-auto flex h-[calc(100%-64px)] max-w-5xl flex-col items-center justify-center gap-8 px-6 pb-10 md:flex-row md:gap-14">
        {/* artwork */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "absolute -inset-6 rounded-[36px] blur-2xl transition-opacity duration-700",
              isPlaying ? "opacity-60" : "opacity-30"
            )}
            style={{
              background: `linear-gradient(135deg, hsl(${hues[0]} 80% 45%), hsl(${hues[1]} 75% 40%))`,
            }}
            aria-hidden
          />
          <div
            className={cn(
              "relative transition-transform duration-700",
              isPlaying ? "scale-100" : "scale-[0.97]"
            )}
          >
            <Artwork
              src={track.artwork}
              alt={`${track.title} cover art`}
              className="h-56 w-56 shadow-2xl shadow-black/60 md:h-80 md:w-80"
              rounded="rounded-3xl"
              iconSize={44}
            />
          </div>
        </div>

        {/* info + controls */}
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-bold leading-tight text-white [text-wrap:balance]">
              {track.title}
            </h1>
            <p className="mt-2 text-sm md:text-base text-white/60">
              {track.artist}
              {track.genre ? ` · ${track.genre}` : ""}
            </p>
          </div>

          {/* progress */}
          <div className="flex flex-col gap-1.5">
            <Slider
              value={[Math.min(currentTime, duration || 1)]}
              max={Math.max(duration || 1, 1)}
              step={0.5}
              onValueChange={(v) => seek(v[0])}
              className="cursor-pointer [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-track]]:bg-white/20"
              aria-label="Seek"
            />
            <div className="flex justify-between text-[11px] tabular-nums text-white/55">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* transport */}
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <button
              onClick={toggleShuffle}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white/65 hover:text-white hover:bg-white/10 transition-colors",
                shuffle && "text-[var(--lyra)] bg-white/10"
              )}
              aria-label={`Shuffle ${shuffle ? "on" : "off"}`}
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={previous}
              className="flex h-12 w-12 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button
              onClick={toggle}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 size={26} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={26} fill="currentColor" />
              ) : (
                <Play size={26} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={() => next(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button
              onClick={cycleRepeat}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white/65 hover:text-white hover:bg-white/10 transition-colors",
                repeat !== "off" && "text-[var(--lyra)] bg-white/10"
              )}
              aria-label={`Repeat mode: ${repeat}`}
            >
              {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* like + volume */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => void toggleLike(track)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={liked ? "Unlike" : "Like"}
            >
              {liked ? <Heart size={19} className="text-[var(--lyra)]" fill="currentColor" /> : <Heart size={19} />}
            </button>
            <div className="flex flex-1 items-center justify-end gap-2 pl-6">
              <button
                onClick={toggleMute}
                className="text-white/65 hover:text-white transition-colors"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="lyra-range w-24 md:w-32"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.9) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.22) ${(muted ? 0 : volume) * 100}%)`,
                }}
                aria-label="Volume"
              />
            </div>
          </div>

          {/* upcoming */}
          <div className="hidden md:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Up next
            </p>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] p-2 backdrop-blur-sm">
              <span className="text-[11px] tabular-nums text-white/45">
                {currentIndex + 1 < queue.length ? String(currentIndex + 2).padStart(2, "0") : "--"}
              </span>
              {queue[currentIndex + 1] ? (
                <>
                  <Artwork
                    src={queue[currentIndex + 1].artwork}
                    alt=""
                    className="h-8 w-8"
                    iconSize={12}
                    rounded="rounded-md"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-white/85">{queue[currentIndex + 1].title}</div>
                    <div className="truncate text-[11px] text-white/50">{queue[currentIndex + 1].artist}</div>
                  </div>
                </>
              ) : (
                <span className="text-xs text-white/45">End of queue</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
