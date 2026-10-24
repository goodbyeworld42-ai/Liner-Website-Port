#!/bin/bash
# Re-test the TV device flow chain through the local proxy (as the SPA would)
set -e
BASE="http://localhost:3000/api/fetch"
UA="Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold (unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)"

echo "== 1. TV page =="
TV_PAGE=$(curl -s --max-time 30 -A "$UA" "$BASE?u=https%3A%2F%2Fwww.youtube.com%2Ftv")
SIZE=$(echo -n "$TV_PAGE" | wc -c)
echo "tv page bytes: $SIZE"
SCRIPT_PATH=$(echo "$TV_PAGE" | grep -oE '/s/_/kabuki/_/js/[^"'"'"'\\]+?m=base' | head -1)
if [ -z "$SCRIPT_PATH" ]; then
  echo "FAIL: base script not found. Page head:"
  echo "$TV_PAGE" | head -c 400
  exit 1
fi
echo "script path: $SCRIPT_PATH"

echo "== 2. Kabuki script =="
SCRIPT_URL="https://www.youtube.com$(echo "$SCRIPT_PATH" | sed 's/&amp;/\&/g')"
ENC=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$SCRIPT_URL")
SCRIPT=$(curl -s --max-time 60 -A "$UA" "$BASE?u=$ENC")
SSIZE=$(echo -n "$SCRIPT" | wc -c)
echo "script bytes: $SSIZE"
CREDS=$(echo "$SCRIPT" | grep -oE 'clientId:"[^"]+",[^"]*?:"[^"]+"' | head -1)
if [ -z "$CREDS" ]; then
  echo "FAIL: credentials not found in script"
  exit 1
fi
CLIENT_ID=$(echo "$CREDS" | sed -E 's/clientId:"([^"]+)".*/\1/')
CLIENT_SECRET=$(echo "$CREDS" | sed -E 's/clientId:"[^"]+",[^"]*?:"([^"]+)"/\1/')
echo "clientId: $CLIENT_ID"

echo "== 3. Device code =="
CODE_RESP=$(curl -s --max-time 30 -A "$UA" -X POST "$BASE?u=https%3A%2F%2Fwww.youtube.com%2Fo%2Foauth2%2Fdevice%2Fcode" \
  -H "content-type: application/x-www-form-urlencoded" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode "scope=https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube-paid-content" \
  --data-urlencode "device_id=3f7a2b−c1ab4b-173f009" \
  --data-urlencode "prompt=connect_sync")
echo "$CODE_RESP" | python3 -c "import json,sys;d=json.load(sys.stdin);print('device_code len:',len(d.get('device_code','')),'| user_code:',d.get('user_code'),'| interval:',d.get('interval'),'| err:',d.get('error'))"
DEVICE_CODE=$(echo "$CODE_RESP" | python3 -c "import json,sys;print(json.load(sys.stdin).get('device_code',''))")
if [ -z "$DEVICE_CODE" ]; then
  echo "FAIL: no device_code"
  exit 1
fi

echo "== 4. Token poll (expect authorization_pending) =="
TOKEN_RESP=$(curl -s --max-time 30 -A "$UA" -X POST "$BASE?u=https%3A%2F%2Fwww.youtube.com%2Fo%2Foauth2%2Ftoken" \
  -H "content-type: application/x-www-form-urlencoded" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode "code=$DEVICE_CODE" \
  --data-urlencode "grant_type=http://oauth.net/grant_type/device/1.0")
echo "token resp: $TOKEN_RESP"
