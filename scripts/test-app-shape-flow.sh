#!/bin/bash
# Replicate the app's EXACT request shapes (JSON bodies) through the proxy
BASE="http://localhost:3000/api/fetch"
CLIENT_ID="861556708454-d6dlm3lh05idd8npek18k6be8ba3oc68.apps.googleusercontent.com"
CLIENT_SECRET=$(cat /tmp/liner_client_secret 2>/dev/null)
if [ -z "$CLIENT_SECRET" ]; then
  echo "need client secret"
  exit 1
fi
UUID=$(python3 -c "import uuid;print(uuid.uuid4())")

echo "== device/code with APP shape (JSON body) =="
CODE_RESP=$(curl -s --max-time 30 -X POST \
  "$BASE?u=https%3A%2F%2Fwww.youtube.com%2Fo%2Foauth2%2Fdevice%2Fcode" \
  -H "content-type: application/json" \
  -d "{\"client_id\":\"$CLIENT_ID\",\"scope\":\"http://gdata.youtube.com https://www.googleapis.com/auth/youtube-paid-content\",\"device_id\":\"$UUID\",\"device_model\":\"ytlr::\"}")
echo "$CODE_RESP" | head -c 600
echo
DEVICE_CODE=$(echo "$CODE_RESP" | python3 -c "import json,sys;print(json.load(sys.stdin).get('device_code',''))")
echo "device_code len: ${#DEVICE_CODE}"

if [ -n "$DEVICE_CODE" ]; then
  echo; echo "== token polls with APP shape (JSON body), 5x =="
  for i in 1 2 3 4 5; do
    RESP=$(curl -s --max-time 30 -X POST \
      "$BASE?u=https%3A%2F%2Fwww.youtube.com%2Fo%2Foauth2%2Ftoken" \
      -H "content-type: application/json" \
      -d "{\"client_id\":\"$CLIENT_ID\",\"client_secret\":\"$CLIENT_SECRET\",\"code\":\"$DEVICE_CODE\",\"grant_type\":\"http://oauth.net/grant_type/device/1.0\"}")
    echo "poll $i: $(echo "$RESP" | tr '\n' ' ' | head -c 250)"
    sleep 5
  done
fi
