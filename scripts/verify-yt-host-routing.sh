#!/bin/bash
# Host-routing proof: the same anonymous TV player request
#  1) direct to www.youtube.com
#  2) through the new /api/yt/www proxy
#  3) through the old /api/yt proxy (music origin)
# If 1 == 2 != 3, the new route genuinely reaches www.youtube.com.
PORT=3000
BODY='{"videoId":"dQw4w9WgXcQ","contentCheckOk":true,"racyCheckOk":true,"context":{"client":{"clientName":"TVHTML5","clientVersion":"7.20260707.07.00","hl":"en","gl":"US","userAgent":"Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)"}},"playbackContext":{"contentPlaybackContext":{"signatureTimestamp":20746001}}}'

jq_status() { python3 -c "import json,sys; d=json.load(sys.stdin); ps=d.get('playabilityStatus',{}); print(json.dumps({'status': ps.get('status'), 'reason': (ps.get('reason') or '')[:60], 'hasStreamingData': 'streamingData' in d, 'ctx_host': d.get('responseContext',{}).get('visitorData','')[:12]}))" 2>/dev/null || echo "NOT JSON: $(head -c 120)"; }

echo "=== 1. direct www.youtube.com ==="
curl -sS --max-time 30 -X POST "https://www.youtube.com/youtubei/v1/player?prettyPrint=false" \
  -H "content-type: application/json" -H "x-youtube-client-name: 7" -H "x-youtube-client-version: 7.20260707.07.00" \
  -H "user-agent: Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)" \
  -d "$BODY" | jq_status

echo "=== 2. via NEW /api/yt/www proxy ==="
curl -sS --max-time 30 -X POST "http://localhost:$PORT/api/yt/www/v1/player?prettyPrint=false" \
  -H "content-type: application/json" -H "x-youtube-client-name: 7" -H "x-youtube-client-version: 7.20260707.07.00" \
  -H "x-liner-user-agent: Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)" \
  -d "$BODY" | jq_status

echo "=== 3. via OLD /api/yt proxy (music origin) ==="
curl -sS --max-time 30 -X POST "http://localhost:$PORT/api/yt/v1/player?prettyPrint=false" \
  -H "content-type: application/json" -H "x-youtube-client-name: 7" -H "x-youtube-client-version: 7.20260707.07.00" \
  -H "x-liner-user-agent: Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)" \
  -d "$BODY" | jq_status
