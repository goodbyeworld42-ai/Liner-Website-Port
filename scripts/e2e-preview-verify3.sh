#!/bin/bash
# Pass 3: search modal via sidebar search button -> results -> artist page.
set -u
AB="agent-browser"

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

$AB open "http://localhost:3000" 2>&1 | tail -1
sleep 4

echo "=== [1] click sidebar search button (JS) ==="
$AB eval "(() => { const nav=[...document.querySelectorAll('nav button, nav a, aside button, aside a')]; const b=nav.find(x=>(x.getAttribute('aria-pressed')!==null)||/search/i.test(x.getAttribute('aria-label')||x.textContent)); if(!b) return 'NO SEARCH BTN in ' + nav.length + ' nav items'; b.click(); return 'search clicked:' + b.tagName + ' pressed=' + b.getAttribute('aria-pressed'); })()" 2>&1 | tail -1
sleep 2
$AB snapshot -i -c 2>&1 | grep -iE "search|textbox|combobox" | head -6

echo "=== [2] type 'adele' ==="
$AB eval "(() => { const inp = document.querySelector('input[placeholder], input[type=\"text\"], input[type=\"search\"]'); if (!inp) return 'NO INPUT'; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(inp, 'adele'); inp.dispatchEvent(new Event('input', {bubbles:true})); inp.focus(); return 'typed:' + inp.value; })()" 2>&1 | tail -1
sleep 5
echo "--- results ---"
$AB snapshot -c 2>&1 | grep -iE "adele|hello|artist|tracks|top result" | head -12
$AB screenshot /home/z/my-project/download/e2e3-search-adele.png 2>&1 | tail -1

echo "=== [3] open artist page ==="
$AB eval "(() => { const els=[...document.querySelectorAll('button,a,[role=button],div[onclick],li,article')]; const el=els.find(e=>e.textContent.trim()==='Adele'); if(!el) return 'NO ARTIST LINK; samples: ' + els.slice(0,40).map(e=>e.textContent.trim().slice(0,20)).filter(Boolean).slice(0,10).join(' / '); el.click(); return 'clicked:' + el.tagName; })()" 2>&1 | tail -1
sleep 6
echo "--- artist page state (must NOT contain artist-not-found) ---"
$AB snapshot -c 2>&1 | grep -iE "not found|adele|monthly|popular|songs" | head -10
$AB get url
$AB screenshot /home/z/my-project/download/e2e3-artist-page.png 2>&1 | tail -1

echo "=== done ==="
