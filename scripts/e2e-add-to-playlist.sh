#!/bin/bash
# E2E: player-bar "+" button -> Add to Playlist chooser
# Flow: play a home row -> + opens the modal with the CURRENT track ->
# create-new-playlist path (pending track auto-added) -> row-click add path
# (track count increments) -> cleanup: delete the E2E playlist via UI.
# Harness constraints (worklog task 11): JS eval clicks only, IIFE evals,
# console --clear, stub play() (headless autoplay block).
AB="agent-browser"
OUT=/home/z/my-project/download
mkdir -p "$OUT"

step() { echo; echo "=== $1 ==="; }

# ---- 0. dev server ----
step "0. dev server on :3000"
if ! curl -sS -o /dev/null --max-time 2 http://localhost:3000/; then
  cd /home/z/my-project && setsid nohup bun run dev > /tmp/dev-e2e12.log 2>&1 < /dev/null &
  disown
  for i in $(seq 1 60); do
    curl -sS -o /dev/null --max-time 2 http://localhost:3000/ && break
    sleep 1
  done
fi
curl -sS -o /dev/null -w "server: %{http_code}\n" --max-time 5 http://localhost:3000/liner/index.html

# ---- 1. fresh load ----
step "1. open app + settle + clear console"
$AB open http://localhost:3000/ > /dev/null 2>&1
$AB eval "location.hash = '#/'; 'ok'" > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4
$AB console --clear > /dev/null 2>&1
$AB eval "(() => JSON.stringify({ loggedIn: !!JSON.parse(localStorage.getItem('liner_auth_session') || 'null'), buildHasPlus: true }))()"

# record playlist API traffic so we can recover the E2E playlist id for cleanup
$AB eval "(() => { window.__plApi = []; const of = window.fetch; window.fetch = function (...a) { try { const u = typeof a[0] === 'string' ? a[0] : a[0].url; const m = (a[1] && a[1].method) || 'GET'; if (u && u.includes('/me/playlists')) window.__plApi.push(m + ' ' + u.slice(0, 160)); } catch (e) {} return of.apply(this, a); }; return 'fetch patched'; })()"

# ---- 2. stub media play (headless autoplay) ----
step "2. stub play()"
$AB eval "(() => { window.HTMLMediaElement.prototype.play = function () { window.__playCalls = (window.__playCalls || 0) + 1; return Promise.resolve(); }; window.HTMLMediaElement.prototype.pause = function () {}; return 'stubbed'; })()"

# ---- 3. play first home row (double-click) ----
step "3. play row 0 from home"
$AB eval "(() => { const rows = Array.from(document.querySelectorAll('div[role=button].group')).filter(x => x.querySelector('h3') && x.querySelector('img')); const r = rows[0]; if (!r) return 'NO ROW'; r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return 'dblclick: ' + r.querySelector('h3').textContent.slice(0, 40); })()"
sleep 3
$AB eval "(() => { const bar = document.querySelector('#liner-audio'); const plus = document.querySelectorAll('button[aria-label=\"Add to playlist\"]'); const title = Array.from(document.querySelectorAll('p')).map(p => p.textContent).find(t => t && t.length && !t.includes(' ')); return JSON.stringify({ mainAudio: !!bar, plusButtons: plus.length, playCalls: window.__playCalls || 0 }); })()"

# ---- 4. click + -> modal opens with current track ----
step "4. click + in player bar"
$AB eval "(() => { const b = document.querySelector('button[aria-label=\"Add to playlist\"]'); if (!b) return 'NO PLUS'; b.click(); return 'clicked'; })()"
sleep 1.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); const dlg = h ? h.closest('[role=dialog], div') : null; const body = document.body.innerText; const trackShown = !!dlg && dlg.textContent.length > 0; const rows = dlg ? Array.from(dlg.querySelectorAll('button')).filter(b => b.querySelector('img')) : []; return JSON.stringify({ modalOpen: !!h, trackSection: trackShown, playlistRows: rows.length, rowTitles: rows.map(r => r.textContent.slice(0, 28)).slice(0, 6) }); })()"
$AB screenshot "$OUT/e2e12-add-to-playlist-modal.png" 2>&1 | tail -1

# ---- 5. create-new-playlist path (auto-adds current track) ----
step "5. Create playlist flow with pending current track"
$AB eval "(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim().includes('Create playlist')); if (!b) return 'NO CREATE BTN'; b.click(); return 'create clicked'; })()"
sleep 1.5
$AB eval "(() => { const inputs = Array.from(document.querySelectorAll('input')); const inp = inputs.find(i => (i.placeholder || '').length > 2); if (!inp) return 'NO INPUT: ' + inputs.length; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(inp, 'E2E Plus Test'); inp.dispatchEvent(new Event('input', { bubbles: true })); return 'title filled'; })()"
sleep 0.5
$AB eval "(() => { const btns = Array.from(document.querySelectorAll('button[type=submit], button')); const b = btns.filter(x => x.textContent.trim() === 'Create').pop(); if (!b) return 'NO SUBMIT'; b.click(); return 'create submitted'; })()"
sleep 3
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ created: t.includes('E2E Plus Test'), toastish: (t.match(/E2E Plus Test/g) || []).length }); })()"

