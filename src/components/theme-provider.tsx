"use client"

import { createContext, useCallback, useContext, useSyncExternalStore } from "react"

type Theme = "dark" | "light"

/* External theme store — avoids setState-in-effect and hydration mismatches.
   Server snapshot is always "dark" (the default), the client snapshot reads
   localStorage, and DOM updates happen inside the store setter. */

let currentTheme: Theme = "dark"
const listeners = new Set<() => void>()

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("lyra-theme") as Theme | null
    if (saved === "light" || saved === "dark") {
      currentTheme = saved
      document.documentElement.classList.toggle("dark", currentTheme === "dark")
    }
  } catch {
    /* ignore */
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Theme {
  return currentTheme
}

function getServerSnapshot(): Theme {
  return "dark"
}

function setTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.classList.toggle("dark", theme === "dark")
  try {
    localStorage.setItem("lyra-theme", theme)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark")
  }, [])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
