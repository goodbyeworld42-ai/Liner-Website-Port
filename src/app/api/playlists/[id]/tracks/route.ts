import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

type Ctx = { params: Promise<{ id: string }> }

interface IncomingTrack {
  id: string
  source?: string
  title: string
  artist: string
  artistId?: string | null
  artwork?: string | null
  duration?: number
}

/** Add one or more tracks to the end of a playlist. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const incoming: IncomingTrack[] = Array.isArray(body?.tracks) ? body.tracks : []
  if (incoming.length === 0) {
    return NextResponse.json({ error: "tracks[] is required" }, { status: 400 })
  }

  const playlist = await db.playlist.findUnique({ where: { id } })
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = await db.playlistTrack.findMany({
    where: { playlistId: id },
    orderBy: { position: "desc" },
    take: 1,
  })
  let position = (existing[0]?.position ?? -1) + 1

  const seen = new Set(
    (await db.playlistTrack.findMany({ where: { playlistId: id }, select: { trackId: true } })).map(
      (t) => t.trackId
    )
  )

  const created = await db.$transaction(
    incoming
      .filter((t) => t?.id && t.title && !seen.has(t.id))
      .map((t) =>
        db.playlistTrack.create({
          data: {
            playlistId: id,
            trackId: String(t.id),
            source: t.source === "itunes" ? "itunes" : "audius",
            title: String(t.title).slice(0, 200),
            artist: String(t.artist ?? "Unknown").slice(0, 200),
            artistId: t.artistId ?? null,
            artwork: t.artwork ?? null,
            duration: Math.max(0, Math.round(Number(t.duration ?? 0))),
            position: position++,
          },
        })
      )
  )

  await db.playlist.update({ where: { id }, data: { updatedAt: new Date() } })
  return NextResponse.json({ added: created.length }, { status: 201 })
}

/** Remove a single track from a playlist by its row id or trackId. */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const trackId = req.nextUrl.searchParams.get("trackId")
  if (!trackId) return NextResponse.json({ error: "trackId is required" }, { status: 400 })

  await db.playlistTrack.deleteMany({ where: { playlistId: id, trackId } })
  await db.playlist.update({ where: { id }, data: { updatedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
