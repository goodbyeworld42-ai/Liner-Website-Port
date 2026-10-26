/**
 * Website-port global announcement API.
 *
 * This talks to the website port's own backend (same-origin Next.js routes),
 * NOT to api.tryliner.fun. The original desktop app has no such feature —
 * this exists only on the website port.
 */

export interface Announcement {
  id: string;
  message: string;
  senderUsername: string;
  senderName: string;
  senderAvatarUrl: string | null;
  /** ISO timestamp of the broadcast moment. */
  createdAt: string;
}

/** The only Liner account allowed to broadcast website announcements. */
export const WEBSITE_ADMIN_USERNAME = "jayzeyluna";

/** True when the given Liner username is the website owner. */
export function isWebsiteAdmin(username: string | null | undefined): boolean {
  return (
    typeof username === "string" &&
    username.trim().toLowerCase() === WEBSITE_ADMIN_USERNAME
  );
}

export class AnnouncementError extends Error {
  constructor(
    public code: "forbidden" | "unauthorized" | "rate_limited" | "generic",
    public status: number,
  ) {
    super(`announcement error: ${code} (${status})`);
    this.name = "AnnouncementError";
  }
}

/**
 * Poll the public probe endpoint for the announcement that is currently
 * inside its 60-second live window (null when the airwaves are quiet).
 */
export async function fetchCurrentAnnouncement(
  timeoutMs = 8_000,
): Promise<Announcement | null> {
  const res = await fetch("/api/announcements/current", {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new AnnouncementError("generic", res.status);
  }
  const data = (await res.json()) as { announcement?: Announcement | null };
  const announcement = data?.announcement ?? null;
  // shape guard so a malformed payload can never crash the UI
  if (
    !announcement ||
    typeof announcement.id !== "string" ||
    typeof announcement.message !== "string"
  ) {
    return null;
  }
  return announcement;
}

/**
 * Broadcast a new announcement. `accessToken` is the poster's Liner token;
 * the server verifies it against the upstream API and only accepts the
 * site owner's account.
 */
export async function sendAnnouncement(
  message: string,
  accessToken: string,
  timeoutMs = 15_000,
): Promise<Announcement> {
  const res = await fetch("/api/announcements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, accessToken }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    if (res.status === 403) throw new AnnouncementError("forbidden", 403);
    if (res.status === 401) throw new AnnouncementError("unauthorized", 401);
    if (res.status === 429) throw new AnnouncementError("rate_limited", 429);
    throw new AnnouncementError("generic", res.status);
  }
  const data = (await res.json()) as { announcement?: Announcement };
  if (!data?.announcement || typeof data.announcement.id !== "string") {
    throw new AnnouncementError("generic", res.status);
  }
  return data.announcement;
}
