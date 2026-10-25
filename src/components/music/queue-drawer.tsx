"use client"

import { X, Play, Pause, Trash2, ListMusic } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration, trackKey } from "@/lib/client-utils"
import { usePlayerStore } from "@/store/player-store"
import { Artwork } from "./artwork"
import { Button } from "@/components/ui/button"

export function QueueDrawer() {
  const queueOpen = usePlayerStore((s) => s.queueOpen)
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen)
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const jumpTo = usePlayerStore((s) => s.jumpTo)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[380px] flex-col border-l border-border/60 bg-background shadow-2xl",
        "transition-transform duration-300 ease-out",
        queueOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
      aria-label="Playback queue"
      aria-hidden={!queueOpen}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <ListMusic size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">Queue</h2>
          <span className="text-xs text-muted-foreground">{queue.length} tracks</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQueueOpen(false)}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Close queue"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto lyra-scroll px-2 py-2">
        {queue.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ListMusic size={28} className="opacity-40" />
            <p className="text-xs">Queue is empty</p>
          </div>
        )}
        {queue.map((track, i) => {
          const current = i === currentIndex
          return (
            <div
              key={`${track.source}:${track.id}:${i}`}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors cursor-pointer",
                current ? "bg-white/[0.07] not-dark:bg-black/[0.05]" : "hover:bg-white/[0.04] not-dark:hover:bg-black/[0.03]"
              )}
              onClick={() => jumpTo(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") jumpTo(i)
              }}
              aria-label={`${current ? "Now playing" : "Play"} ${track.title}`}
            >
              <div className="relative shrink-0">
                <Artwork src={track.artwork} alt="" className="h-9 w-9" iconSize={13} rounded="rounded-md" />
                {current && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/55">
                    {isPlaying ? (
                      <span className="flex items-end gap-[2px] h-3" aria-hidden>
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            className="w-[3px] rounded-sm bg-primary lyra-eq-bar"
                            style={{ height: "100%", animationDelay: `${j * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <Play size={11} className="text-white" fill="currentColor" />
                    )}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("truncate text-[13px] font-medium", current && "text-primary")}>{track.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {track.isPreview && <span className="mr-1 rounded-[3px] border border-border px-0.5 text-[8px] font-semibold">PREVIEW</span>}
                  {track.artist}
                </div>
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">{formatDuration(track.duration)}</span>
              {!current && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromQueue(i)
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={`Remove ${track.title} from queue`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
