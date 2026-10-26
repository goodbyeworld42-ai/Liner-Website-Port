/**
 * Seeds a live announcement directly into db/custom.db for E2E testing
 * of the viewer-side popup (bypasses the admin gate on purpose).
 * Usage: DATABASE_URL="file:/home/z/my-project/db/custom.db" node scripts/seed_test_announcement.mjs [message] [--clean]
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

if (process.argv.includes("--clean")) {
  const del = await db.announcement.deleteMany({});
  console.log("deleted", del.count, "announcement rows");
  process.exit(0);
}

const message =
  process.argv[2] ??
  "the website will be updating soon with bug fixes, etc.\nsee you soon liners!";

const avatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#ff4d4d"/><text x="32" y="42" font-size="30" text-anchor="middle" fill="white" font-family="sans-serif">J</text></svg>',
  );

const a = await db.announcement.create({
  data: {
    message,
    senderUsername: "jayzeyluna",
    senderName: "JayJoice",
    senderAvatarUrl: avatar,
  },
});
console.log("seeded announcement", a.id);
await db.$disconnect();
