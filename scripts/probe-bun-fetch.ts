// Probe what the Bun runtime can handle for the YouTube TV bootstrap:
// the TV page answers with ~24KB of response headers.
// 1) bun's global fetch with the TV Cobalt UA
// 2) bun's node:https emulation with the same request
// 3) (run separately) node --version for the start.sh switch option
const TVUA =
  "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)";

const which = process.argv[2] ?? "fetch";

if (which === "fetch") {
  console.log("[probe] bun global fetch -> www.youtube.com/tv");
  try {
    const res = await fetch("https://www.youtube.com/tv", {
      headers: { "user-agent": TVUA },
      redirect: "follow",
    });
    const text = await res.text();
    console.log(`[probe] OK status=${res.status} bytes=${text.length} kabuki=${text.includes("kabuki")}`);
  } catch (error) {
    console.log(`[probe] fetch threw: ${error instanceof Error ? error.message : error}`);
  }
  console.log("[probe] still alive after fetch");
} else if (which === "https") {
  console.log("[probe] bun node:https -> www.youtube.com/tv");
  await new Promise((resolve) => {
    const req = require("node:https").request(
      {
        host: "www.youtube.com",
        path: "/tv",
        method: "GET",
        headers: { "user-agent": TVUA },
        maxHeaderSize: 256 * 1024,
      },
      (res) => {
        let bytes = 0;
        res.on("data", (chunk) => (bytes += chunk.length));
        res.on("end", () => {
          console.log(`[probe] OK status=${res.statusCode} bytes=${bytes}`);
          resolve(null);
        });
        res.resume();
      },
    );
    req.on("error", (error) => {
      console.log(`[probe] node:https threw: ${error.message}`);
      resolve(null);
    });
    req.end();
  });
  console.log("[probe] still alive after node:https");
}