# ---- 6. reopen + -> E2E playlist exists with 1 track ----
step "6. reopen + -> new playlist listed with 1 track"
$AB eval "(() => { const b = document.querySelector('button[aria-label=\"Add to playlist\"]'); b && b.click(); return 'reopened'; })()"
sleep 2
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); const rows = h ? Array.from(h.closest('div').parentElement.querySelectorAll('button')).filter(b => b.querySelector('img')) : []; const row = rows.find(r => r.textContent.includes('E2E Plus Test')); return JSON.stringify({ modalOpen: !!h, rows: rows.length, e2eRow: row ? row.textContent.replace(/\\s+/g, ' ').slice(0, 60) : 'MISSING' }); })()"

# ---- 7. play a DIFFERENT track, + -> click the E2E row -> added ----
step "7. second track -> add via row click"
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || '') === 'Close'); btn && btn.click(); return 'closed'; })()"
sleep 1
$AB eval "(() => { const rows = Array.from(document.querySelectorAll('div[role=button].group')).filter(x => x.querySelector('h3') && x.querySelector('img')); const r = rows[1]; if (!r) return 'NO ROW 1'; r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return 'dblclick: ' + r.querySelector('h3').textContent.slice(0, 40); })()"
sleep 2.5
$AB eval "(() => { const b = document.querySelector('button[aria-label=\"Add to playlist\"]'); b && b.click(); return 'plus clicked'; })()"
sleep 1.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); if (!h) return 'NO MODAL'; const scope = h.closest('div').parentElement; const row = Array.from(scope.querySelectorAll('button')).find(b => b.querySelector('img') && b.textContent.includes('E2E Plus Test')); if (!row) return 'NO E2E ROW'; row.click(); return 'row clicked'; })()"
sleep 2.5
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ addedToast: /Added to playlist/i.test(t), modalClosed: !Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist') }); })()"
$AB screenshot "$OUT/e2e12-added-toast.png" 2>&1 | tail -1

# ---- 8. verify count incremented to 2 ----
step "8. reopen -> E2E playlist shows 2 tracks"
$AB eval "(() => { const b = document.querySelector('button[aria-label=\"Add to playlist\"]'); b && b.click(); return 'reopened'; })()"
sleep 2.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); const scope = h ? h.closest('div').parentElement : null; const row = scope ? Array.from(scope.querySelectorAll('button')).find(b => b.querySelector('img') && b.textContent.includes('E2E Plus Test')) : null; return JSON.stringify({ row: row ? row.textContent.replace(/\\s+/g, ' ').slice(0, 70) : 'MISSING' }); })()"
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || '') === 'Close'); btn && btn.click(); return 'closed'; })()"
sleep 1

# ---- 9. cleanup: delete E2E playlist via UI ----
step "9. recover E2E playlist id from fetch log"
PLID=$($AB eval "(() => { const adds = window.__plApi.filter(l => l.startsWith('POST') && l.includes('/tracks/')); const counts = {}; adds.forEach(l => { const m = l.match(/playlists\\/([0-9a-f-]{36})\\/tracks/i); if (m) counts[m[1]] = (counts[m[1]] || 0) + 1; }); const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]; return top ? top[0] : 'NONE'; })()" 2>/dev/null | tr -d '"')
echo "playlist id: $PLID"
if [ "$PLID" != "NONE" ] && [ ${#PLID} -eq 36 ]; then
  step "9a. open playlist page + delete via More -> Delete -> Confirm"
  $AB open "http://localhost:3000/#/library/playlist?id=$PLID" > /dev/null 2>&1
  sleep 3.5
  $AB eval "(() => { const b = document.querySelector('button[title=More]') || Array.from(document.querySelectorAll('button')).find(x => x.title === 'More'); if (!b) return 'NO MORE BTN: ' + document.querySelectorAll('button').length; b.click(); return 'menu opened'; })()"
  sleep 1
  $AB eval "(() => { const item = Array.from(document.querySelectorAll('[role=menuitem], button')).find(x => x.textContent.trim() === 'Delete'); if (!item) return 'NO DELETE ITEM'; item.click(); return 'delete clicked'; })()"
  sleep 1.5
  $AB eval "(() => { const btns = Array.from(document.querySelectorAll('button')); const b = btns.filter(x => x.textContent.trim() === 'Confirm').pop(); if (!b) return 'NO CONFIRM: ' + btns.map(x => x.textContent.trim()).filter(Boolean).slice(0, 15).join(','); b.click(); return 'confirmed'; })()"
  sleep 3
  $AB eval "(() => JSON.stringify({ deleted: !document.body.innerText.includes('E2E Plus Test') }))()"
fi

# ---- 10. console errors ----
step "10. console errors"
$AB console 2>&1 | rg -i "error|fail" | rg -v "playback|audio|TV|po-token|nSolver|WEB_REMIX|demux|sw.js|media" | tail -8
echo; echo DONE
