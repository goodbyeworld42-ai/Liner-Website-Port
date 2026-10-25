"use client"

import { useState } from "react"
import { Heart, Plus, ListMusic, Trash2, Pencil, Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLibraryStore } from "@/store/library-store"
import { useUIStore } from "@/store/ui-store"
import { usePlayerStore } from "@/store/player-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Artwork } from "../artwork"
import { useToast } from "@/hooks/use-toast"

export function LibraryView() {
  const playlists = useLibraryStore((s) => s.playlists)
  const likes = useLibraryStore((s) => s.likes)
  const history = useLibraryStore((s) => s.history)
  const createPlaylist = useLibraryStore((s) => s.createPlaylist)
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist)
  const renamePlaylist = useLibraryStore((s) => s.renamePlaylist)
  const clearHistory = useLibraryStore((s) => s.clearHistory)
  const navigate = useUIStore((s) => s.navigate)
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const created = await createPlaylist(name)
    if (created) {
      setCreateOpen(false)
      setNewName("")
      toast({ title: "Playlist created", description: name })
      navigate({ name: "playlist", id: created.id })
    }
  }

  return (
    <div className="lyra-view-enter flex flex-col gap-8 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {likes.length} liked {likes.length === 1 ? "track" : "tracks"} · {playlists.length}{" "}
            {playlists.length === 1 ? "playlist" : "playlists"}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-primary text-white hover:bg-primary/90"
        >
          <Plus size={16} className="mr-1.5" /> New playlist
        </Button>
      </div>

      {/* quick tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate({ name: "liked" })}
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 to-orange-400/10 p-4 text-left transition-colors hover:border-primary/40"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 shadow-lg shadow-primary/25">
            <Heart size={22} className="text-white" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">Liked Songs</div>
            <div className="text-xs text-muted-foreground">{likes.length} tracks you loved</div>
          </div>
        </button>
        <button
          onClick={() => navigate({ name: "home" })}
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-secondary/40 p-4 text-left transition-colors hover:border-border"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-panel">
            <Clock3 size={22} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">Recently played</div>
            <div className="text-xs text-muted-foreground">{history.length} in your history</div>
          </div>
        </button>
      </div>

      {/* playlists grid */}
      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight">Playlists</h2>
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
            <ListMusic size={30} className="text-muted-foreground opacity-40" />
            <div>
              <p className="text-sm font-medium">No playlists yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Create one and start collecting tracks.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="rounded-full bg-primary text-white">
              <Plus size={14} className="mr-1" /> Create playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {playlists.map((p) => (
              <div
                key={p.id}
                className="group relative cursor-pointer rounded-xl border border-border/50 bg-background p-3 transition-colors hover:bg-white/[0.04] not-dark:hover:bg-black/[0.03]"
                onClick={() => navigate({ name: "playlist", id: p.id })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate({ name: "playlist", id: p.id })
                }}
              >
                <div className="mb-2.5 aspect-square w-full overflow-hidden rounded-lg bg-panel">
                  {p.cover ? (
                    <img src={p.cover} alt={`${p.name} cover`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ListMusic size={26} className="text-muted-foreground opacity-50" />
                    </div>
                  )}
                </div>
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.trackCount} tracks</div>

                {/* hover actions */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setRenaming(p.id)
                      setRenameValue(p.name)
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white"
                    aria-label={`Rename ${p.name}`}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={async () => {
                      await deletePlaylist(p.id)
                      toast({ title: "Playlist deleted", description: p.name })
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-destructive"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create a playlist</DialogTitle>
            <DialogDescription>Give it a name you will recognize later.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
            placeholder="e.g. Late night drive"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={!newName.trim()} className="bg-primary text-white hover:bg-primary/90">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* rename dialog */}
      <Dialog open={renaming !== null} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename playlist</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && renaming && renameValue.trim()) {
                await renamePlaylist(renaming, renameValue.trim())
                setRenaming(null)
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (renaming && renameValue.trim()) {
                  await renamePlaylist(renaming, renameValue.trim())
                  setRenaming(null)
                }
              }}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* history summary */}
      {history.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Recently played</h2>
            <button
              onClick={async () => {
                await clearHistory()
                toast({ title: "History cleared" })
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear history
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {history.slice(0, 10).map((t) => (
              <button
                key={`${t.source}:${t.id}`}
                onClick={() => usePlayerStore.getState().playNow(t)}
                className="group flex flex-col gap-2 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05] not-dark:hover:bg-black/[0.04]"
              >
                <Artwork src={t.artwork} alt="" className="aspect-square w-full" iconSize={22} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{t.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{t.artist}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
