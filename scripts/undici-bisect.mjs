// Mimic the /api/yt proxy's upstream fetch exactly (undici, ArrayBuffer body,
// same header set) — bisect the 400 "Oops" difference vs curl.
const BODY = JSON.stringify({
  videoId: "dQw4w9WgXcQ",
  contentCheckOk: true,
  racyCheckOk: true,
  context: {
    client: {
      clientName: "TVHTML5",
      clientVersion: "7.20260707.07.00",
      hl: "en",
      gl: "US",
      userAgent: "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)",
    },
  },
  playbackContext: { contentPlaybackContext: { signatureTimestamp: 20746001 } },
});

const UA = "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";

async function attempt(label, url, headers, body) {
  try {
    const res = await fetch(url, { method: "POST", headers, body, redirect: "follow", cache: "no-store" });
    const text = await res.text();
    const isOops = text.includes("<title>Oops</title>");
    let status = "?";
    try { status = JSON.parse(text)?.playabilityStatus?.status ?? "no-playability"; } catch {}
    console.log(`${label}: HTTP ${res.status} ${isOops ? "[OOPS HTML]" : ""} playability=${status} len=${text.length}`);
  } catch (e) {
    console.log(`${label}: FETCH ERROR ${e.message}`);
  }
}

const base = {
  "content-type": "application/json",
  "x-youtube-client-name": "7",
  "x-youtube-client-version": "7.20260707.07.00",
};

await attempt("1. undici string body, TV UA   ", "https://www.youtube.com/youtubei/v1/player?prettyPrint=false", { ...base, "user-agent": UA }, BODY);
await attempt("2. undici ArrayBuffer body     ", "https://www.youtube.com/youtubei/v1/player?prettyPrint=false", { ...base, "user-agent": UA }, new TextEncoder().encode(BODY).buffer);
await attempt("3. undici, accept: */*         ", "https://www.youtube.com/youtubei/v1/player?prettyPrint=false", { ...base, "user-agent": UA, accept: "*/*" }, BODY);
await attempt("4. undici, NO UA at all        ", "https://www.youtube.com/youtubei/v1/player?prettyPrint=false", base, BODY);
