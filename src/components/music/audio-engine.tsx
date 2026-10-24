"use client"

import { useEffect, useRef } from "react"
import { usePlayerStore } from "@/store/player-store"
import { useLibraryStore } from "@/store/library-store"
import { streamUrlFor } from "@/lib/client-utils"

/**
 * The single <audio> element that backs the whole app.
 * Syncs store state <-> media element and integrates Media Session API.
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    usePlayerStore.getState().setAudioRef(audioRef.current)
    // restore persisted volume
    try {
      const saved = Number(localStorage.getItem("lyra-volume"))
      if (!Number.isNaN(saved) && saved > 0) usePlayerStore.getState().setVolume(saved)
    } catch {
      /* ignore */
    }
  }, [])

  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const repeat = usePlayerStore((s) => s.repeat)
  const track = queue[currentIndex] ?? null

  // load + play on track change
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    const url = streamUrlFor(track)
    if (!audio.src || audio.src !== new URL(url, window.location.href).href) {
      audio.src = url
      audio.load()
      usePlayerStore.getState().setIsLoading(true)
    }
    if (usePlayerStore.getState().isPlaying) {
      audio.play().catch(() => {
        usePlayerStore.setState({ isPlaying: false })
      })
    }
  }, [track])

  // play/pause sync
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    if (isPlaying) {
      audio.play().catch(() => usePlayerStore.setState({ isPlaying: false }))
    } else {
      audio.pause()
    }
  }, [isPlaying, track])

  // record play history once per track start
  const recordedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!track || !isPlaying) return
    const key = `${track.source}:${track.id}`
    if (recordedRef.current === key) return
    recordedRef.current = key
    void useLibraryStore.getState().recordPlay(track)
  }, [track, isPlaying])

  // media session metadata
  useEffect(() => {
    if (!track || typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.isPreview ? "Preview · Lyra" : "Lyra",
      artwork: track.artwork ? [{ src: track.artwork, sizes: "480x480", type: "image/jpeg" }] : [],
    })
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
  }, [track, isPlaying])

  // media session handlers
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    const ms = navigator.mediaSession
    const store = usePlayerStore
    try {
      ms.setActionHandler("play", () => store.getState().play())
      ms.setActionHandler("pause", () => store.getState().pause())
      ms.setActionHandler("nexttrack", () => store.getState().next(true))
      ms.setActionHandler("previoustrack", () => store.getState().previous())
      ms.setActionHandler("seekbackward", () => store.getState().seekBy(-10))
      ms.setActionHandler("seekforward", () => store.getState().seekBy(10))
    } catch {
      /* unsupported */
    }
    return () => {
      try {
        ms.setActionHandler("play", null)
        ms.setActionHandler("pause", null)
        ms.setActionHandler("nexttrack", null)
        ms.setActionHandler("previoustrack", null)
      } catch {
        /* unsupported */
      }
    }
  }, [])

  // Always render exactly one <audio> element so the store's ref stays valid
  // across queue changes (conditional remounts would detach it).
  return (
    <audio
      ref={audioRef}
      hidden
      preload="auto"
      onTimeUpdate={() => {
        const audio = audioRef.current
        if (audio) usePlayerStore.getState().setCurrentTime(audio.currentTime)
      }}
      onDurationChange={() => {
        const audio = audioRef.current
        if (audio && Number.isFinite(audio.duration)) {
          usePlayerStore.getState().setDuration(audio.duration)
        }
      }}
      onLoadedMetadata={() => {
        const audio = audioRef.current
        if (audio && Number.isFinite(audio.duration)) {
          usePlayerStore.getState().setDuration(audio.duration)
        }
      }}
      onPlaying={() => {
        usePlayerStore.getState().setIsLoading(false)
        usePlayerStore.setState({ isPlaying: true })
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing"
        }
      }}
      onWaiting={() => usePlayerStore.getState().setIsLoading(true)}
      onPause={() => {
        // only reflect user/system pause; keep store in sync
        if (!audioRef.current?.ended) {
          usePlayerStore.setState({ isPlaying: false })
          if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "paused"
          }
        }
      }}
      onEnded={() => {
        const store = usePlayerStore.getState()
        if (store.repeat === "one") {
          const audio = audioRef.current
          if (audio) {
            audio.currentTime = 0
            audio.play().catch(() => {})
          }
        } else {
          store.next(false)
        }
      }}
      onError={() => {
        const store = usePlayerStore.getState()
        store.setIsLoading(false)
        store.setError("This track failed to load. Skipping…")
        // auto-skip after a beat
        window.setTimeout(() => {
          const s = usePlayerStore.getState()
          if (s.queue.length > 1) s.next(true)
          else s.pause()
        }, 1200)
      }}
    />
  )
}
