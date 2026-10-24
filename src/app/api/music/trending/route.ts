import { NextRequest, NextResponse } from "next/server"
import { fetchTrending } from "@/lib/audius"

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 30) || 30, 100)
  const tracks = await fetchTrending(genre || undefined, limit)
  return NextResponse.json({ tracks })
}
