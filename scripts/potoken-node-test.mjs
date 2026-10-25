// Standalone BotGuard minting test v3 — jsdom VM realm + Node-realm wrappers.
// The VM must run in a browser-like realm to attest properly (jsdom gives
// signals=1 + a real integrity token), but bgutils checks the results with
// Node-realm `instanceof`, so the cross-realm function/array are wrapped.
import { JSDOM } from "jsdom";
import { BotGuardClient } from "bgutils-js/botguard";
import { WebPoMinter } from "bgutils-js/webpo";
import { buildURL, GOOG_API_KEY } from "bgutils-js/utils";

const REQUEST_KEY = "O43z0dpjhgX20SCx4KAo";

function makeDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://www.youtube.com/",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  return dom;
}

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
console.log("challenge ok, script", script.length, "chars");

const dom = makeDom();
const w = dom.window;
w.eval(script);
console.log("vm global:", typeof w[challenge.globalName]);

const botguard = await BotGuardClient.create({
  program: challenge.program,
  globalName: challenge.globalName,
  globalObject: w,
});
const signals = [];
const response = await botguard.snapshot({ webPoSignalOutput: signals });
console.log("snapshot:", String(response).length, "chars, signals:", signals.length);

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
console.log("GenerateIT:", gen.status, token ? `token ${String(token).length} chars` : "NULL", "ttl", ttl);

if (token && signals.length > 0) {
  // wrap the VM-realm getMinter in Node-realm functions at BOTH levels:
  // getMinter(bytes) -> mintFn (curried), then mintFn(data) -> Uint8Array.
  // bgutils checks both with Node-realm `instanceof`.
  const vmGetMinter = signals[0];
  signals[0] = async (bytes) => {
    const vmMintFn = await vmGetMinter(bytes);
    if (!(typeof vmMintFn === "function"))
      throw new Error("VM getMinter did not return a function: " + typeof vmMintFn);
    return async (data) => {
      const result = await vmMintFn(data);
      return result instanceof Uint8Array ? result : new Uint8Array(result);
    };
  };
  const minter = await WebPoMinter.create(
    { integrityToken: String(token).replace(/\+/g, "-").replace(/\//g, "_") },
    signals,
  );
  const po = await minter.mintAsWebsafeString("pWWJ91byADE");
  console.log("MINTED:", String(po).slice(0, 60), "...", String(po).length, "chars");
  // second mint on the cached minter (what the route does per request)
  const po2 = await minter.mintAsWebsafeString("dQw4w9WgXcQ");
  console.log("MINTED2:", String(po2).slice(0, 60), "...", String(po2).length, "chars");
}
dom.window.close();
