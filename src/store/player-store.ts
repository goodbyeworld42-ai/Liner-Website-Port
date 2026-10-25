import { create } from "zustand"
import type { AppTrack } from "@/lib/types"

export type RepeatMode = "off" | "all" | "one"

interface PlayerState {
  audioRef: HTMLAudioElement | null
  queue: AppTrack[]
  originalQueue: AppTrack[] // pre-shuffle order
  currentIndex: number
  isPlaying: boolean
  isLoading: boolean
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  currentTime: number
  duration: number
  expanded: boolean
  queueOpen: boolean
  error: string | null

  setAudioRef: (el: HTMLAudioElement | null) => void
  playTracks: (tracks: AppTrack[], startIndex?: number, shuffle?: boolean) => void
  playNow: (track: AppTrack) => void
  playNextInQueue: (track: AppTrack) => void
  addToQueue: (track: AppTrack) => void
  removeFromQueue: (index: number) => void
  jumpTo: (index: number) => void
  toggle: () => void
  play: () => void
  pause: () => void
  next: (userInitiated?: boolean) => void
  previous: () => void
  seek: (time: number) => void
  seekBy: (delta: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setIsLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setExpanded: (v: boolean) => void
  setQueueOpen: (v: boolean) => void
}

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  audioRef: null,
  queue: [],
  originalQueue: [],
  currentIndex: 0,
  isPlaying: false,
  isLoading: false,
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeat: "off",
  currentTime: 0,
  duration: 0,
  expanded: false,
  queueOpen: false,
  error: null,

  setAudioRef: (el) => {
    set({ audioRef: el })
    if (el) el.volume = get().muted ? 0 : get().volume
  },

  playTracks: (tracks, startIndex = 0, shuffle = false) => {
    if (tracks.length === 0) return
    const queue = shuffle ? shuffled(tracks) : [...tracks]
    const index = shuffle ? 0 : Math.max(0, Math.min(startIndex, queue.length - 1))
    set({
      queue,
      originalQueue: [...tracks],
      currentIndex: index,
      shuffle,
      isPlaying: true,
      currentTime: 0,
      error: null,
    })
  },

  playNow: (track) => {
    const { queue, currentIndex } = get()
    const existing = queue.findIndex((t) => t.id === track.id && t.source === track.source)
    if (existing !== -1) {
      set({ currentIndex: existing, isPlaying: true, currentTime: 0 })
    } else {
      const next = [...queue]
      next.splice(currentIndex + 1, 0, track)
      set({
        queue: next,
        originalQueue: next,
        currentIndex: currentIndex + 1,
        isPlaying: true,
        currentTime: 0,
      })
    }
    set({ error: null })
  },

  playNextInQueue: (track) => {
    const { queue, currentIndex } = get()
    const filtered = queue.filter((t) => !(t.id === track.id && t.source === track.source))
    const next = [...filtered]
    next.splice(currentIndex + 1, 0, track)
    set({ queue: next })
  },

  addToQueue: (track) => {
    set((s) => ({ queue: [...s.queue, track] }))
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get()
    if (index === currentIndex) return // don't remove the playing track
    const next = queue.filter((_, i) => i !== index)
    set({
      queue: next,
      currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
    })
  },

  jumpTo: (index) => {
    const { queue } = get()
    if (index < 0 || index >= queue.length) return
    set({ currentIndex: index, isPlaying: true, currentTime: 0, error: null })
  },

  toggle: () => {
    const { isPlaying, audioRef } = get()
    if (!audioRef || !audioRef.src) return
    if (isPlaying) {
      audioRef.pause()
      set({ isPlaying: false })
    } else {
      audioRef.play().catch(() => set({ isPlaying: false }))
    }
  },

  play: () => {
    const { audioRef } = get()
    if (!audioRef || !audioRef.src) return
    audioRef.play().catch(() => {})
    set({ isPlaying: true })
  },

  pause: () => {
    const { audioRef } = get()
    audioRef?.pause()
    set({ isPlaying: false })
  },

  next: (userInitiated = false) => {
    const { queue, currentIndex, repeat, shuffle } = get()
    if (queue.length === 0) return
    if (shuffle) {
      let nextIndex = currentIndex
      if (queue.length > 1) {
        while (nextIndex === currentIndex) nextIndex = Math.floor(Math.random() * queue.length)
      }
      set({ currentIndex: nextIndex, isPlaying: true, currentTime: 0 })
      return
    }
    if (currentIndex + 1 < queue.length) {
      set({ currentIndex: currentIndex + 1, isPlaying: true, currentTime: 0 })
    } else if (repeat === "all" || userInitiated) {
      set({ currentIndex: 0, isPlaying: true, currentTime: 0 })
    } else {
      set({ isPlaying: false, currentTime: 0 })
    }
  },

  previous: () => {
    const { currentTime, audioRef, queue, currentIndex } = get()
    if (currentTime > 3 || queue.length === 0) {
      if (audioRef) audioRef.currentTime = 0
      set({ currentTime: 0 })
      return
    }
    if (currentIndex - 1 >= 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true, currentTime: 0 })
    } else {
      set({ currentTime: 0 })
      if (audioRef) audioRef.currentTime = 0
    }
  },

  seek: (time) => {
    const { audioRef, duration } = get()
    if (!audioRef) return
    const clamped = Math.max(0, Math.min(time, duration || time))
    audioRef.currentTime = clamped
    set({ currentTime: clamped })
  },

  seekBy: (delta) => {
    get().seek(get().currentTime + delta)
  },

  setVolume: (v) => {
    const { audioRef, muted } = get()
    const clamped = Math.max(0, Math.min(1, v))
    if (audioRef) audioRef.volume = muted ? 0 : clamped
    set({
      volume: clamped,
      muted: clamped === 0 ? true : muted && clamped > 0 ? false : muted,
    })
    if (typeof window !== "undefined") localStorage.setItem("lyra-volume", String(clamped))
  },

  toggleMute: () => {
    const { muted, volume, audioRef } = get()
    const nextMuted = !muted
    if (audioRef) audioRef.volume = nextMuted ? 0 : volume
    set({ muted: nextMuted })
  },

  toggleShuffle: () => {
    const { shuffle, queue, currentIndex, originalQueue } = get()
    if (shuffle) {
      const current = queue[currentIndex]
      const restored = [...originalQueue]
      const newIndex = current
        ? Math.max(
            0,
            restored.findIndex((t) => t.id === current.id && t.source === current.source)
          )
        : 0
      set({ shuffle: false, queue: restored, currentIndex: newIndex })
    } else {
      const current = queue[currentIndex]
      const rest = queue.filter((_, i) => i !== currentIndex)
      const mixed = current ? [current, ...shuffled(rest)] : shuffled(rest)
      set({ shuffle: true, queue: mixed, currentIndex: 0 })
    }
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"]
    const { repeat } = get()
    set({ repeat: order[(order.indexOf(repeat) + 1) % order.length] })
  },

  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setExpanded: (v) => set({ expanded: v }),
  setQueueOpen: (v) => set({ queueOpen: v }),
}))

export function currentTrack(s: PlayerState): AppTrack | null {
  return s.queue[s.currentIndex] ?? null
}
