import { NextResponse } from "next/server";
import { findLiveAnnouncement } from "@/lib/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/announcements/current — public endpoint every website visitor's
 * client polls (~every 5s). Returns the announcement that is still inside
 * its 60-second live window, or null when there is nothing to show.
 */
export async function GET() {
  const announcement = await findLiveAnnouncement();
  return NextResponse.json(
    { announcement },
    { headers: { "cache-control": "no-store" } },
  );
}
