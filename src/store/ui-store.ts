"use client"

import { create } from "zustand"
import type { AppPlaylistCollection } from "@/lib/types"

export type View =
  | { name: "home" }
  | { name: "search" }
  | { name: "library" }
  | { name: "liked" }
  | { name: "playlist"; id: string }
  | { name: "artist"; id: string }
  | { name: "collection"; collection: AppPlaylistCollection }

interface UIState {
  view: View
  viewHistory: View[]
  searchQuery: string
  shortcutsOpen: boolean
  settingsOpen: boolean
  mobileSearchOpen: boolean

  navigate: (view: View) => void
  goBack: () => void
  setSearchQuery: (q: string) => void
  setShortcutsOpen: (v: boolean) => void
  setSettingsOpen: (v: boolean) => void
  setMobileSearchOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  view: { name: "home" },
  viewHistory: [],
  searchQuery: "",
  shortcutsOpen: false,
  settingsOpen: false,
  mobileSearchOpen: false,

  navigate: (next) => {
    const { view } = get()
    set({ viewHistory: [...get().viewHistory.slice(-20), view], view: next })
  },

  goBack: () => {
    const { viewHistory } = get()
    if (viewHistory.length === 0) {
      set({ view: { name: "home" } })
      return
    }
    const prev = [...viewHistory]
    const last = prev.pop() as View
    set({ view: last, viewHistory: prev })
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setMobileSearchOpen: (v) => set({ mobileSearchOpen: v }),
}))
