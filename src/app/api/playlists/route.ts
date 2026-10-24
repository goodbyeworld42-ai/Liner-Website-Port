import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const playlists = await db.playlist.findMany({
    orderBy: { updatedAt: "desc" },
    include: { tracks: { orderBy: { position: "asc" } } },
  })
  return NextResponse.json({ playlists })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  const playlist = await db.playlist.create({
    data: { name: name.slice(0, 80) },
    include: { tracks: true },
  })
  return NextResponse.json({ playlist }, { status: 201 })
}
