// Liner web port: the desktop build relies on the Electron main process to
// open CORS on every upstream response (electron/cors.ts). A plain browser
// cannot do that, so cross-origin traffic is transparently rerouted through
// same-origin proxy routes served by the web shell:
//
//   /api/yt/...        -> https://music.youtube.com/youtubei/...
//   /api/sc/...        -> https://api-v2.soundcloud.com/...
//   /api/fetch?u=...   -> generic JSON/text/form upstreams (oauth, imports, discovery)
//   /api/media?u=...   -> binary audio streams with Range support (googlevideo, sndcdn, ...)
//
// Everything else (the Liner API itself) is CORS-enabled upstream and is
// called directly, exactly like the desktop renderer does.

const SAME_ORIGIN_BYPASS = ["blob:", "data:", "about:", "chrome:", "resource:"];

// generic JSON/text upstreams (fetched with plain fetch, no Range semantics)
const FETCH_HOSTS = [
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

// binary media upstreams (fetched with Range/HEAD by the audio engine)
const MEDIA_HOSTS = [
  "googlevideo.com",
  "sndcdn.com", // cf-media, cf-hls-media, i1..i4, img, a1 ...
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

function hostMatches(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith("." + suffix);
}

export function isWebProxyActive(): boolean {
  return typeof window !== "undefined";
}

/**
 * Rewrites a cross-origin URL to its same-origin proxy equivalent.
 * Passes through anything already relative, blob/data or same-origin.
 */
export function rewriteForWeb(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  if (SAME_ORIGIN_BYPASS.some((scheme) => rawUrl.startsWith(scheme))) return rawUrl;
  if (rawUrl.startsWith("/")) return rawUrl;
  if (typeof window === "undefined") return rawUrl;

  let url: URL;
  try {
    url = new URL(rawUrl, window.location.origin);
  } catch {
    return rawUrl;
  }
  if (url.origin === window.location.origin) return rawUrl;

  const host = url.hostname;

  // the Liner API itself is CORS-enabled upstream — always call it directly
  // (matches DEFAULT_PRIMARY_API; anything on api.<base> must not be proxied)
  if (host === "api.tryliner.fun" || host === "api.tryliner.com") {
    return rawUrl;
  }

  // Innertube: (music|www).youtube.com/youtubei/<...> -> /api/yt/<...>
  // (music.youtube.com is the WEB_REMIX catalog origin; www.youtube.com hosts
  // the TV / visionOS / Android VR playback profiles — both need the proxy so
  // x-liner-user-agent can be mapped to a real User-Agent upstream)
  if (
    hostMatches(host, "youtube.com") &&
    (url.pathname.startsWith("/youtubei/") || url.pathname === "/youtubei")
  ) {
    return `/api/yt${url.pathname.slice("/youtubei".length)}${url.search}`;
  }

  // SoundCloud API: api-v2.soundcloud.com/<...> -> /api/sc/<...>
  if (host === "api-v2.soundcloud.com") {
    return `/api/sc${url.pathname}${url.search}`;
  }

  // a-v2.sndcdn.com is script/text (clientId discovery) — must win over sndcdn media rule
  if (hostMatches(host, "a-v2.sndcdn.com")) {
    return `/api/fetch?u=${encodeURIComponent(url.toString())}`;
  }

  if (MEDIA_HOSTS.some((suffix) => hostMatches(host, suffix))) {
    return `/api/media?u=${encodeURIComponent(url.toString())}`;
  }

  if (FETCH_HOSTS.some((suffix) => hostMatches(host, suffix))) {
    return `/api/fetch?u=${encodeURIComponent(url.toString())}`;
  }

  return rawUrl;
}

let installed = false;

/**
 * Installs a global fetch interceptor that transparently routes cross-origin
 * requests through the web proxy. Must be called before any app code runs.
 */
export function installWebFetchProxy(): void {
  if (installed || typeof window === "undefined" || typeof window.fetch === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === "string" || input instanceof URL) {
      const raw = input.toString();
      const rewritten = rewriteForWeb(raw);
      if (rewritten === raw) return originalFetch(input as RequestInfo, init);
      return originalFetch(rewritten, init);
    }

    const rewritten = rewriteForWeb(input.url);
    if (rewritten === input.url) return originalFetch(input, init);

    const request = new Request(rewritten, input);
    return originalFetch(request, init);
  };
}
