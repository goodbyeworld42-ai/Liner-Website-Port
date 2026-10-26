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
}

type AnnouncementRow = {
  id: string;
  message: string;
  senderUsername: string;
  senderName: string;
  senderAvatarUrl: string | null;
  createdAt: Date;
};

export function serializeAnnouncement(row: AnnouncementRow): AnnouncementDTO {
  return {
    id: row.id,
    message: row.message,
    senderUsername: row.senderUsername,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Latest announcement that is still inside its 60-second live window,
 * or null when the airwaves are quiet.
 */
export async function findLiveAnnouncement(): Promise<AnnouncementDTO | null> {
  const cutoff = new Date(Date.now() - ANNOUNCEMENT_LIVE_WINDOW_MS);
  const row = await db.announcement.findFirst({
    where: { createdAt: { gt: cutoff } },
    orderBy: { createdAt: "desc" },
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
 * Avatar URLs from the upstream API can be relative — absolute-ize them so
 * every visitor's browser can load them directly.
 */
export function normalizeAvatarUrl(
  avatarUrl: string | null | undefined,
): string | null {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${LINER_PRIMARY_API}${trimmed}`;
  return null;
}
