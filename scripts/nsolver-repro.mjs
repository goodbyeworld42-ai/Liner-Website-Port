// Reproduce the route's exact shim environment and dump the failing code.
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

const program = parseScript(source, { ranges: true });
let body;
for (const statement of program.body) {
  if (statement.type !== "ExpressionStatement") continue;
  const call = statement.expression;
  if (call.type !== "CallExpression") continue;
  const callee =
    call.callee.type === "MemberExpression" ? call.callee.object : call.callee;
  if (callee.type === "FunctionExpression" && callee.body) {
    body = callee.body;
    break;
  }
}
const factory = findUrlFactory(body.body);
const exportName = `__linerUrlFactory_${playerId.replace(/\W/g, "_")}`;
const end = (body.range?.[1] ?? source.length) - 1;
const start = body.range?.[0] ?? 0;
// NOTE: loadPlayer evals the FULL source but the wrapper body range is used
// only for the instrumentation cut; the eval'd script == full source with the
// export appended before the last char. So position 4176 is IN FULL SOURCE.
const instrumented = `${source.slice(0, end)};globalThis.${exportName}=${factory.name};${source.slice(end)}`;

// exact route shims (plain objects)
const noop = () => {};
const element = () => ({
  style: {}, setAttribute: noop, getAttribute: () => null, appendChild: noop,
  remove: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop,
  attachShadow: () => ({ appendChild: noop }), getElementsByTagName: () => [],
  querySelector: () => null, querySelectorAll: () => [],
  parentNode: null, firstChild: null, contentWindow: null,
});
const g = globalThis;
g.document = {
  hidden: false, visibilityState: "visible", readyState: "complete",
  URL: "https://www.youtube.com/", documentURI: "https://www.youtube.com/",
  baseURI: "https://www.youtube.com/",
  addEventListener: noop, removeEventListener: noop,
  getElementById: () => null, getElementsByTagName: () => [],
  querySelector: () => null, querySelectorAll: () => [],
  createElement: element, createDocumentFragment: element,
  head: element(), body: element(), documentElement: element(),
  currentScript: null, cookie: "",
  location: { href: "https://www.youtube.com/", protocol: "https:", host: "www.youtube.com" },
};
g.window = g; g.self = g;
const nav = {
  userAgent: TV_USER_AGENT, platform: "Unknown", language: "en-US",
  languages: ["en-US"], appVersion: "5.0", vendor: "Google Inc.",
  cookieEnabled: true, userAgentData: { brands: [], mobile: false, platforms: ["Unknown"] },
  onLine: true, doNotTrack: null,
};
Object.defineProperty(g, "navigator", { value: nav, configurable: true, writable: true });
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
g.location = { href: "https://www.youtube.com/", protocol: "https:", host: "www.youtube.com" };

try {
  new Function(instrumented).call(g);
  console.log("EVAL OK");
  const create = Reflect.get(g, exportName);
  const url = create(...factory.args, "https://youtube.com/watch?v=liner");
  url.set("n", "7nnkvR45dTDFH4w8z");
  const proto = Object.getPrototypeOf(url);
  const keys = [...Object.keys(proto), ...Object.getOwnPropertyNames(proto)];
  const method = keys.find((k) => !["constructor","set","get","clone"].includes(k) && typeof Reflect.get(url, k) === "function");
  Reflect.apply(Reflect.get(url, method), url, []);
  console.log("SOLVED:", url.get("n"));
} catch (e) {
  console.log("FAIL:", e.message);
  console.log("stack:", e.stack?.split("\n").slice(0, 4).join("\n"));
  const lines = instrumented.split("\n");
  console.log("instrumented lines:", lines.length);
  if (lines.length > 13815) {
    const l2 = lines[13814];
    console.log("L13815 col120-360:", JSON.stringify(l2.slice(120, 360)));
  }
  if (lines.length > 4176) {
    const line = lines[4175];
    console.log("L4176 col0-120:", JSON.stringify(line.slice(0, 120)));
  }
}
