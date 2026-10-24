import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

interface IncomingTrack {
  id: string
  source?: string
  title: string
  artist: string
  artistId?: string | null
  artwork?: string | null
  duration?: number
}

export async function GET() {
  const history = await db.playHistory.findMany({
    orderBy: { playedAt: "desc" },
    take: 40,
  })
  // de-duplicate consecutive repeats of the same track
  const seen = new Set<string>()
  const unique = history.filter((h) => {
    const key = `${h.source}:${h.trackId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return NextResponse.json({ history: unique.slice(0, 20) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const t: IncomingTrack | null = body?.track ?? null
  if (!t?.id || !t.title) {
    return NextResponse.json({ error: "track is required" }, { status: 400 })
  }
  await db.playHistory.create({
    data: {
      trackId: String(t.id),
      source: t.source === "itunes" ? "itunes" : "audius",
      title: String(t.title).slice(0, 200),
      artist: String(t.artist ?? "Unknown").slice(0, 200),
      artistId: t.artistId ?? null,
      artwork: t.artwork ?? null,
      duration: Math.max(0, Math.round(Number(t.duration ?? 0))),
    },
  })
  // keep the table small: retain only the newest 200 rows
  const old = await db.playHistory.findMany({ orderBy: { playedAt: "desc" }, skip: 200 })
  if (old.length > 0) {
    await db.playHistory.deleteMany({ where: { id: { in: old.map((o) => o.id) } } })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE() {
  await db.playHistory.deleteMany({})
  return NextResponse.json({ ok: true })
}
