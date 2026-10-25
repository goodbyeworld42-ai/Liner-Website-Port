import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Lyra — Music for the browser",
  description:
    "A full music streaming experience in your browser: trending tracks, playlists, likes, queue, synced visuals and a beautiful fullscreen player.",
  keywords: ["music", "streaming", "player", "playlists", "Lyra"],
  icons: {
    icon: "/lyra-icon.svg",
  },
  openGraph: {
    title: "Lyra — Music for the browser",
    description: "Stream, collect and feel your music. A complete web music app.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-canvas text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
