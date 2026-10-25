// Liner web port: Innertube proxy.
// Forwards /api/yt/<endpoint> to https://music.youtube.com/youtubei/<endpoint>
// preserving query, body and Liner's client headers. The renderer cannot set a
// real User-Agent header in a browser, so it sends `x-liner-user-agent` and we
// map it to the actual User-Agent here (mirrors electron/cors.ts behaviour).
//
// NOTE: the upstream body is consumed server-side before responding. Next.js
// dev truncates raw streamed pass-through bodies (new Response(upstream.body));
// buffered JSON responses (<= ~1 MB here) always arrive intact.

import { NextRequest } from "next/server";
import { YT_UPSTREAM, forwardableHeaders, passthroughResponseHeaders } from "@/lib/liner-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 30_000;

// browser-forbidden header we accept from the app and remap upstream
const UA_OVERRIDE = "x-liner-user-agent";

function buildUpstreamUrl(request: NextRequest, relativePath: string): string {
  const search = request.nextUrl.search || "";
  return `${YT_UPSTREAM}/youtubei/${relativePath}${search}`;
}

async function proxy(request: NextRequest): Promise<Response> {
  const { pathname } = request.nextUrl;
  const prefix = "/api/yt/";
  const relative = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
  if (!relative) {
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
    upstream = await fetch(buildUpstreamUrl(request, relative), {
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

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
