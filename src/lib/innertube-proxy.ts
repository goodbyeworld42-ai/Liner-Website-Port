// Liner web port: shared Innertube proxy used by /api/yt/* routes.
// Forwards same-origin /api/yt/<endpoint> calls to the youtubei origin,
// preserving query, body and Liner's client headers. The renderer cannot set
// a real User-Agent header in a browser, so it sends `x-liner-user-agent` and
// we map it to the actual User-Agent here (mirrors electron/cors.ts).
//
// Two origins share this implementation:
//   /api/yt/...      -> https://music.youtube.com/youtubei/...  (WEB_REMIX)
//   /api/yt/www/...  -> https://www.youtube.com/youtubei/...    (TV / visionOS /
//                       Android VR playback profiles — YouTube only trusts a
//                       TV client context on the host a real TV client uses,
//                       and the account-authorized player request lives there)
//
// NOTE: the upstream body is consumed server-side before responding. Next.js
// dev truncates raw streamed pass-through bodies (new Response(upstream.body));
// buffered JSON responses (<= ~1 MB here) always arrive intact.

import { NextRequest } from "next/server";
import { forwardableHeaders, passthroughResponseHeaders } from "@/lib/liner-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 30_000;

// browser-forbidden header we accept from the app and remap upstream
const UA_OVERRIDE = "x-liner-user-agent";

export async function proxyInnertube(
  request: NextRequest,
  upstreamOrigin: string,
  mountPrefix: string,
): Promise<Response> {
  const { pathname } = request.nextUrl;
  const relative = pathname.startsWith(mountPrefix)
    ? pathname.slice(mountPrefix.length)
    : "";
  if (!relative || relative === "/") {
    return Response.json({ error: "Missing innertube endpoint" }, { status: 400 });
  }

  const headers = forwardableHeaders(request);
  const userAgentOverride = headers.get(UA_OVERRIDE);
  if (userAgentOverride) {
    headers.delete(UA_OVERRIDE);
    headers.set("user-agent", userAgentOverride);
    // device-style profiles (TV / visionOS / Android VR) must not expose web
    // origin headers — native clients never send them
    headers.delete("origin");
    headers.delete("referer");
  } else {
    // innertube expects an origin header identifying the calling web client
    if (!headers.has("origin")) headers.set("origin", "https://music.youtube.com");
    if (!headers.has("referer")) headers.set("referer", "https://music.youtube.com/");
  }

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${upstreamOrigin}/youtubei/${relative.replace(/^\/+/, "")}`, {
      method: request.method,
      headers,
      body,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upstream unreachable";
    return Response.json({ error: "Innertube upstream failed", message }, { status: 502 });
  }

  const buffer = await upstream.arrayBuffer().catch(() => new ArrayBuffer(0));
  const outHeaders = passthroughResponseHeaders(upstream);
  outHeaders.delete("content-length");
  outHeaders.set("content-length", String(buffer.byteLength));

  return new Response(buffer, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
