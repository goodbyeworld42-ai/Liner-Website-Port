import { MusicApp } from "@/components/music/music-app"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider>
      <MusicApp />
    </ThemeProvider>
  )
}
