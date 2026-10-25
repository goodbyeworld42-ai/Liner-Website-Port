// Liner web port: server bootstrap hook.
//
// YouTube's TV endpoints (www.youtube.com/tv, the kabuki base script) answer
// with ~24 KB response header blocks — a 12.9 KB content-security-policy plus
// a 7.4 KB report-only header on top of the usual cookie set. Node's undici
// defaults to a 16 KB response-header cap and drops the connection with
// UND_ERR_HEADERS_OVERFLOW ("fetch failed"), which intermittently killed the
// YouTube TV sign-in bootstrap (device code never loaded). The Electron
// desktop build never hit this because Chromium has no such small cap.
//
// npm-undici's setGlobalDispatcher registers through Symbol.for, which the
// Node built-in global fetch used by the proxy routes also honours.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setGlobalDispatcher, Agent } = await import("undici");
    setGlobalDispatcher(new Agent({ maxHeaderSize: 256 * 1024 }));
  }
}
