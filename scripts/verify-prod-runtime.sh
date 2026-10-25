#!/bin/bash
# Full production-runtime verification: run the standalone server under Bun
# (exactly like the FC deployment's start.sh) and exercise every API path the
# SPA needs: static SPA, innertube search, TV oauth device flow, media proxy.
set -u
PORT=3001
cd /home/z/my-project/.next/standalone
setsid env NODE_ENV=production PORT=$PORT HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:/home/z/my-project/db/custom.db" \
  bun server.js > /tmp/prod-verify.log 2>&1 < /dev/null &
SERVER_PID=$!
disown

cleanup() { kill "$SERVER_PID" 2>/dev/null; pkill -f "bun server.js" 2>/dev/null; }
trap cleanup EXIT

# wait for readiness
for i in $(seq 1 20); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:$PORT/liner/index.html" 2>/dev/null || echo 000)
  [ "$code" = "200" ] && break
  sleep 0.5
done
echo "warmup: $code"

TVUA="Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)"

echo "=== [1] TV page (24KB response headers) ==="
curl -sS --max-time 45 -o /tmp/tv-verify.html -w "status %{http_code} size %{size_download}\n" \
  -H "x-liner-user-agent: $TVUA" \
  "http://127.0.0.1:$PORT/api/fetch?u=https%3A%2F%2Fwww.youtube.com%2Ftv"
grep -c kabuki /tmp/tv-verify.html >/dev/null 2>&1 && echo "kabuki reference: FOUND" || echo "kabuki reference: MISSING"

echo "=== [2] YouTube oauth device code POST ==="
curl -sS --max-time 30 -X POST \
  "http://127.0.0.1:$PORT/api/fetch?u=https%3A%2F%2Fwww.youtube.com%2Fo%2Foauth2%2Fdevice%2Fcode" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "client_id=861556708454-d6dlm3lh05idd8n2k4d5gt8cvktbvm8u.apps.googleusercontent.com&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube&device_id=liner-verify&model_name=LG+WebOS+TV" \
  | head -c 260
echo

echo "=== [3] innertube search (artist/search data path) ==="
curl -sS --max-time 30 -X POST \
  "http://127.0.0.1:$PORT/api/yt/youtubei/v1/search?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30&prettyPrint=false" \
  -H "Content-Type: application/json" \
  -d '{"context":{"client":{"clientName":"WEB_REMIX","clientVersion":"1.20240403.01.00","hl":"en","gl":"US"}},"query":"adele"}' \
  -o /tmp/yt-search.json -w "status %{http_code} size %{size_download}\n"
grep -c "Adele" /tmp/yt-search.json >/dev/null 2>&1 && echo "search results: REAL DATA" || echo "search results: check body"

echo "=== [4] media route (googlevideo host) ==="
curl -sS --max-time 30 -o /dev/null -w "status %{http_code}\n" \
  "http://127.0.0.1:$PORT/api/media?u=https%3A%2F%2Frr3---sn-p5qs7n6s.googlevideo.com%2Fvideoplayback%3Ftest%3D1"

echo "=== [5] artist page API (/api/yt browse for artist) ==="
curl -sS --max-time 30 -X POST \
  "http://127.0.0.1:$PORT/api/yt/youtubei/v1/browse?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30&prettyPrint=false" \
  -H "Content-Type: application/json" \
  -d '{"context":{"client":{"clientName":"WEB_REMIX","clientVersion":"1.20240403.01.00","hl":"en","gl":"US"}},"browseId":"UC5ZiUaJMZKi9SUcmA_gT4kw"}' \
  -o /tmp/yt-browse.json -w "status %{http_code} size %{size_download}\n"

echo "=== server log tail ==="
tail -4 /tmp/prod-verify.log
echo "=== server still alive: ==="
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 5 "http://127.0.0.1:$PORT/liner/index.html" || echo DEAD
