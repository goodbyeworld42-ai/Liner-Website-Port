#!/bin/bash
# E2E part 2: successful row-click add + verified count bump + UI cleanup.
# Lesson from part 1: toast close buttons share aria-label="Close" with the
# dialog — always scope close clicks to the dialog container.
AB="agent-browser"
OUT=/home/z/my-project/download
PLID="ed4fec63-4356-48b5-9f47-bc9f8adebf37" # E2E Plus Test (from part 1)

step() { echo; echo "=== $1 ==="; }

close_modal() {
  $AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); if (!h) return 'no modal'; let dlg = h.closest('[role=dialog]') || h.closest('div[class*=dialog]') || h.parentElement; for (let up = 0; up < 6 && dlg; up++) { const c = dlg.querySelector('button[aria-label=Close]'); if (c) { c.click(); return 'dialog close clicked'; } dlg = dlg.parentElement; } const btn = document.querySelector('button[aria-label=Close]'); btn && btn.click(); return 'fallback close'; })()"
  sleep 1.2
}

# ---- 1. fresh reload, stub, play a mainstream row not in the E2E playlist ----
step "1. fresh state"
$AB open about:blank > /dev/null 2>&1
$AB open http://localhost:3000/#/ > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4
$AB console --clear > /dev/null 2>&1
$AB eval "(() => { window.__plApi = []; const of = window.fetch; window.fetch = function (...a) { try { const u = typeof a[0] === 'string' ? a[0] : a[0].url; const m = (a[1] && a[1].method) || 'GET'; if (u && u.includes('/me/playlists')) window.__plApi.push(m + ' ' + u.slice(0, 160)); } catch (e) {} return of.apply(this, a); }; window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }; window.HTMLMediaElement.prototype.pause = function () {}; return 'patched'; })()"

step "2. play row 2 (Earrings) via dblclick"
$AB eval "(() => { const rows = Array.from(document.querySelectorAll('div[role=button].group')).filter(x => x.querySelector('h3') && x.querySelector('img')); const r = rows[2]; if (!r) return 'NO ROW'; r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return 'dblclick: ' + r.querySelector('h3').textContent.slice(0, 30); })()"
sleep 3
$AB eval "(() => JSON.stringify({ plus: !!document.querySelector('button[aria-label=\"Add to playlist\"]'), playCalls: window.__playCalls || 0 }))()"

# ---- 3. + -> click E2E row -> expect SUCCESS toast + modal closes ----
step "3. add current track via row click (success path)"
$AB eval "(() => { document.querySelector('button[aria-label=\"Add to playlist\"]').click(); return 'plus'; })()"
sleep 1.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); if (!h) return 'NO MODAL'; const scope = h.closest('div').parentElement; const row = Array.from(scope.querySelectorAll('button')).find(b => b.querySelector('img') && b.textContent.includes('E2E Plus Test')); if (!row) return 'NO ROW'; row.click(); return 'row clicked'; })()"
sleep 2.5
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ successToast: /Added to playlist/i.test(t), modalClosed: !Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist') }); })()"
$AB screenshot "$OUT/e2e12-added-success.png" 2>&1 | tail -1

# ---- 4. reopen -> row shows 2 tracks ----
step "4. count bumped to 2"
$AB eval "(() => { document.querySelector('button[aria-label=\"Add to playlist\"]').click(); return 'plus'; })()"
sleep 2.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); const scope = h ? h.closest('div').parentElement : null; const row = scope ? Array.from(scope.querySelectorAll('button')).find(b => b.querySelector('img') && b.textContent.includes('E2E Plus Test')) : null; return JSON.stringify({ row: row ? row.textContent.replace(/\\s+/g, ' ').slice(0, 60) : 'MISSING' }); })()"
$AB eval "(() => { const adds = window.__plApi.filter(l => l.startsWith('POST') && l.includes('/tracks/')).map(l => l.slice(0, 90)); return JSON.stringify(adds); })()"
close_modal

# ---- 5. cleanup: delete E2E playlist (fresh reload kills stale toasts) ----
step "5. delete E2E playlist via playlist page"
$AB open about:blank > /dev/null 2>&1
$AB open "http://localhost:3000/#/library/playlist?id=$PLID" > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4
$AB eval "(() => JSON.stringify({ page: document.body.innerText.includes('E2E Plus Test'), titled: Array.from(document.querySelectorAll('button')).map(b => b.title).filter(Boolean).slice(0, 12) }))()"
$AB eval "(() => { const b = document.querySelector('button[title=More]'); if (!b) return 'NO MORE'; b.click(); return 'menu open'; })()"
sleep 1
$AB eval "(() => { const item = Array.from(document.querySelectorAll('[role=menuitem], button')).find(x => x.textContent.trim() === 'Delete'); if (!item) return 'NO DELETE'; item.click(); return 'delete clicked'; })()"
sleep 1.5
$AB eval "(() => { const b = Array.from(document.querySelectorAll('button')).filter(x => x.textContent.trim() === 'Confirm').pop(); if (!b) return 'NO CONFIRM'; b.click(); return 'confirmed'; })()"
sleep 3
$AB eval "(() => JSON.stringify({ goneFromPage: !document.body.innerText.includes('E2E Plus Test'), toast: /deleted|Deleted/i.test(document.body.innerText) }))()"

# ---- 6. final: verify via fresh + modal that the playlist vanished ----
step "6. verify deleted in add-to-playlist list"
$AB open about:blank > /dev/null 2>&1
$AB open http://localhost:3000/#/ > /dev/null 2>&1
$AB reload > /dev/null 2>&1
sleep 4
$AB eval "(() => { document.querySelector('button[aria-label=\"Add to playlist\"]').click(); return 'plus'; })()"
sleep 2
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ e2ePlaylistGone: !t.includes('E2E Plus Test'), realPlaylists: ['Odetari&ODECORE', 'jujubotv'].map(n => t.includes(n)) }); })()"
close_modal

step "7. console errors"
$AB console 2>&1 | rg -i "error|fail" | rg -v "playback|audio|TV|po-token|nSolver|WEB_REMIX|demux|sw.js|media|sign-in" | tail -6
echo; echo DONE
