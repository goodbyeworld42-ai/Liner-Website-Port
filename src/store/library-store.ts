"use client"

import { create } from "zustand"
import type { AppTrack } from "@/lib/types"
import { trackKey } from "@/lib/client-utils"

export interface PlaylistSummary {
  id: string
  name: string
  trackCount: number
  updatedAt: string
  cover: string | null
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: AppTrack[]
}

interface LibraryState {
  likes: AppTrack[]
  playlists: PlaylistSummary[]
  history: AppTrack[]
  loaded: boolean

  loadAll: () => Promise<void>
  isLiked: (track: Pick<AppTrack, "id" | "source">) => boolean
  toggleLike: (track: AppTrack) => Promise<void>

  createPlaylist: (name: string) => Promise<PlaylistSummary | null>
  renamePlaylist: (id: string, name: string) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addTracksToPlaylist: (id: string, tracks: AppTrack[]) => Promise<boolean>
  removeTrackFromPlaylist: (id: string, trackId: string) => Promise<void>
  fetchPlaylistDetail: (id: string) => Promise<PlaylistDetail | null>

  recordPlay: (track: AppTrack) => Promise<void>
  clearHistory: () => Promise<void>
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function playlistCoverFromTracks(tracks: { artwork: string | null }[]): string | null {
  return tracks.find((t) => t.artwork)?.artwork ?? null
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likes: [],
  playlists: [],
  history: [],
  loaded: false,

  loadAll: async () => {
    const [likesRes, playlistsRes, historyRes] = await Promise.all([
      jsonFetch<{ likes: AppTrack[] }>("/api/likes"),
      jsonFetch<{ playlists: unknown[] }>("/api/playlists"),
      jsonFetch<{ history: AppTrack[] }>("/api/history"),
    ])
    set({
      likes: likesRes?.likes ?? [],
      playlists: (playlistsRes?.playlists ?? []).map(
        (p: {
          id: string
          name: string
          updatedAt: string
          tracks?: { artwork: string | null }[]
        }) => ({
          id: p.id,
          name: p.name,
          trackCount: p.tracks?.length ?? 0,
          updatedAt: p.updatedAt,
          cover: playlistCoverFromTracks(p.tracks ?? []),
        })
      ),
      history: historyRes?.history ?? [],
      loaded: true,
    })
  },

  isLiked: (track) => {
    const key = trackKey(track)
    return get().likes.some((l) => trackKey(l) === key)
  },

  toggleLike: async (track) => {
    const wasLiked = get().isLiked(track)
    // optimistic update
    set((s) => ({
      likes: wasLiked
        ? s.likes.filter((l) => trackKey(l) !== trackKey(track))
        : [track, ...s.likes],
    }))
    const res = await jsonFetch<{ liked: boolean }>("/api/likes", {
      method: "POST",
      body: JSON.stringify({ track }),
    })
    if (!res) {
      // revert on failure
      set((s) => ({
        likes: wasLiked
          ? [track, ...s.likes]
          : s.likes.filter((l) => trackKey(l) !== trackKey(track)),
      }))
    }
  },

  createPlaylist: async (name) => {
    const res = await jsonFetch<{ playlist: { id: string; name: string; updatedAt: string } }>(
      "/api/playlists",
      { method: "POST", body: JSON.stringify({ name }) }
    )
    if (!res) return null
    const summary: PlaylistSummary = {
      id: res.playlist.id,
      name: res.playlist.name,
      trackCount: 0,
      updatedAt: res.playlist.updatedAt,
      cover: null,
    }
    set((s) => ({ playlists: [summary, ...s.playlists] }))
    return summary
  },

  renamePlaylist: async (id, name) => {
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
    }))
    await jsonFetch(`/api/playlists/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    })
  },

  deletePlaylist: async (id) => {
    const prev = get().playlists
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }))
    const res = await jsonFetch(`/api/playlists/${id}`, { method: "DELETE" })
    if (!res) set({ playlists: prev })
  },

  addTracksToPlaylist: async (id, tracks) => {
    const res = await jsonFetch<{ added: number }>(`/api/playlists/${id}/tracks`, {
      method: "POST",
      body: JSON.stringify({ tracks }),
    })
    if (!res || res.added === 0) return false
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === id ? { ...p, trackCount: p.trackCount + res.added } : p
      ),
    }))
    return true
  },

  removeTrackFromPlaylist: async (id, trackId) => {
    await jsonFetch(`/api/playlists/${id}/tracks?trackId=${encodeURIComponent(trackId)}`, {
      method: "DELETE",
    })
  },

  fetchPlaylistDetail: async (id) => {
    const res = await jsonFetch<{
      playlist: {
        id: string
        name: string
        updatedAt: string
        tracks: { trackId: string; source: string; title: string; artist: string; artistId: string | null; artwork: string | null; duration: number }[]
      }
    }>(`/api/playlists/${id}`)
    if (!res) return null
    const tracks: AppTrack[] = res.playlist.tracks.map((t) => ({
      id: t.trackId,
      source: t.source === "itunes" ? "itunes" : "audius",
      title: t.title,
      artist: t.artist,
      artistId: t.artistId,
      artwork: t.artwork,
      duration: t.duration,
    }))
    return {
      id: res.playlist.id,
      name: res.playlist.name,
      trackCount: tracks.length,
      updatedAt: res.playlist.updatedAt,
      cover: playlistCoverFromTracks(tracks),
      tracks,
    }
  },

  recordPlay: async (track) => {
    set((s) => {
      const filtered = s.history.filter((h) => trackKey(h) !== trackKey(track))
      return { history: [track, ...filtered].slice(0, 20) }
    })
    await jsonFetch("/api/history", { method: "POST", body: JSON.stringify({ track }) })
  },

  clearHistory: async () => {
    set({ history: [] })
    await jsonFetch("/api/history", { method: "DELETE" })
  },
}))
