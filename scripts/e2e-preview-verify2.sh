#!/bin/bash
# Focused pass 2: search -> artist page -> YouTube sign-in code -> customization.
# Uses JS-eval clicks (agent-browser mouse input never reaches the modal —
# known harness trap documented in worklog Task 5/7).
set -u
AB="agent-browser"

# dev server may be dead (reaped between tool calls) — ensure alive
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:3000/liner/index.html 2>/dev/null || echo 000)
if [ "$code" != "200" ]; then
  cd /home/z/my-project
  pkill -f "next dev" 2>/dev/null; sleep 1
  setsid bash -c 'exec bun run dev >> dev.log 2>&1' < /dev/null &
  disown
  for i in $(seq 1 40); do
    code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:3000/liner/index.html 2>/dev/null || echo 000)
    [ "$code" = "200" ] && break
    sleep 1
  done
fi
echo "dev ready: $code"

# browser may also be gone; reopen
$AB open "http://localhost:3000" 2>&1 | tail -1
sleep 4

echo "=== [1] open search modal via hash/shortcut ==="
$AB eval "(() => { const ev = new KeyboardEvent('keydown', {key:'/', code:'Slash', bubbles:true}); document.activeElement && document.activeElement.dispatchEvent(ev); return 'dispatched'; })()" 2>&1 | tail -1
sleep 1
$AB snapshot -i -c 2>&1 | grep -iE "search|textbox" | head -5

echo "=== [2] type query into search input ==="
$AB eval "(() => { const inp = document.querySelector('input[type=\"text\"], input[type=\"search\"], input:not([type=password]):not([type=email])'); if (!inp) return 'NO INPUT'; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(inp, 'adele'); inp.dispatchEvent(new Event('input', {bubbles:true})); inp.focus(); return 'typed:' + inp.value; })()" 2>&1 | tail -1
sleep 4
$AB snapshot -c 2>&1 | grep -iE "adele" | head -10
$AB screenshot /home/z/my-project/download/e2e2-search-results.png 2>&1 | tail -1

echo "=== [3] click artist Adele via JS ==="
$AB eval "(() => { const els = [...document.querySelectorAll('button,a,[role=button],div[onclick]')]; const el = els.find(e => e.textContent.trim() === 'Adele' || e.textContent.trim().startsWith('Adele')); if (!el) return 'ARTIST NOT IN LIST'; el.click(); return 'clicked:' + el.tagName; })()" 2>&1 | tail -1
sleep 5
echo "--- artist page check (expect artist name heading, NOT 'not found') ---"
$AB snapshot -c 2>&1 | grep -iE "not found|adele|monthly|songs|albums" | head -10
$AB get url
$AB screenshot /home/z/my-project/download/e2e2-artist-page.png 2>&1 | tail -1

echo "=== [4] settings -> YouTube -> Sign in ==="
$AB eval "window.location.hash = '#/settings'" 2>&1 | tail -1
sleep 2
$AB eval "(() => { const tabs=[...document.querySelectorAll('button,[role=tab],[role=menuitem]')]; const t=tabs.find(b=>b.textContent.trim().toLowerCase()==='youtube'||b.textContent.trim().toLowerCase().includes('youtube')); if(!t) return 'NO YT TAB: ' + tabs.map(b=>b.textContent.trim()).filter(Boolean).slice(0,12).join('|'); t.click(); return 'yt tab clicked'; })()" 2>&1 | tail -1
sleep 2
$AB eval "(() => { const btns=[...document.querySelectorAll('button')]; const b=btns.find(x=>/sign in/i.test(x.textContent)); if(!b) return 'NO SIGNIN BTN: ' + btns.map(x=>x.textContent.trim()).filter(Boolean).slice(0,15).join('|'); b.click(); return 'signin clicked'; })()" 2>&1 | tail -1
sleep 10
echo "--- device code check ---"
$AB snapshot -c 2>&1 | grep -oE "[A-Z]{3,4}-[A-Z]{3,4}-[A-Z]{3,4}" | head -3
$AB snapshot -c 2>&1 | grep -iE "google.com/device|enter the code|scan" | head -4
$AB screenshot /home/z/my-project/download/e2e2-signin-devicecode.png 2>&1 | tail -1

echo "=== [5] customization tab ==="
$AB eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().toLowerCase()==='customization'||x.textContent.trim().toLowerCase().includes('customization')); if(!b) return 'NO CUSTOM TAB'; b.click(); return 'custom clicked'; })()" 2>&1 | tail -1
sleep 3
$AB snapshot -c 2>&1 | grep -iE "wallpaper|blur|glow|opacity|reset" | head -12
$AB screenshot /home/z/my-project/download/e2e2-customization.png 2>&1 | tail -1

echo "=== done ==="
