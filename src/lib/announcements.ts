import { db } from "@/lib/db";

/**
 * Website-port global announcement system.
 *
 * The site owner (Liner username jayzeyluna / "JayJoice") can broadcast a
 * short-lived announcement to everyone currently on the website. This lives
 * entirely on the website port — the original desktop app knows nothing
 * about it.
 */

/** The only Liner account allowed to broadcast announcements. */
export const ANNOUNCEMENT_ADMIN_USERNAME = "jayzeyluna";

/** Fallback display name if the upstream profile has none. */
export const ANNOUNCEMENT_DEFAULT_SENDER_NAME = "JayJoice";

/** Upstream Liner API used to verify the poster's access token. */
export const LINER_PRIMARY_API = "https://api.tryliner.fun";

/** Announcement text cap. */
export const ANNOUNCEMENT_MESSAGE_MAX = 500;

/** How long an announcement stays live (the "gone within 1 minute" window). */
export const ANNOUNCEMENT_LIVE_WINDOW_MS = 60_000;

/** Minimum gap between two broadcasts (accidental double-send guard). */
export const ANNOUNCEMENT_SEND_COOLDOWN_MS = 5_000;

/**
 * The "the message will send globally within 10 seconds" delay. A broadcast
 * becomes visible to every client only once its showAt moment has passed.
 * Enforced server-side so the timing is identical for every visitor.
 */
export const ANNOUNCEMENT_BROADCAST_DELAY_MS = 10_000;

/** Housekeeping: drop rows older than one hour on each new broadcast. */
const ANNOUNCEMENT_RETENTION_MS = 60 * 60 * 1000;

export interface AnnouncementDTO {
  id: string;
  message: string;
  senderUsername: string;
  senderName: string;
  senderAvatarUrl: string | null;
  /** ISO timestamp of when the announcement was broadcast. */
  createdAt: string;
  /** ISO timestamp of when the announcement goes live (createdAt + 10s). */
  showAt: string;
}

type AnnouncementRow = {
  id: string;
  message: string;
  senderUsername: string;
  senderName: string;
  senderAvatarUrl: string | null;
  createdAt: Date;
  showAt: Date;
};

export function serializeAnnouncement(row: AnnouncementRow): AnnouncementDTO {
  return {
    id: row.id,
    message: row.message,
    senderUsername: row.senderUsername,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    createdAt: row.createdAt.toISOString(),
    showAt: row.showAt.toISOString(),
  };
}

/**
 * Latest announcement that has passed its 10-second broadcast delay and is
 * still inside its 60-second live window, or null when the airwaves are
 * quiet. The live window starts at showAt (the moment clients first see it)
 * so "gone within 1 minute" counts from when the popup actually appears.
 */
export async function findLiveAnnouncement(): Promise<AnnouncementDTO | null> {
  const now = Date.now();
  const showCutoff = new Date(now - ANNOUNCEMENT_LIVE_WINDOW_MS);
  const row = await db.announcement.findFirst({
    where: {
      showAt: { lte: new Date(now), gt: showCutoff },
    },
    orderBy: { showAt: "desc" },
  });
  return row ? serializeAnnouncement(row) : null;
}

/** Delete announcements older than the retention window (best effort). */
export async function pruneOldAnnouncements(): Promise<void> {
  try {
    await db.announcement.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - ANNOUNCEMENT_RETENTION_MS) } },
    });
  } catch {
    // housekeeping must never break a broadcast
  }
}

interface LinerMe {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export type AdminVerification =
  | { ok: true; me: LinerMe & { username: string } }
  | { ok: false; reason: "invalid_token" | "not_admin" };

/**
 * Verify a Liner access token against the upstream API and make sure the
 * authenticated account is the site owner. Runs server-side so the admin
 * gate cannot be bypassed from the browser.
 */
export async function verifyAnnouncementAdmin(
  accessToken: string,
): Promise<AdminVerification> {
  let me: LinerMe | null = null;
  try {
    const res = await fetch(`${LINER_PRIMARY_API}/v1/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { ok: false, reason: "invalid_token" };
    }
    me = (await res.json()) as LinerMe;
  } catch {
    // upstream unreachable — fail closed
    return { ok: false, reason: "invalid_token" };
  }

  const username = typeof me?.username === "string" ? me.username.trim().toLowerCase() : "";
  if (!username) {
    return { ok: false, reason: "invalid_token" };
  }
  if (username !== ANNOUNCEMENT_ADMIN_USERNAME) {
    return { ok: false, reason: "not_admin" };
  }
  return { ok: true, me: { ...me, username } };
}

/**
 * Longest avatar value we will persist. Liner avatars set through the app are
 * inline data: URLs (PATCH /v1/users/me accepts them), capped around 400KB
 * by the app's own resizer — anything larger is treated as absent.
 */
const AVATAR_MAX_STORED_LENGTH = 450_000;

/**
 * Avatar URLs from the upstream API can be relative — absolute-ize them so
 * every visitor's browser can load them directly. Inline data: URLs (how the
 * app stores custom profile pictures) are passed through untouched so the
 * announcement popup can render the sender's real profile pic.
 */
export function normalizeAvatarUrl(
  avatarUrl: string | null | undefined,
): string | null {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) return null;
  if (trimmed.length > AVATAR_MAX_STORED_LENGTH) return null;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(trimmed)) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${LINER_PRIMARY_API}${trimmed}`;
  // relative path without a leading slash — prefix the upstream origin
  if (/^(media\/|uploads\/|avatars\/|assets\/)/i.test(trimmed)) {
    return `${LINER_PRIMARY_API}/${trimmed}`;
  }
  return null;
}
