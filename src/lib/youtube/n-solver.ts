// YouTube TV player n-parameter solver — website-port copy of
// liner-ref/electron/youtube/n-solver.ts. The desktop fetched the player
// script through a hidden window at youtube.com; the server fetches it
// directly with the TV Cobalt user agent instead.
import { parseScript, type ESTree } from "meriyah";
import { findUrlFactory, type UrlFactory } from "./n-factory";

const TV_USER_AGENT =
  "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";

const PLAYER_VARIANTS = [
  "tv-player-ias-tcl.vflset/tv-player-ias-tcl.js",
  "tv-player-ias.vflset/tv-player-ias.js",
];
const SKIPPED_METHODS = new Set(["constructor", "set", "get", "clone"]);
const PROBE_URL = "https://youtube.com/watch?v=liner";

// the TV player IIFE touches a few browser globals while booting; the url
// factory we drive never performs real resource loading, so inert stubs are
// enough. They run on the Node globalThis (single realm — see n-solver use).
function installPlayerShims(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g.document === "object" && g.document) return;
  const noop = () => {};
  const element = () => ({
    style: {},
    setAttribute: noop,
    getAttribute: () => null,
    appendChild: noop,
    remove: noop,
    removeChild: noop,
    addEventListener: noop,
    removeEventListener: noop,
    attachShadow: () => ({ appendChild: noop }),
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    parentNode: null,
    firstChild: null,
    contentWindow: null,
  });
  g.document = {
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
    createElement: element,
    createDocumentFragment: element,
    head: element(),
    body: element(),
    documentElement: element(),
    currentScript: null,
    cookie: "",
    location: { href: "https://www.youtube.com/", protocol: "https:", host: "www.youtube.com" },
  };
  g.window = g;
  g.self = g;
  // Node >=21 ships its own navigator with a "Node.js/xx" user agent — the
  // player parses a browser-shaped UA, so force-override it
  const nav = {
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
  };
  try {
    Object.defineProperty(g, "navigator", { value: nav, configurable: true, writable: true });
  } catch {
    g.navigator = nav;
  }
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
  g.location ??= { href: "https://www.youtube.com/", protocol: "https:", host: "www.youtube.com" };
}

interface PlayerUrl {
  set: (key: string, value: string) => void;
  get: (key: string) => unknown;
}

type UrlFactoryFn = (...args: Array<number | string>) => PlayerUrl;

interface LoadedPlayer {
  signatureTimestamp: number;
  factory: UrlFactory;
  create: UrlFactoryFn;
}

export interface SolveResult {
  signatureTimestamp: number;
  values: string[];
}

const players = new Map<string, Promise<LoadedPlayer>>();

async function fetchPlayer(playerId: string): Promise<string> {
  for (const variant of PLAYER_VARIANTS) {
    const response = await fetch(
      `https://www.youtube.com/s/player/${playerId}/${variant}`,
      { headers: { "user-agent": TV_USER_AGENT } },
    );
    if (response.ok) return response.text();
  }
  throw new Error(`YouTube TV player ${playerId} is unavailable`);
}

function wrapperBody(program: ESTree.Program): ESTree.BlockStatement {
  for (const statement of program.body) {
    if (statement.type !== "ExpressionStatement") continue;
    const call = statement.expression;
    if (call.type !== "CallExpression") continue;
    const callee =
      call.callee.type === "MemberExpression"
        ? call.callee.object
        : call.callee;
    if (callee.type === "FunctionExpression" && callee.body)
      return callee.body;
  }
  throw new Error("YouTube TV player has an unexpected layout");
}

async function loadPlayer(playerId: string): Promise<LoadedPlayer> {
  const source = await fetchPlayer(playerId);
  const signatureTimestamp = Number(
    /signatureTimestamp:(\d+)/.exec(source)?.[1],
  );
  if (!Number.isFinite(signatureTimestamp))
    throw new Error("YouTube TV player has no signature timestamp");
  const body = wrapperBody(parseScript(source, { ranges: true }));
  const factory = findUrlFactory(body.body);
  if (!factory) throw new Error("YouTube TV player url factory not found");
  const exportName = `__linerUrlFactory_${playerId.replace(/\W/g, "_")}`;
  const end = (body.range?.[1] ?? source.length) - 1;
  const instrumented = `${source.slice(0, end)};globalThis.${exportName}=${factory.name};${source.slice(end)}`;
  installPlayerShims();
  new Function(instrumented).call(globalThis);
  const create: unknown = Reflect.get(globalThis, exportName);
  if (typeof create !== "function")
    throw new Error("YouTube TV player url factory is not callable");
  return { signatureTimestamp, factory, create: create as UrlFactoryFn };
}

function transformN(player: LoadedPlayer, value: string): string {
  const url = player.create(...player.factory.args, PROBE_URL);
  url.set("n", value);
  const proto: object = Object.getPrototypeOf(url);
  const keys = [...Object.keys(proto), ...Object.getOwnPropertyNames(proto)];
  const method = keys.find(
    (key) =>
      !SKIPPED_METHODS.has(key) && typeof Reflect.get(url, key) === "function",
  );
  const transform: unknown = method ? Reflect.get(url, method) : undefined;
  if (typeof transform !== "function")
    throw new Error("YouTube TV player url has no transform");
  Reflect.apply(transform, url, []);
  const result = String(url.get("n") ?? "");
  if (!result || result === value || !/^[\w-]+$/.test(result))
    throw new Error("YouTube TV player returned an invalid n value");
  return result;
}

export async function solveN(
  playerId: string,
  values: string[],
): Promise<SolveResult> {
  let loading = players.get(playerId);
  if (!loading) {
    loading = loadPlayer(playerId);
    players.set(playerId, loading);
    loading.catch(() => players.delete(playerId));
  }
  const player = await loading;
  return {
    signatureTimestamp: player.signatureTimestamp,
    values: values.map((value) => transformN(player, value)),
  };
}
