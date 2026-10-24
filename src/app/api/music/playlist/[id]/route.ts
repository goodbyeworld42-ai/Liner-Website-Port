import { NextRequest, NextResponse } from "next/server"
import { fetchPlaylist } from "@/lib/audius"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const result = await fetchPlaylist(id)
  if (!result) return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
  return NextResponse.json(result)
}
