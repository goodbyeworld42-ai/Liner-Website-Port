"use client"

import { useEffect } from "react"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { useUIStore } from "@/store/ui-store"
import { AudioEngine } from "./audio-engine"
import { Sidebar, MobileNav } from "./sidebar"
import { Topbar } from "./topbar"
import { PlayerBar } from "./player-bar"
import { QueueDrawer } from "./queue-drawer"
import { FullscreenPlayer } from "./fullscreen-player"
import { ShortcutsDialog } from "./shortcuts-dialog"
import { HomeView } from "./views/home-view"
import { SearchView } from "./views/search-view"
import { LibraryView } from "./views/library-view"
import { LikedView } from "./views/liked-view"
import { PlaylistView } from "./views/playlist-view"
import { ArtistView } from "./views/artist-view"
import { CollectionView } from "./views/collection-view"
import { cn } from "@/lib/utils"

function CurrentView() {
  const view = useUIStore((s) => s.view)
  switch (view.name) {
    case "home":
      return <HomeView />
    case "search":
      return <SearchView />
    case "library":
      return <LibraryView />
    case "liked":
      return <LikedView />
    case "playlist":
      return <PlaylistView key={view.id} id={view.id} />
    case "artist":
      return <ArtistView key={view.id} id={view.id} />
    case "collection":
      return <CollectionView collection={view.collection} />
    default:
      return <HomeView />
  }
}

/** Global keyboard transport shortcuts. */
function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = /input|textarea/i.test(target?.tagName ?? "") || target?.isContentEditable
      if (typing) return

      const store = usePlayerStore.getState()
      const ui = useUIStore.getState()
      const lib = useLibraryStore.getState()

      switch (e.key) {
        case " ":
          e.preventDefault()
          store.toggle()
          break
        case "ArrowRight":
          if (e.shiftKey) store.next(true)
          else store.seekBy(10)
          break
        case "ArrowLeft":
          if (e.shiftKey) store.previous()
          else store.seekBy(-10)
          break
        case "n":
        case "N":
          store.next(true)
          break
        case "p":
        case "P":
          store.previous()
          break
        case "f":
        case "F":
          store.setExpanded(!store.expanded)
          break
        case "q":
        case "Q":
          store.setQueueOpen(!store.queueOpen)
          break
        case "l":
        case "L": {
          const track = store.queue[store.currentIndex]
          if (track) void lib.toggleLike(track)
          break
        }
        case "m":
        case "M":
          store.toggleMute()
          break
        case "s":
        case "S":
          store.toggleShuffle()
          break
        case "r":
        case "R":
          store.cycleRepeat()
          break
        case "?":
          ui.setShortcutsOpen(true)
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}

export function MusicApp() {
  useKeyboardShortcuts()

  const expanded = usePlayerStore((s) => s.expanded)
  const setExpanded = usePlayerStore((s) => s.setExpanded)

  useEffect(() => {
    void useLibraryStore.getState().loadAll()
  }, [])

  const queueOpen = usePlayerStore((s) => s.queueOpen)

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <AudioEngine />
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          className={cn(
            "min-h-0 flex-1 overflow-y-auto lyra-scroll px-3 pb-44 md:px-5 md:pb-8 transition-[padding] duration-300",
            queueOpen && "lg:mr-[380px]"
          )}
        >
          <div className="mx-auto max-w-6xl">
            <CurrentView />
          </div>
        </main>

        {/* sticky footer player — sits above the mobile bottom nav */}
        <div className="fixed bottom-[calc(52px+env(safe-area-inset-bottom))] left-0 right-0 z-40 md:bottom-0 md:pl-60 lg:pr-0">
          <div
            className={cn(
              "transition-[margin] duration-300",
              queueOpen && "lg:mr-[380px]"
            )}
          >
            <PlayerBar />
          </div>
        </div>
      </div>

      <QueueDrawer />
      <FullscreenPlayer open={expanded} onClose={() => setExpanded(false)} />
      <ShortcutsDialog />
      <MobileNav />
    </div>
  )
}
