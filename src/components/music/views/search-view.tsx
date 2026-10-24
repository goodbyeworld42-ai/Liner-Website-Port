"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Music2 } from "lucide-react"
import type { AppArtist, AppTrack } from "@/lib/types"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"
import { TrackRow } from "../track-row"
import { TrackCard, ArtistCard, ScrollRow } from "../cards"

interface SearchState {
  loading: boolean
  tracks: AppTrack[]
  artists: AppArtist[]
  mainstream: AppTrack[]
}

const EMPTY: SearchState = { loading: false, tracks: [], artists: [], mainstream: [] }

export function SearchView() {
  const query = useUIStore((s) => s.searchQuery)
  const navigate = useUIStore((s) => s.navigate)
  const [state, setState] = useState<SearchState>(EMPTY)
  const [activeTab, setActiveTab] = useState<"all" | "tracks" | "artists">("all")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const playTracks = usePlayerStore((s) => s.playTracks)
  const playNow = usePlayerStore((s) => s.playNow)

  useEffect(() => {
    const q = query.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q && !abortRef.current) return
    debounceRef.current = setTimeout(() => {
      if (!q) {
        abortRef.current?.abort()
        abortRef.current = null
        setState(EMPTY)
        return
      }
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setState((s) => ({ ...s, loading: true }))
      fetch(`/api/music/search?q=${encodeURIComponent(q)}`, { signal: abortRef.current.signal })
        .then((r) => r.json())
        .then((j) => {
          setState({
            loading: false,
            tracks: j?.tracks ?? [],
            artists: j?.artists ?? [],
            mainstream: j?.mainstream ?? [],
          })
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setState({ ...EMPTY })
        })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const q = query.trim()

  if (!q) {
    return (
      <div className="lyra-view-enter flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Search size={26} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Search Lyra</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Find tracks, artists and genres across Audius and the mainstream catalog.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {["Lo-fi beats", "House", "Drake", "Synthwave", "Jazz"].map((term) => (
            <button
              key={term}
              onClick={() => navigate({ name: "search" })}
              className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onMouseDown={() => useUIStore.getState().setSearchQuery(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const hasResults = state.tracks.length > 0 || state.artists.length > 0 || state.mainstream.length > 0

  return (
    <div className="lyra-view-enter flex flex-col gap-7 pb-6">
      {/* tabs */}
      <div className="flex items-center gap-1.5">
        {(["all", "tracks", "artists"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              activeTab === tab
                ? "bg-foreground text-background"
                : "bg-secondary/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
        {state.loading && (
          <span className="ml-2 text-xs text-muted-foreground animate-pulse">Searching…</span>
        )}
      </div>

      {!state.loading && !hasResults && (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <Music2 size={30} className="text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">No results for “{q}”</p>
          <p className="text-xs text-muted-foreground">Try a different spelling or a broader term.</p>
        </div>
      )}

      {/* artists */}
      {(activeTab === "all" || activeTab === "artists") && state.artists.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Artists</h2>
          <ScrollRow ariaLabel="Artist results">
            {state.artists.map((a) => (
              <div key={a.id} className="w-[130px] lg:w-[150px] shrink-0">
                <ArtistCard artist={a} />
              </div>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* tracks */}
      {(activeTab === "all" || activeTab === "tracks") && state.tracks.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Tracks</h2>
            <button
              onClick={() => playTracks(state.tracks, 0)}
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Play all
            </button>
          </div>
          <div className="flex flex-col">
            {state.tracks.map((t, i) => (
              <TrackRow
                key={`${t.source}:${t.id}`}
                track={t}
                index={i}
                onPlay={() => playTracks(state.tracks, i)}
                contextTracks={state.tracks}
              />
            ))}
          </div>
        </section>
      )}

      {/* mainstream previews */}
      {(activeTab === "all" || activeTab === "tracks") && state.mainstream.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Mainstream</h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              30s previews · iTunes
            </span>
          </div>
          <ScrollRow ariaLabel="Mainstream results">
            {state.mainstream.map((t) => (
              <div key={`${t.source}:${t.id}`} className="w-[150px] lg:w-[170px] shrink-0">
                <TrackCard track={t} onPlay={() => playNow(t)} />
              </div>
            ))}
          </ScrollRow>
        </section>
      )}
    </div>
  )
}
