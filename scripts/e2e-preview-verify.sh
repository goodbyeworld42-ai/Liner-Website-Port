#!/bin/bash
# Single-call E2E verification of the Liner web port preview (dev server).
# Everything runs in ONE tool call because background processes spawned here
# are reaped when the call ends. Steps:
#   1. start dev server, wait ready
#   2. login with the test account
#   3. search "adele" -> results render
#   4. open first artist page -> not "artist not found"
#   5. settings -> YouTube -> Sign in -> device code appears
#   6. settings -> Interface -> Customization tab -> wallpaper + blur controls
set -u
AB="agent-browser"

echo "=== [0] start dev server ==="
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null; sleep 1
setsid bash -c 'exec bun run dev >> dev.log 2>&1' < /dev/null &
disown
for i in $(seq 1 40); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:3000/liner/index.html 2>/dev/null || echo 000)
  [ "$code" = "200" ] && break
  sleep 1
done
echo "dev ready: $code"

echo "=== [1] open app ==="
$AB close 2>/dev/null
$AB open "http://localhost:3000" || exit 1
sleep 4
$AB wait --load networkidle 2>/dev/null
$AB snapshot -i -c 2>&1 | head -25

echo "=== [2] login seekfromohio@gmail.com ==="
$AB find first "input[type=email], input[name=email], input[autocomplete*=email]" fill "seekfromohio@gmail.com" 2>&1 | tail -1
$AB find first "input[type=password]" fill "Yourgy88" 2>&1 | tail -1
$AB find first "button[type=submit]" click 2>&1 | tail -1
sleep 6
$AB wait --load networkidle 2>/dev/null
$AB get url
$AB snapshot -i -c 2>&1 | head -20

echo "=== [3] search adele ==="
$AB keyboard press "Slash" 2>/dev/null || true
$AB find first "input[type=text], input[type=search], input:not([type])" fill "adele" 2>&1 | tail -1
$AB press Enter 2>/dev/null || true
sleep 5
$AB snapshot -i -c 2>&1 | head -40
$AB screenshot /home/z/my-project/download/e2e-search-adele.png 2>&1 | tail -1

echo "=== [4] artist page ==="
$AB find text "Adele" click 2>&1 | tail -1
sleep 5
$AB snapshot -c 2>&1 | head -30
$AB screenshot /home/z/my-project/download/e2e-artist-page.png 2>&1 | tail -1

echo "=== [5] settings -> YouTube sign-in device code ==="
$AB eval "window.location.hash = '#/settings'" 2>&1 | tail -1
sleep 3
$AB find text "YouTube" click 2>&1 | tail -1
sleep 2
$AB find text "Sign in" click 2>&1 | tail -1
sleep 8
$AB snapshot -c 2>&1 | grep -Ei "[A-Z]{3,4}-[A-Z]{3,4}-[A-Z]{3,4}|code|google|device" | head -8
$AB screenshot /home/z/my-project/download/e2e-signin-devicecode.png 2>&1 | tail -1

echo "=== [6] customization tab ==="
$AB press Escape 2>/dev/null || true
sleep 1
$AB eval "window.location.hash = '#/settings'" 2>&1 | tail -1
sleep 2
$AB find text "Customization" click 2>&1 | tail -1
sleep 2
$AB snapshot -c 2>&1 | grep -Ei "wallpaper|blur|glow|opacity" | head -10
$AB screenshot /home/z/my-project/download/e2e-customization-tab.png 2>&1 | tail -1

echo "=== done ==="
