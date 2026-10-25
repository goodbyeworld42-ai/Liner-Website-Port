// Shared allowlists for the Liner web-port proxy routes.
// Mirrors the host map in liner-app/src/shared/lib/webProxy.ts.

export const YT_UPSTREAM = "https://music.youtube.com";
export const SC_UPSTREAM = "https://api-v2.soundcloud.com";

// generic JSON/text upstreams (oauth, imports, clientId discovery, ...)
export const FETCH_HOSTS = [
  "soundcloud.com",
  "a-v2.sndcdn.com",
  "www.youtube.com",
  "youtube.com",
  "oauth2.googleapis.com",
  "api.deezer.com",
  "www.deezer.com",
  "api.music.apple.com",
  "music.apple.com",
  "open.spotify.com",
  "clienttoken.spotify.com",
  "api-partner.spotify.com",
  "open.spotifycdn.com",
  "api.genius.com",
  "genius.com",
  "images.genius.com",
  "api.github.com",
  "github.com",
];

// binary media upstreams (Range-capable audio streams)
export const MEDIA_HOSTS = [
  "googlevideo.com",
  "sndcdn.com",
  "ytimg.com",
  "googleusercontent.com",
  "tryliner.fun",
  "tryliner.com",
  "r2.dev",
  "r2.cloudflarestorage.com",
  "amazonaws.com",
  "pinimg.com",
  "clstorage.net",
  "soundcloud.com",
];

export function hostMatches(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith("." + suffix);
}

export function isAllowedFetchHost(hostname: string): boolean {
  return FETCH_HOSTS.some((suffix) => hostMatches(hostname, suffix));
}

export function isAllowedMediaHost(hostname: string): boolean {
  return MEDIA_HOSTS.some((suffix) => hostMatches(hostname, suffix));
}

// headers we never forward upstream
const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
  "origin",
  "referer",
  "cookie",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "x-forwarded-for",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "cdn-loop",
  "x-transformport",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
]);

export function forwardableHeaders(request: Request): Headers {
  const headers = new Headers();
  request.headers.forEach((value, name) => {
    if (!STRIP_REQUEST_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  });
  return headers;
}

// response headers worth passing back to the app
const PASSTHROUGH_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "content-disposition",
  "etag",
  "last-modified",
  "expires",
  "cache-control",
  "date",
  "x-liner-server-time",
  "x-request-id",
  "retry-after",
  "location",
];

export function passthroughResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of PASSTHROUGH_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}
