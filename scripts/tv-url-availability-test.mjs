// Experiment matrix: anonymous TV playback URL availability.
//  A. TV player + livingRoomPoTokenId (tv-session bootstrap)      -> URLs?
//  B. TV player + serviceIntegrityDimensions.poToken (WEB minter) -> URLs?
//  C. TV player + BOTH                                            -> URLs?
//  D. anon SABR: serverAbrStreamingUrl via googlevideo SabrStream -> audio chunks?
// Baseline established earlier: plain TV player (no token) -> OK but 0 URLs.
import { SabrStream } from "googlevideo/sabr-stream";
import { VideoPlaybackAbrRequest } from "googlevideo/protos";
import { buildSabrFormat } from "googlevideo/utils";

const SHELL = "http://127.0.0.1:3000";
const VIDEO = "pWWJ91byADE"; // same test video as task 10 harness
const TV_UA = "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";

const session = await (await fetch(`${SHELL}/api/youtube/tv-session`)).json();
console.log("tv-session ok:", session.clientVersion, session.poToken.slice(0, 18) + "...");

const playerJs = await (await fetch(`https://www.youtube.com/s/player/${session.playerId}/tv-player-ias-tcl.vflset/tv-player-ias-tcl.js`, { headers: { "user-agent": TV_UA } })).text();
const signatureTimestamp = Number(/signatureTimestamp:(\d+)/.exec(playerJs)?.[1]);
console.log("signatureTimestamp:", signatureTimestamp);

// WEB-minted content PO token (same minter the app uses)
const mintRes = await fetch(`${SHELL}/api/po-token?videoId=${VIDEO}`);
const { poToken: webPo } = await mintRes.json();
console.log("web po token:", webPo ? webPo.slice(0, 18) + "..." : "FAILED " + mintRes.status);

const cpn = Array.from({ length: 16 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[Math.floor(Math.random() * 64)]).join("");

function tvBody(extra = {}) {
  return {
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
        ...extra,
      },
      user: { lockedSafetyMode: false },
    },
    playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS", signatureTimestamp } },
  };
}

async function tvPlayer(label, extra) {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": TV_UA,
      "x-youtube-client-name": "7",
      "x-youtube-client-version": session.clientVersion,
      "x-goog-visitor-id": session.visitorData,
    },
    body: JSON.stringify(tvBody(extra)),
  });
  const d = await res.json().catch(() => null);
  const ps = d?.playabilityStatus ?? {};
  const sd = d?.streamingData;
  const adaptive = sd?.adaptiveFormats ?? [];
  const withUrl = adaptive.filter((f) => f.url || f.signatureCipher).length;
  console.log(`${label}: HTTP ${res.status} playability=${ps.status} adaptive=${adaptive.length} withUrl=${withUrl} serverAbr=${sd?.serverAbrStreamingUrl ? "YES" : "no"}`);
  return sd ?? null;
}

const sdA = await tvPlayer("A. livingRoomPoTokenId     ", { tvAppInfo: { livingRoomPoTokenId: session.livingRoomPoTokenId } });
const sdB = await tvPlayer("B. serviceIntegrity poToken", { serviceIntegrityDimensions: { poToken: webPo } });
const sdC = await tvPlayer("C. both tokens             ", { tvAppInfo: { livingRoomPoTokenId: session.livingRoomPoTokenId }, serviceIntegrityDimensions: { poToken: webPo } });

// D. anonymous SABR from the best serverAbrStreamingUrl
const chosen = sdA?.serverAbrStreamingUrl ? { sd: sdA, label: "A" } : sdB?.serverAbrStreamingUrl ? { sd: sdB, label: "B" } : sdC?.serverAbrStreamingUrl ? { sd: sdC, label: "C" } : null;
if (chosen) {
  console.log(`\nD. anon SABR from variant ${chosen.label}:`);
  try {
    const formats = (chosen.sd.adaptiveFormats ?? []).map(buildSabrFormat);
    const stream = new SabrStream({
      videoId: VIDEO,
      formats,
      serverAbrStreamingUrl: chosen.sd.serverAbrStreamingUrl,
      videoPlaybackUstreamerConfig: chosen.sd.ustreamerConfig,
      clientInfo: { clientName: 7, clientVersion: session.clientVersion },
      poToken: new TextEncoder().encode(session.poToken), // hmm — need base64ToU8
    });
    const reader = stream.streamAudio();
    const { value } = await reader.read();
    console.log(`   SABR first chunk: ${value ? value.byteLength + " bytes" : "EMPTY"}`);
  } catch (e) {
    console.log("   SABR error:", String(e).slice(0, 120));
  }
} else {
  console.log("\nD. skipped — no serverAbrStreamingUrl in any variant");
}
