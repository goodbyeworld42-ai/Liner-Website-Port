import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { rewriteForWeb } from "./webProxy";

describe("rewriteForWeb — Liner API method awareness", () => {
  beforeAll(() => {
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:3000" },
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  const linerUrl = "https://api.tryliner.fun/v1/users/me";

  it("routes CORS-blocked mutations through the generic proxy", () => {
    expect(rewriteForWeb(linerUrl, "PATCH")).toBe(
      `/api/fetch?u=${encodeURIComponent(linerUrl)}`,
    );
    expect(rewriteForWeb(linerUrl, "PUT")).toBe(
      `/api/fetch?u=${encodeURIComponent(linerUrl)}`,
    );
    expect(rewriteForWeb(linerUrl, "DELETE")).toBe(
      `/api/fetch?u=${encodeURIComponent(linerUrl)}`,
    );
  });

  it("keeps CORS-allowed methods and header-only requests direct", () => {
    expect(rewriteForWeb(linerUrl, "GET")).toBe(linerUrl);
    expect(rewriteForWeb(linerUrl, "POST")).toBe(linerUrl);
    expect(rewriteForWeb(linerUrl, "HEAD")).toBe(linerUrl);
    // no method given (e.g. plain string URL lookups) stays direct
    expect(rewriteForWeb(linerUrl)).toBe(linerUrl);
  });

  it("is case-insensitive on the method", () => {
    expect(rewriteForWeb(linerUrl, "patch")).toBe(
      `/api/fetch?u=${encodeURIComponent(linerUrl)}`,
    );
  });

  it("also covers the api.tryliner.com mirror host", () => {
    const mirror = "https://api.tryliner.com/v1/users/me";
    expect(rewriteForWeb(mirror, "PATCH")).toBe(
      `/api/fetch?u=${encodeURIComponent(mirror)}`,
    );
    expect(rewriteForWeb(mirror, "POST")).toBe(mirror);
  });

  it("keeps the playback-profile youtubei origin apart from WEB_REMIX", () => {
    // TV / visionOS / Android VR player requests must land on www.youtube.com
    // — the account-authorized TV player request is only trusted there
    expect(
      rewriteForWeb("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", "POST"),
    ).toBe("/api/yt/www/v1/player?prettyPrint=false");
    // WEB_REMIX catalog calls keep the music origin
    expect(
      rewriteForWeb("https://music.youtube.com/youtubei/v1/player?prettyPrint=false", "POST"),
    ).toBe("/api/yt/v1/player?prettyPrint=false");
    // nested youtube.com subdomains that are NOT www stay on the music proxy
    // (only an exact www host is the playback origin)
    expect(
      rewriteForWeb("https://youtube.com/youtubei/v1/player", "POST"),
    ).toBe("/api/yt/v1/player");
  });

  it("leaves other hosts' behavior unchanged", () => {
    expect(
      rewriteForWeb("https://music.youtube.com/youtubei/v1/search?key=x", "POST"),
    ).toBe("/api/yt/v1/search?key=x");
    expect(
      rewriteForWeb("https://api-v2.soundcloud.com/tracks?ids=1", "GET"),
    ).toBe("/api/sc/tracks?ids=1");
    expect(
      rewriteForWeb("https://oauth2.googleapis.com/token", "POST"),
    ).toBe(
      `/api/fetch?u=${encodeURIComponent("https://oauth2.googleapis.com/token")}`,
    );
  });

  it("passes through same-origin and bypass-scheme URLs", () => {
    expect(rewriteForWeb("/v1/me", "PATCH")).toBe("/v1/me");
    expect(rewriteForWeb("data:image/png;base64,abc", "PATCH")).toBe(
      "data:image/png;base64,abc",
    );
    expect(
      rewriteForWeb("http://localhost:3000/api/fetch?u=x", "PATCH"),
    ).toBe("http://localhost:3000/api/fetch?u=x");
  });
});
