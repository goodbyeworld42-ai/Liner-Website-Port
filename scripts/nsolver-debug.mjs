// Debug the TV player script boot on Node globalThis.
import { createRequire } from "module";
const require2 = createRequire("/home/z/my-project/liner-app/package.json");
const { parseScript } = require2("meriyah");
import { findUrlFactory } from "/home/z/my-project/src/lib/youtube/n-factory.ts";

const TV_USER_AGENT =
  "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";

const session = await (
  await fetch("http://localhost:3000/api/youtube/tv-session")
).json();
const playerId = session.playerId;
const source = await (
  await fetch(
    `https://www.youtube.com/s/player/${playerId}/tv-player-ias-tcl.vflset/tv-player-ias-tcl.js`,
    { headers: { "user-agent": TV_USER_AGENT } },
  )
).text();
console.log("player script:", source.length);

// find the url factory like loadPlayer does
const body = (() => {
  for (const statement of parseScript(source, { ranges: true }).body) {
    if (statement.type !== "ExpressionStatement") continue;
    const call = statement.expression;
    if (call.type !== "CallExpression") continue;
    const callee =
      call.callee.type === "MemberExpression" ? call.callee.object : call.callee;
    if (callee.type === "FunctionExpression" && callee.body) return callee.body;
  }
  throw new Error("layout");
})();
const factory = findUrlFactory(body.body);
console.log("factory:", factory?.name, factory?.args);
const exportName = `__linerUrlFactory_${playerId.replace(/\W/g, "_")}`;
const end = (body.range?.[1] ?? source.length) - 1;
const instrumented = `${source.slice(0, end)};globalThis.${exportName}=${factory.name};${source.slice(end)}`;

// shim with logging to find what's accessed
const noop = () => {};
const element = () => new Proxy(
  { style: {}, setAttribute: noop, remove: noop },
  { get(t, p) { console.log("[element]", String(p)); return t[p]; } },
);
const g = globalThis;
g.document = new Proxy({
  hidden: false,
  visibilityState: "visible",
  readyState: "complete",
  URL: "https://www.youtube.com/",
  documentURI: "https://www.youtube.com/",
  baseURI: "https://www.youtube.com/",
  addEventListener: noop,
  removeEventListener: noop,
  getElementById: () => null,
  getElementsByTagName: () => [],
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (t) => { console.log("[createElement]", t); return element(); },
  head: element(),
  body: element(),
  documentElement: element(),
  currentScript: null,
  cookie: "",
}, { get(t, p) { if (!(p in t)) console.log("[document MISSING]", String(p)); return t[p]; } });
g.location = new Proxy({
  href: "https://www.youtube.com/",
  protocol: "https:",
  host: "www.youtube.com",
  hostname: "www.youtube.com",
  pathname: "/",
  search: "?v=liner",
  origin: "https://www.youtube.com",
  hash: "",
}, { get(t, p) { if (!(p in t)) console.log("[location MISSING]", String(p)); return t[p]; } });
Object.defineProperty(g, "navigator", { value: new Proxy({
  userAgent: TV_USER_AGENT,
  platform: "Unknown",
  language: "en-US",
  languages: ["en-US"],
  appVersion: "5.0",
  vendor: "Google Inc.",
  cookieEnabled: true,
  userAgentData: { brands: [], mobile: false, platforms: ["Unknown"] },
  onLine: true,
  doNotTrack: null,
}, { get(t, p) { if (!(p in t)) console.log("[navigator MISSING]", String(p)); return t[p]; } }), configurable: true, writable: true });
// inert XHR: the player fires boot requests we never need (only the url
// factory transform matters); open/send exist, callbacks never fire
class XMLHttpRequestStub {
  UNSENT = 0; OPENED = 1; HEADERS_RECEIVED = 2; LOADING = 3; DONE = 4;
  status = 0; responseText = ""; response = null; readyState = 0;
  onreadystatechange = null; onload = null; onerror = null; onabort = null;
  responseURL = ""; responseType = ""; statusText = "";
  open() {} setRequestHeader() {} overrideMimeType() {}
  addEventListener() {} removeEventListener() {}
  abort() {} getResponseHeader() { return null; } getAllResponseHeaders() { return ""; }
  send() {}
}
g.XMLHttpRequest = XMLHttpRequestStub;
g.window = g;
g.self = g;

try {
  new Function(instrumented).call(g);
  console.log("EVAL OK");
  const create = Reflect.get(g, exportName);
  console.log("factory fn:", typeof create);
  if (typeof create === "function") {
    const url = create(...factory.args, "https://youtube.com/watch?v=liner");
    console.log("url object:", typeof url);
    url.set("n", "7nnkvR45dTDFH4w8z");
    const proto = Object.getPrototypeOf(url);
    const keys = [...Object.keys(proto), ...Object.getOwnPropertyNames(proto)];
    const method = keys.find((k) => !["constructor","set","get","clone"].includes(k) && typeof Reflect.get(url, k) === "function");
    console.log("transform method:", method);
    Reflect.apply(Reflect.get(url, method), url, []);
    console.log("SOLVED n:", url.get("n"));
  }
} catch (e) {
  console.log("FAIL:", e.message);
}
