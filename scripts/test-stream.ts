// Isolate media/yt proxy truncation: compare upstream size via plain undici
// vs through the Next.js proxy route.
const URL_UPSTREAM =
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const URL_PROXY = "http://localhost:3000/api/yt/v1/player?prettyPrint=false";

const BODY = JSON.stringify({
  videoId: "dQw4w9WgXcQ",
  contentCheckOk: true,
  racyCheckOk: true,
  context: {
    client: {
      clientName: "ANDROID_VR",
      clientVersion: "1.65.10",
      hl: "en",
      gl: "US",
      osName: "Android",
      osVersion: "12L",
      deviceMake: "Oculus",
      deviceModel: "Quest 3",
      androidSdkVersion: 32,
      userAgent:
        "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
    },
    user: { lockedSafetyMode: false },
  },
});

const HEADERS: Record<string, string> = {
  "content-type": "application/json",
  "x-youtube-client-name": "28",
  "x-youtube-client-version": "1.65.10",
  "x-origin": "https://www.youtube.com",
  "user-agent":
    "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
};

async function measure(label: string, url: string, headers: Record<string, string>) {
  try {
    const res = await fetch(url, { method: "POST", headers, body: BODY });
    const reader = res.body!.getReader();
    let total = 0;
    let chunks = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        chunks++;
      }
    } catch (err) {
      console.log(`${label}: STREAM ERROR after ${total} bytes:`, (err as Error).message);
      return;
    }
    console.log(`${label}: ok status=${res.status} bytes=${total} chunks=${chunks}`);
  } catch (err) {
    console.log(`${label}: FETCH ERROR`, (err as Error).message);
  }
}

async function main() {
  for (let i = 0; i < 3; i++) {
    await measure(`direct#${i}`, URL_UPSTREAM, HEADERS);
    await measure(`proxy #${i}`, URL_PROXY, {
      "content-type": "application/json",
      "x-youtube-client-name": "28",
      "x-youtube-client-version": "1.65.10",
      "x-origin": "https://www.youtube.com",
      "x-liner-user-agent": HEADERS["user-agent"],
    });
  }
}

main();
