import { NextRequest, NextResponse } from "next/server"
import { fetchTrendingPlaylists } from "@/lib/audius"

export async function GET() {
  const collections = await fetchTrendingPlaylists(12)
  return NextResponse.json({ collections })
}
