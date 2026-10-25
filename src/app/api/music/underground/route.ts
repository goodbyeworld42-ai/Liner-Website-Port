import { NextResponse } from "next/server"
import { fetchUnderground } from "@/lib/audius"

export async function GET() {
  const tracks = await fetchUnderground(20)
  return NextResponse.json({ tracks })
}
