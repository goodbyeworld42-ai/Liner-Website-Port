#!/bin/bash
# Simulate the Liner web port's YouTube TV sign-in flow through the proxy
set -u
BASE="http://localhost:3000"
UA_OVERRIDE="x-liner-user-agent"
# TV_PROFILE userAgent — same one the app sends
TV_UA="Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version"

echo "== STEP 1: fetch TV page =="
curl -s "$BASE/api/fetch?u=https%3A%2F%2Fwww.youtube.com%2Ftv" \
  -H "$UA_OVERRIDE: $TV_UA" --max-time 30 -o /tmp/tv_page.html -w "HTTP %{http_code}, %{size_download} bytes\n"

echo "== STEP 2: parse base script url =="
node -e '
const fs = require("fs");
const page = fs.readFileSync("/tmp/tv_page.html", "utf8");
const m = page.match(/\/s\/_\/kabuki\/_\/js\/[^\x27"\\\\]+?m=base/);
console.log("match:", m ? m[0] : "NONE");
if (m) console.log("full: " + new URL(m[0], "https://www.youtube.com/tv").toString());
fs.writeFileSync("/tmp/script_path.txt", m ? m[0] : "");
'

SCRIPT_PATH=$(cat /tmp/script_path.txt)
if [ -z "$SCRIPT_PATH" ]; then
  echo "FATAL: base script pattern not found in TV page. Page head:"
  head -c 600 /tmp/tv_page.html
  exit 1
fi

echo "== STEP 3: fetch base script =="
ENC=$(node -e 'console.log(encodeURIComponent(new URL(require("fs").readFileSync("/tmp/script_path.txt","utf8"),"https://www.youtube.com/tv").toString()))')
curl -s "$BASE/api/fetch?u=$ENC" -H "$UA_OVERRIDE: $TV_UA" --max-time 60 -o /tmp/tv_script.js -w "HTTP %{http_code}, %{size_download} bytes\n"

echo "== STEP 4: parse oauth client credentials =="
node -e '
const fs = require("fs");
const s = fs.readFileSync("/tmp/tv_script.js", "utf8");
const m = s.match(/clientId:"(?<clientId>[^"]+)",[^"]*?:"(?<clientSecret>[^"]+)"/);
console.log("client:", m ? JSON.stringify(m.groups) : "NONE");
fs.writeFileSync("/tmp/client.json", m ? JSON.stringify(m.groups) : "");
'

CLIENT_ID=$(node -e 'const c=JSON.parse(require("fs").readFileSync("/tmp/client.json","utf8"));console.log(c.clientId||"")')
if [ -z "$CLIENT_ID" ]; then
  echo "FATAL: credentials pattern not found in base script"
  exit 1
fi

echo "== STEP 5: request device code =="
node -e '
const fs = require("fs");
const c = JSON.parse(fs.readFileSync("/tmp/client.json", "utf8"));
const body = JSON.stringify({ client_id: c.clientId, scope: "http://gdata.youtube.com https://www.googleapis.com/auth/youtube-paid-content", device_id: require("crypto").randomUUID(), device_model: "ytlr::" });
fs.writeFileSync("/tmp/device_req.json", body);
' 
curl -s -X POST "$BASE/api/fetch?u=https%3A%2F%2Fwww.youtube.com%2Fo%2Foauth2%2Fdevice%2Fcode" \
  -H "content-type: application/json" \
  --data @/tmp/device_req.json --max-time 30 -D /tmp/device_headers.txt -o /tmp/device_resp.json -w "HTTP %{http_code}\n"
echo "--- response ---"
cat /tmp/device_resp.json
echo
echo "--- resp headers ---"
cat /tmp/device_headers.txt | head -20
