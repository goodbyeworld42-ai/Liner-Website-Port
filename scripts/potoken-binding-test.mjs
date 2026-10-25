// Experiment: which binding does YouTube accept for WEB_REMIX + po_token?
// matrix: {mint context} x {request visitorData} — all from the server IP.
import { createRequire } from "module";
const require2 = createRequire("/home/z/my-project/liner-app/package.json");
const { Innertube } = require2("youtubei.js");
import { JSDOM } from "jsdom";
import { BotGuardClient } from "bgutils-js/botguard";
import { WebPoMinter } from "bgutils-js/webpo";
import { buildURL, GOOG_API_KEY } from "bgutils-js/utils";

const REQUEST_KEY = "O43z0dpjhgX20SCx4KAo";
const VIDEO = "pWWJ91byADE";

async function makeMinter() {
  const att = await fetch(
    "https://www.youtube.com/youtubei/v1/att/get?prettyPrint=false",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20250925.01.00",
            hl: "en",
            gl: "US",
          },
        },
        engagementType: "ENGAGEMENT_TYPE_UNBOUND",
      }),
    },
  );
  const challenge = (await att.json()).bgChallenge;
  const iu =
    challenge.interpreterUrl
      .privateDoNotAccessOrElseTrustedResourceUrlWrappedValue;
  const script = await (await fetch(`https:${iu}`)).text();
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://www.youtube.com/",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  dom.window.eval(script);
  const botguard = await BotGuardClient.create({
    program: challenge.program,
    globalName: challenge.globalName,
    globalObject: dom.window,
  });
  const signals = [];
  const response = await botguard.snapshot({ webPoSignalOutput: signals });
  const gen = await fetch(buildURL("GenerateIT", true), {
    method: "POST",
    headers: {
      "content-type": "application/json+protobuf",
      "x-goog-api-key": GOOG_API_KEY,
      "x-user-agent": "grpc-web-javascript/0.1",
    },
    body: JSON.stringify([REQUEST_KEY, response]),
  });
  const [token, ttl] = await gen.json();
  if (!token) throw new Error("no integrity token");
  const vmGetMinter = signals[0];
  signals[0] = async (bytes) => {
    const fn = await vmGetMinter(bytes);
    return async (data) => {
      const r = await fn(data);
      return r instanceof Uint8Array ? r : new Uint8Array(r);
    };
  };
  const minter = await WebPoMinter.create(
    { integrityToken: String(token).replace(/\+/g, "-").replace(/\//g, "_") },
    signals,
  );
  return { minter, dom };
}

// --- server-side innertube session (node runtime, YTMUSIC client) ---
const innertube = await Innertube.create({
  client_type: "YTMUSIC",
  generate_session_locally: false,
});
const visitorData = innertube.session.context.client.visitorData;
console.log("innertube visitorData:", visitorData?.slice(0, 20) + "...");

const { minter, dom } = await makeMinter();
const poToken = await minter.mintAsWebsafeString(VIDEO);
console.log("minted token:", poToken.slice(0, 30) + "...", poToken.length, "chars");

// try 1: YTMUSIC getBasicInfo with po_token (server-side session, server IP)
try {
  const info = await innertube.getBasicInfo(VIDEO, {
    client: "YTMUSIC",
    po_token: poToken,
  });
  console.log("TRY1 status:", info.playability_status?.status, "|", info.playability_status?.reason || "");
  const formats = info.streaming_data?.adaptive_formats?.filter(f => f.has_audio && !f.has_video) ?? [];
  console.log("TRY1 audio formats:", formats.length);
  if (formats.length) {
    const best = formats.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0))[0];
    const url = await best.decipher(innertube.session.player);
    const u = new URL(url);
    u.searchParams.set("pot", poToken);
    // probe reachability
    const probe = await fetch(u.toString(), { method: "GET", headers: { Range: "bytes=0-1023" } });
    console.log("TRY1 stream probe:", probe.status, probe.headers.get("content-type"), probe.headers.get("content-range"));
  }
} catch (e) {
  console.log("TRY1 failed:", e.message?.slice(0, 120));
}
dom.window.close();
