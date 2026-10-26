/**
 * Seeds a live announcement directly into db/custom.db for E2E testing
 * of the viewer-side popup (bypasses the admin gate on purpose).
 * Usage: node scripts/seed_test_announcement.mjs [message] [--delay <sec>] [--clean]
 *   --delay N  -> showAt = now + N seconds (tests the 10s broadcast delay)
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

if (process.argv.includes("--clean")) {
  const del = await db.announcement.deleteMany({});
  console.log("deleted", del.count, "announcement rows");
  process.exit(0);
}

const message =
  process.argv.find((a, i) => i > 1 && !a.startsWith("--") && isNaN(Number(a))) ??
  "the website will be updating soon with bug fixes, etc.\nsee you soon liners!";

// inline PNG data URL (1x1 transparent-ish red dot), mirrors how the Liner app
// stores custom profile pictures (data:image/...;base64 payloads)
const avatar =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const delayIdx = process.argv.indexOf("--delay");
const delaySec = delayIdx > -1 ? Number(process.argv[delayIdx + 1] ?? 0) : 0;

const a = await db.announcement.create({
  data: {
    message,
    senderUsername: "jayzeyluna",
    senderName: "JayJoice",
    senderAvatarUrl: avatar,
    showAt: new Date(Date.now() + delaySec * 1000),
  },
});
console.log("seeded announcement", a.id, "showAt in", delaySec, "s");
await db.$disconnect();
