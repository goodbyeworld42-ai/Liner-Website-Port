// Liner web port: Innertube proxy (WEB_REMIX origin).
// Forwards /api/yt/<endpoint> to https://music.youtube.com/youtubei/<endpoint>.
// Shared implementation lives in @/lib/innertube-proxy (see it for the
// www.youtube.com playback-profile variant mounted at /api/yt/www/...).

import { NextRequest } from "next/server";
import { YT_UPSTREAM } from "@/lib/liner-proxy";
import { OPTIONS, proxyInnertube } from "@/lib/innertube-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return proxyInnertube(request, YT_UPSTREAM, "/api/yt/");
}

export async function GET(request: NextRequest) {
  return proxyInnertube(request, YT_UPSTREAM, "/api/yt/");
}

export { OPTIONS };
