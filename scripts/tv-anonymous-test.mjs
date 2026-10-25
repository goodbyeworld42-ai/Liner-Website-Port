// Experiment: anonymous TV client player request with the server-minted
// living-room PO token — does playabilityStatus come back OK without account auth?
const session = await (
  await fetch("http://localhost:3000/api/youtube/tv-session")
).json();
console.log("tv session ready:", {
  clientVersion: session.clientVersion,
  playerId: session.playerId,
  poToken: session.poToken.slice(0, 24) + "...",
});

const TV_UA =
  "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";
const VIDEO = "pWWJ91byADE";

// need signatureTimestamp — get it from the player script header via a probe
const playerJs = await (
  await fetch(
    `https://www.youtube.com/s/player/${session.playerId}/tv-player-ias-tcl.vflset/tv-player-ias-tcl.js`,
    { headers: { "user-agent": TV_UA } },
  )
).text();
const signatureTimestamp = Number(/signatureTimestamp:(\d+)/.exec(playerJs)?.[1]);
console.log("signatureTimestamp:", signatureTimestamp);

const cpn = Array.from(
  { length: 16 },
  () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[Math.floor(Math.random() * 64)],
).join("");

const body = {
  videoId: VIDEO,
  cpn,
  contentCheckOk: true,
  racyCheckOk: true,
  context: {
    client: {
      clientName: "TVHTML5",
      clientVersion: session.clientVersion,
      hl: "en",
      gl: "US",
      userAgent: TV_UA,
      visitorData: session.visitorData,
      tvAppInfo: { livingRoomPoTokenId: session.livingRoomPoTokenId },
    },
    user: { lockedSafetyMode: false },
  },
  playbackContext: {
    contentPlaybackContext: {
      html5Preference: "HTML5_PREF_WANTS",
      signatureTimestamp,
    },
  },
};

const res = await fetch(
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": TV_UA,
      "x-youtube-client-name": "7",
      "x-youtube-client-version": session.clientVersion,
      "x-goog-visitor-id": session.visitorData,
    },
    body: JSON.stringify(body),
  },
);
const data = await res.json();
const ps = data.playabilityStatus || {};
console.log("status:", res.status, "| playability:", ps.status, "|", (ps.reason || "").slice(0, 60));
const streaming = data.streamingData;
if (streaming) {
  const adaptive = streaming.adaptiveFormats ?? [];
  const audio = adaptive.filter((f) => f.audioQuality || (f.mimeType || "").startsWith("audio/"));
  console.log("streamingData present | adaptive:", adaptive.length, "| audio-ish:", audio.length);
  console.log("serverAbrStreamingUrl:", streaming.serverAbrStreamingUrl ? "YES" : "no");
  if (audio.length) {
    console.log("sample audio:", audio[0].mimeType, audio[0].bitrate);
  }
} else {
  console.log("NO streamingData");
}
