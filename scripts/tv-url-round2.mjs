// Round 2: no-visitorData TV-family player requests + PO tokens -> URLs?
const SHELL = "http://127.0.0.1:3000";
const VIDEO = "pWWJ91byADE";
const TV_UA = "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";

const session = await (await fetch(`${SHELL}/api/youtube/tv-session`)).json();
const mintRes = await fetch(`${SHELL}/api/po-token?videoId=${VIDEO}`);
const { poToken: webPo } = await mintRes.json();
const playerJs = await (await fetch(`https://www.youtube.com/s/player/${session.playerId}/tv-player-ias-tcl.vflset/tv-player-ias-tcl.js`, { headers: { "user-agent": TV_UA } })).text();
const signatureTimestamp = Number(/signatureTimestamp:(\d+)/.exec(playerJs)?.[1]);
const cpn = Array.from({ length: 16 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[Math.floor(Math.random() * 64)]).join("");

async function attempt(label, { client, headers }) {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      videoId: VIDEO, cpn, contentCheckOk: true, racyCheckOk: true,
      context: { client, user: { lockedSafetyMode: false } },
      playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS", signatureTimestamp } },
    }),
  });
  const d = await res.json().catch(() => null);
  const ps = d?.playabilityStatus ?? {};
  const sd = d?.streamingData;
  const adaptive = sd?.adaptiveFormats ?? [];
  const withUrl = adaptive.filter((f) => f.url || f.signatureCipher).length;
  const audio = adaptive.filter((f) => (f.mimeType || "").startsWith("audio/"));
  const audioUrl = audio.filter((f) => f.url || f.signatureCipher).length;
  console.log(`${label}: ${res.status} ${ps.status} adaptive=${adaptive.length} withUrl=${withUrl} audioUrl=${audioUrl} abr=${sd?.serverAbrStreamingUrl ? "YES" : "no"}`);
  return sd;
}

// 1. TV, no visitorData anywhere, serviceIntegrityDimensions.poToken
await attempt("1. TV no-visitor + integrityPo", {
  client: { clientName: "TVHTML5", clientVersion: session.clientVersion, hl: "en", gl: "US", userAgent: TV_UA, serviceIntegrityDimensions: { poToken: webPo } },
  headers: { "user-agent": TV_UA, "x-youtube-client-name": "7", "x-youtube-client-version": session.clientVersion },
});

// 2. TV, no visitorData, no token (baseline from earlier — OK/no URLs)
await attempt("2. TV no-visitor, no token    ", {
  client: { clientName: "TVHTML5", clientVersion: session.clientVersion, hl: "en", gl: "US", userAgent: TV_UA },
  headers: { "user-agent": TV_UA, "x-youtube-client-name": "7", "x-youtube-client-version": session.clientVersion },
});

// 3. ANDROID_VR, no visitorData, integrityPo
await attempt("3. ANDROID_VR + integrityPo   ", {
  client: { clientName: "ANDROID_VR", clientVersion: "1.65.10", hl: "en", gl: "US", userAgent: "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip", androidSdkVersion: 32, osName: "Android", osVersion: "12L", deviceMake: "Oculus", deviceModel: "Quest 3", serviceIntegrityDimensions: { poToken: webPo } },
  headers: { "user-agent": "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip", "x-youtube-client-name": "101" },
});

// 4. IOS client, no visitorData, integrityPo (classic yt-dlp favorite)
await attempt("4. IOS + integrityPo          ", {
  client: { clientName: "IOS", clientVersion: "20.10.4", hl: "en", gl: "US", deviceMake: "Apple", deviceModel: "iPhone16,2", osName: "iPhone", osVersion: "18.3.2.22D82", serviceIntegrityDimensions: { poToken: webPo } },
  headers: { "user-agent": "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)", "x-youtube-client-name": "5", "x-youtube-client-version": "20.10.4" },
});

// 5. WEB_REMIX no-visitor + integrityPo (is it still bot-checked?)
await attempt("5. WEB_REMIX + integrityPo    ", {
  client: { clientName: "WEB_REMIX", clientVersion: "1.20260911.08.00", hl: "en", gl: "US", serviceIntegrityDimensions: { poToken: webPo } },
  headers: { "x-youtube-client-name": "67", "x-youtube-client-version": "1.20260911.08.00", origin: "https://music.youtube.com", referer: "https://music.youtube.com/" },
});
