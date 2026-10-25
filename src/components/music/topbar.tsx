"use client"

import { useEffect, useRef } from "react"
import { ArrowLeft, Search, Keyboard, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function Topbar() {
  const view = useUIStore((s) => s.view)
  const navigate = useUIStore((s) => s.navigate)
  const goBack = useUIStore((s) => s.goBack)
  const viewHistory = useUIStore((s) => s.viewHistory)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen)
  const { theme, toggleTheme } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = /input|textarea/i.test(target?.tagName ?? "") || target?.isContentEditable
      if (e.key === "/" && !typing) {
        e.preventDefault()
        navigate({ name: "search" })
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [navigate])

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2.5 md:px-5 md:py-3 bg-canvas/80 backdrop-blur-xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        disabled={viewHistory.length === 0}
        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </Button>

      {view.name === "search" ? (
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Songs, artists, genres…"
            className={cn(
              "h-9 w-full rounded-full border border-input bg-secondary/60 pl-9 pr-4 text-sm outline-none",
              "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            )}
            aria-label="Search music"
          />
        </div>
      ) : (
        <button
          onClick={() => {
            navigate({ name: "search" })
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className="flex h-9 items-center gap-2 rounded-full border border-input bg-secondary/60 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors md:hidden"
          aria-label="Search"
        >
          <Search size={15} />
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutsOpen(true)}
          className="hidden md:inline-flex h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={17} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
      </div>
    </header>
  )
}
