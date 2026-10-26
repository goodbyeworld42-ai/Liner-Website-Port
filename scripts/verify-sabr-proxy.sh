#!/bin/bash
# SABR streaming-proxy runtime verification (standalone node server, mirrors FC).
#  1) SPA shell 200 (new bundle)
#  2) POST /api/yt/sabr with a disallowed host -> 400 (allowlist works)
#  3) POST /api/yt/sabr with a real-shaped /api/manifest/sabr URL -> reaches
#     YouTube and streams its response back (status + content-type passthrough)
#  4) streaming proof: chunked transfer / no content-length rewrite, first
#     bytes arrive progressively (curl -N shows headers + body flow)
PORT=3100

cd /home/z/my-project/.next/standalone
HOSTNAME=0.0.0.0 PORT=$PORT NODE_ENV=production node server.js > /tmp/sabr-server.log 2>&1 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT

for i in $(seq 1 30); do
  curl -s -o /dev/null "http://localhost:$PORT/" && break
  sleep 0.5
done
echo "--- server up (pid $SERVER_PID)"

echo "=== 1. SPA shell ==="
curl -s -o /dev/null -w "status=%{http_code} type=%{content_type}\n" "http://localhost:$PORT/liner/"
curl -s "http://localhost:$PORT/liner/" | grep -o 'index-[A-Za-z0-9_-]*\.js' | head -1

echo "=== 2. disallowed host ==="
curl -s -X POST "http://localhost:$PORT/api/yt/sabr?u=$(python3 -c "import urllib.parse;print(urllib.parse.quote('https://evil.example.com/api/manifest/sabr/x',safe=''))")" \
  -w "\nstatus=%{http_code}\n"

echo "=== 3. disallowed path on allowed host ==="
curl -s -X POST "http://localhost:$PORT/api/yt/sabr?u=$(python3 -c "import urllib.parse;print(urllib.parse.quote('https://www.youtube.com/other/path',safe=''))")" \
  -w "\nstatus=%{http_code}\n"

echo "=== 4. real-shaped SABR URL passthrough (YouTube response relayed) ==="
# a real serverAbrStreamingUrl shape; without valid signed params YouTube
# answers 400 + HTML — the point is that its response passes through streamed
SABR_URL='https://www.youtube.com/api/manifest/sabr/hp7fUTo3FaM/1/1?expire=1789999999&ei=test&ip=0.0.0.0&id=o-hp7fUTo3FaM&source=youtube&requiressl=yes&xpc=Eg80AsUBAQ%3D%3D&sabr=1&operator=7&signature=&c=TVHTML5&simid=1&pv=1&osfc=1&idpj=0&ldpj=0&pl=us&lmt=1&n=test&cpn=test&cver=7.20260707.07.00&cbr=Unknown&format=133'
curl -s -N -D /tmp/sabr-headers.txt -X POST \
  "http://localhost:$PORT/api/yt/sabr?u=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$SABR_URL")" \
  -H "content-type: application/x-protobuf" -H "accept: application/vnd.yt-ump" \
  -H "x-liner-user-agent: Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)" \
  --data-binary $'\x00\x01\x02test' \
  -o /tmp/sabr-body.bin -w "status=%{http_code} recv=%{size_download}B time=%{time_total}s\n"
echo "--- upstream response headers (relayed):"
head -12 /tmp/sabr-headers.txt
echo "--- body head:"
head -c 200 /tmp/sabr-body.bin | strings | head -4

echo "=== 5. direct-to-www comparison (same request, no proxy) ==="
curl -s -D /tmp/sabr-direct-headers.txt -X POST "$SABR_URL" \
  -H "content-type: application/x-protobuf" -H "accept: application/vnd.yt-ump" \
  -H "user-agent: Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)" \
  --data-binary $'\x00\x01\x02test' \
  -o /tmp/sabr-direct-body.bin -w "status=%{http_code} recv=%{size_download}B\n"
cmp -s /tmp/sabr-body.bin /tmp/sabr-direct-body.bin && echo "BODY_IDENTICAL_TO_DIRECT" || echo "body differs (acceptable: YouTube varies error pages)"
grep -i "^content-type" /tmp/sabr-direct-headers.txt /tmp/sabr-headers.txt
