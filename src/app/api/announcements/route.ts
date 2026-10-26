import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ANNOUNCEMENT_BROADCAST_DELAY_MS,
  ANNOUNCEMENT_DEFAULT_SENDER_NAME,
  ANNOUNCEMENT_MESSAGE_MAX,
  ANNOUNCEMENT_SEND_COOLDOWN_MS,
  findLiveAnnouncement,
  normalizeAvatarUrl,
  pruneOldAnnouncements,
  serializeAnnouncement,
  verifyAnnouncementAdmin,
} from "@/lib/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/announcements — broadcast a global announcement (admin only).
 *
 * Body: { message: string, accessToken: string }
 * The access token is the poster's Liner token; it is verified against the
 * upstream API server-side and only the site owner's account is accepted.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message =
    typeof body?.message === "string" ? body.message.trim().slice(0, ANNOUNCEMENT_MESSAGE_MAX + 1) : "";
  const accessToken =
    typeof body?.accessToken === "string" ? body.accessToken.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > ANNOUNCEMENT_MESSAGE_MAX) {
    return NextResponse.json(
      { error: `message must be at most ${ANNOUNCEMENT_MESSAGE_MAX} characters` },
      { status: 400 },
    );
  }
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const verification = await verifyAnnouncementAdmin(accessToken);
  if (!verification.ok) {
    const status = verification.reason === "not_admin" ? 403 : 401;
    return NextResponse.json(
      { error: verification.reason },
      { status },
    );
  }

  // accidental double-send guard (the client promise is "sends within 10s")
  const latest = await db.announcement.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < ANNOUNCEMENT_SEND_COOLDOWN_MS
  ) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  await pruneOldAnnouncements();

  const now = Date.now();
  const created = await db.announcement.create({
    data: {
      message,
      senderUsername: verification.me.username,
      senderName:
        (verification.me.displayName?.trim() || ANNOUNCEMENT_DEFAULT_SENDER_NAME).slice(0, 60),
      senderAvatarUrl: normalizeAvatarUrl(verification.me.avatarUrl),
      // "the message will send globally within 10 seconds" — enforced here so
      // the timing is identical for every client, not just the sender's.
      showAt: new Date(now + ANNOUNCEMENT_BROADCAST_DELAY_MS),
    },
  });

  return NextResponse.json(
    { announcement: serializeAnnouncement(created) },
    { status: 201 },
  );
}

/**
 * GET /api/announcements — convenience alias so clients can probe the same
 * path they post to. Returns the current live announcement (or null).
 */
export async function GET() {
  const announcement = await findLiveAnnouncement();
  return NextResponse.json(
    { announcement },
    { headers: { "cache-control": "no-store" } },
  );
}
