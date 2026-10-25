// Experiment v2: try session-bound (visitorData) minting variants.
import { createRequire } from "module";
const require2 = createRequire("/home/z/my-project/liner-app/package.json");
const { Innertube } = require2("youtubei.js");
import { JSDOM } from "jsdom";
import { BotGuardClient } from "bgutils-js/botguard";
import { WebPoMinter } from "bgutils-js/webpo";
import { buildURL, GOOG_API_KEY } from "bgutils-js/utils";

const REQUEST_KEY = "O43z0dpjhgX20SCx4KAo";
const VIDEO = "pWWJ91byADE";

async function mintWith({ challengeVisitorData, binding }) {
  const body = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20250925.01.00",
        hl: "en",
        gl: "US",
      },
    },
    engagementType: "ENGAGEMENT_TYPE_UNBOUND",
  };
  if (challengeVisitorData) body.context.client.visitorData = challengeVisitorData;
  const att = await fetch(
    "https://www.youtube.com/youtubei/v1/att/get?prettyPrint=false",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
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
  const [token] = await gen.json();
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
  const po = await minter.mintAsWebsafeString(binding);
  dom.window.close();
  return po;
}

const innertube = await Innertube.create({
  client_type: "YTMUSIC",
  generate_session_locally: false,
});
const vd = innertube.session.context.client.visitorData;
console.log("session visitorData:", vd?.slice(0, 24) + "...");

const variants = [
  ["TRY2 mint(vd) session-bound", null, vd],
  ["TRY3 att(vd)+mint(vd)", vd, vd],
  ["TRY4 att(vd)+mint(videoId)", vd, VIDEO],
];

for (const [name, attVd, binding] of variants) {
  try {
    const po = await mintWith({ challengeVisitorData: attVd, binding });
    const info = await innertube.getBasicInfo(VIDEO, {
      client: "YTMUSIC",
      po_token: po,
    });
    const formats = (info.streaming_data?.adaptive_formats ?? []).filter(
      (f) => f.has_audio && !f.has_video,
    );
    console.log(
      `${name}: ${info.playability_status?.status} | formats: ${formats.length} | ${(info.playability_status?.reason || "").slice(0, 50)}`,
    );
  } catch (e) {
    console.log(`${name}: ERROR ${String(e.message).slice(0, 80)}`);
  }
}
