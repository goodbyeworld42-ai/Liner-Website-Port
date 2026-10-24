// Liner web port: generic text/JSON upstream proxy.
// Covers everything the desktop renderer fetched directly thanks to
// Electron's open-CORS interceptor: SoundCloud clientId discovery (HTML + app
// scripts), YouTube TV oauth device flow, visitor data bootstrap, Deezer /
// Apple Music / Spotify playlist imports, Genius fallbacks, GitHub releases.
//
// Usage: /api/fetch?u=<urlencoded upstream url>  (any method, body forwarded)

import { NextRequest } from "next/server";
import { isAllowedFetchHost, forwardableHeaders, passthroughResponseHeaders } from "@/lib/liner-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 30_000;
const MAX_BUFFER_BYTES = 32 * 1024 * 1024;

function decodeTarget(request: NextRequest): URL | null {
  const raw = request.nextUrl.searchParams.get("u");
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

async function proxy(request: NextRequest): Promise<Response> {
  const target = decodeTarget(request);
  if (!target || !isAllowedFetchHost(target.hostname)) {
    return Response.json({ error: "Disallowed fetch host" }, { status: 400 });
  }

  const headers = forwardableHeaders(request);
  headers.set("host", target.host);

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upstream unreachable";
    return Response.json({ error: "Upstream request failed", message }, { status: 502 });
  }

  if (request.method === "HEAD" || upstream.body === null) {
    return new Response(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: passthroughResponseHeaders(upstream),
    });
  }

  const buffer = await upstream.arrayBuffer().catch(() => new ArrayBuffer(0));
  if (buffer.byteLength > MAX_BUFFER_BYTES) {
    return Response.json({ error: "Upstream payload too large to proxy" }, { status: 502 });
  }

  const outHeaders = passthroughResponseHeaders(upstream);
  outHeaders.delete("content-length");
  outHeaders.set("content-length", String(buffer.byteLength));

  return new Response(buffer, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function PUT(request: NextRequest) {
  return proxy(request);
}

export async function PATCH(request: NextRequest) {
  return proxy(request);
}

export async function DELETE(request: NextRequest) {
  return proxy(request);
}

export async function HEAD(request: NextRequest) {
  return proxy(request);
}
