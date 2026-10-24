import { NextRequest, NextResponse } from "next/server"
import { searchTracks, searchArtists } from "@/lib/audius"
import { searchItunesTracks } from "@/lib/itunes"

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (!q) {
    return NextResponse.json({ tracks: [], artists: [], mainstream: [] })
  }
  const [tracks, artists, mainstream] = await Promise.all([
    searchTracks(q, 24),
    searchArtists(q, 10),
    searchItunesTracks(q, 10),
  ])
  return NextResponse.json({ tracks, artists, mainstream })
}
