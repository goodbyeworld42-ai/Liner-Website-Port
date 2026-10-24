"use client"

import { Play, Pause, Heart, MoreHorizontal, ListPlus, Trash2, UserRound, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration, trackKey } from "@/lib/client-utils"
import type { AppTrack } from "@/lib/types"
import { Artwork } from "./artwork"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { useUIStore } from "@/store/ui-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface TrackRowProps {
  track: AppTrack
  index?: number
  onPlay: () => void
  contextTracks?: AppTrack[]
  onRemove?: () => void
  showArtwork?: boolean
  playingGlow?: boolean
}

/** A single track row used across playlist, liked songs, artist and search views. */
export function TrackRow({
  track,
  index,
  onPlay,
  contextTracks,
  onRemove,
  showArtwork = true,
  playingGlow = false,
}: TrackRowProps) {
  const current = usePlayerStore((s) => s.queue[s.currentIndex])
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isLoading = usePlayerStore((s) => s.isLoading)
  const playNow = usePlayerStore((s) => s.playNow)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const playNextInQueue = usePlayerStore((s) => s.playNextInQueue)
  const toggleLike = useLibraryStore((s) => s.toggleLike)
  const isLiked = useLibraryStore((s) => s.isLiked)
  const playlists = useLibraryStore((s) => s.playlists)
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist)
  const navigate = useUIStore((s) => s.navigate)
  const { toast } = useToast()

  const isCurrent = current && trackKey(current) === trackKey(track)
  const active = isCurrent && isPlaying
  const liked = isLiked(track)

  const handleAddToPlaylist = async (playlistId: string) => {
    const ok = await addTracksToPlaylist(playlistId, [track])
    const name = playlists.find((p) => p.id === playlistId)?.name ?? "playlist"
    toast({
      title: ok ? `Added to ${name}` : "Already in playlist",
      description: ok ? track.title : `${track.title} is already in ${name}.`,
    })
  }

  return (
    <div
      className={cn(
        "group grid grid-cols-[28px_1fr_auto] sm:grid-cols-[28px_1fr_120px_auto] items-center gap-3 rounded-lg px-2 py-1.5",
        "hover:bg-white/[0.05] not-dark:hover:bg-black/[0.04] transition-colors cursor-pointer select-none",
        isCurrent && "bg-white/[0.06] not-dark:bg-black/[0.05]"
      )}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onPlay()
        }
      }}
      aria-label={`Play ${track.title} by ${track.artist}`}
    >
      {/* index / play indicator */}
      <div className="flex h-7 w-7 items-center justify-center text-xs tabular-nums text-muted-foreground">
        {isCurrent && isPlaying ? (
          <>
            <span className="hidden group-hover:inline-flex">
              <Pause size={14} className="text-foreground" fill="currentColor" />
            </span>
            <span className="flex items-end gap-[2px] h-3.5 group-hover:hidden" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-sm bg-primary lyra-eq-bar"
                  style={{ height: "100%", animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          </>
        ) : isCurrent && isLoading ? (
          <span className="text-primary text-[10px] font-semibold animate-pulse">···</span>
        ) : (
          <>
            <span className="group-hover:hidden">
              {index !== undefined ? String(index + 1).padStart(2, "0") : <Volume2 size={12} className="opacity-0" />}
            </span>
            <Play size={14} className="hidden group-hover:inline text-foreground" fill="currentColor" />
          </>
        )}
      </div>

      {/* artwork + title */}
      <div className="flex items-center gap-3 min-w-0">
        {showArtwork && (
          <Artwork src={track.artwork} alt="" className="h-10 w-10 shrink-0" iconSize={14} rounded="rounded-md" />
        )}
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-sm font-medium",
              isCurrent ? "text-primary" : "text-foreground",
              playingGlow && isCurrent && "drop-shadow-[0_0_6px_rgba(255,77,77,0.45)]"
            )}
          >
            {track.title}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {track.isPreview && (
              <span className="shrink-0 rounded-[4px] border border-border px-1 text-[9px] font-semibold tracking-wide text-muted-foreground">
                PREVIEW
              </span>
            )}
            {track.artistId ? (
              <button
                className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ name: "artist", id: track.artistId as string })
                }}
              >
                {track.artist}
              </button>
            ) : (
              <span className="truncate text-xs text-muted-foreground">{track.artist}</span>
            )}
          </div>
        </div>
      </div>

      {/* plays (desktop) */}
      <div className="hidden sm:block text-right text-xs tabular-nums text-muted-foreground">
        {formatDuration(track.duration)}
      </div>

      {/* actions */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 data-[open=true]:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => void toggleLike(track)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] not-dark:hover:bg-black/[0.05]"
          aria-label={liked ? "Unlike" : "Like"}
        >
          {liked ? (
            <Heart size={16} className="text-primary" fill="currentColor" />
          ) : (
            <Heart size={16} />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] not-dark:hover:bg-black/[0.05]"
              aria-label="More options"
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => playNow(track)}>
              <Play size={14} /> Play now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => playNextInQueue(track)}>
              <ListPlus size={14} /> Play next
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { addToQueue(track); toast({ title: "Added to queue", description: track.title }) }}>
              <ListPlus size={14} /> Add to queue
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Heart size={14} className="mr-2" /> Add to playlist
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto lyra-scroll">
                {playlists.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    No playlists yet — create one in your Library.
                  </div>
                )}
                {playlists.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => void handleAddToPlaylist(p.id)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {track.artistId && (
              <DropdownMenuItem onClick={() => navigate({ name: "artist", id: track.artistId as string })}>
                <UserRound size={14} /> Go to artist
              </DropdownMenuItem>
            )}
            {onRemove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                  <Trash2 size={14} /> Remove
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
