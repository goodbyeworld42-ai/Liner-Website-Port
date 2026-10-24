import { NextRequest, NextResponse } from "next/server"
import { fetchArtist, fetchArtistTracks } from "@/lib/audius"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const [artist, tracks] = await Promise.all([fetchArtist(id), fetchArtistTracks(id, 30)])
  if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 })
  return NextResponse.json({ artist, tracks })
}
