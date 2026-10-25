"use client"

import { Home, Search, Library, Heart, Plus, ListMusic, Disc3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore, type View } from "@/store/ui-store"
import { useLibraryStore } from "@/store/library-store"
import { usePlayerStore } from "@/store/player-store"
import { ScrollRow } from "./cards"

function Logo() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
        <Disc3 size={18} className="text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight">Lyra</span>
    </div>
  )
}

function sameView(a: View, b: View): boolean {
  if (a.name !== b.name) return false
  if ("id" in a && "id" in b) return a.id === b.id
  return true
}

export function Sidebar() {
  const view = useUIStore((s) => s.view)
  const navigate = useUIStore((s) => s.navigate)
  const playlists = useLibraryStore((s) => s.playlists)
  const likes = useLibraryStore((s) => s.likes)
  const queueOpen = usePlayerStore((s) => s.queueOpen)

  const navItems = [
    { key: "home", label: "Home", Icon: Home, target: { name: "home" } as View },
    { key: "search", label: "Search", Icon: Search, target: { name: "search" } as View },
    { key: "library", label: "Library", Icon: Library, target: { name: "library" } as View },
  ]

  return (
    <aside
      className={cn(
        "hidden md:flex h-full w-60 shrink-0 flex-col gap-3 p-2 transition-[margin] duration-300",
        queueOpen && "lg:mr-[340px]"
      )}
      aria-label="Main navigation"
    >
      <div className="rounded-2xl bg-background border border-border/60 p-3">
        <Logo />
        <nav className="mt-3 flex flex-col gap-0.5">
          {navItems.map(({ key, label, Icon, target }) => {
            const active = sameView(view, target)
            return (
              <button
                key={key}
                onClick={() => navigate(target)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/[0.07] not-dark:bg-black/[0.05] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] not-dark:hover:bg-black/[0.03]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} className={active ? "text-primary" : ""} />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Library block */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-background border border-border/60 p-3">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your playlists
          </span>
          <button
            onClick={() => navigate({ name: "library" })}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go to library to create a playlist"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto lyra-scroll pr-0.5">
          {/* Liked songs pinned on top */}
          <button
            onClick={() => navigate({ name: "liked" })}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors",
              view.name === "liked"
                ? "bg-white/[0.07] not-dark:bg-black/[0.05]"
                : "hover:bg-white/[0.04] not-dark:hover:bg-black/[0.03]"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-orange-400">
              <Heart size={16} className="text-white" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Liked Songs</div>
              <div className="text-xs text-muted-foreground">{likes.length} tracks</div>
            </div>
          </button>

          {playlists.map((p) => {
            const active = view.name === "playlist" && view.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => navigate({ name: "playlist", id: p.id })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors",
                  active
                    ? "bg-white/[0.07] not-dark:bg-black/[0.05]"
                    : "hover:bg-white/[0.04] not-dark:hover:bg-black/[0.03]"
                )}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-panel">
                  {p.cover ? (
                    <img src={p.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ListMusic size={15} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.trackCount} tracks</div>
                </div>
              </button>
            )
          })}
          {playlists.length === 0 && (
            <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground">
              No playlists yet. Create your first one from the Library tab.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

export function SidebarFooter() {
  return null
}

/* ------------------------------ mobile bottom nav ------------------------- */

export function MobileNav() {
  const view = useUIStore((s) => s.view)
  const navigate = useUIStore((s) => s.navigate)
  const items = [
    { key: "home", label: "Home", Icon: Home, target: { name: "home" } as View },
    { key: "search", label: "Search", Icon: Search, target: { name: "search" } as View },
    { key: "library", label: "Library", Icon: Library, target: { name: "library" } as View },
    { key: "liked", label: "Liked", Icon: Heart, target: { name: "liked" } as View },
  ]
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4">
        {items.map(({ key, label, Icon, target }) => {
          const active = sameView(view, target)
          return (
            <button
              key={key}
              onClick={() => navigate(target)}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} className={active ? "text-primary" : ""} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
