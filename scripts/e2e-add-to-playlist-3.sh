#!/bin/bash
# E2E part 3: real play via click(detail=2) -> SUCCESS add -> count 2 -> cleanup.
AB="agent-browser"
OUT=/home/z/my-project/download
PLID="ed4fec63-4356-48b5-9f47-bc9f8adebf37" # E2E Plus Test

step() { echo; echo "=== $1 ==="; }

# ---- 1. fresh ----
step "1. fresh load + patches"
$AB open about:blank > /dev/null 2>&1
$AB open http://localhost:3000/#/ > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4
$AB console --clear > /dev/null 2>&1
$AB eval "(() => { window.__plApi = []; const of = window.fetch; window.fetch = function (...a) { try { const u = typeof a[0] === 'string' ? a[0] : a[0].url; const m = (a[1] && a[1].method) || 'GET'; if (u && u.includes('/me/playlists')) window.__plApi.push(m + ' ' + u.slice(0, 120)); } catch (e) {} return of.apply(this, a); }; window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }; window.HTMLMediaElement.prototype.pause = function () {}; return 'patched'; })()"

# ---- 2. real double-click emulation: click with detail=2 ----
step "2. play row 2 via click(detail=2)"
$AB eval "(() => { const rows = Array.from(document.querySelectorAll('div[role=button].group')).filter(x => x.querySelector('h3') && x.querySelector('img')); const r = rows[2]; if (!r) return 'NO ROW'; r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 })); return 'clicked: ' + r.querySelector('h3').textContent.slice(0, 30); })()"
sleep 3.5
$AB eval "(() => { const t = document.querySelector('span[aria-label=\"Open player\"]'); return JSON.stringify({ barTitle: t ? t.textContent.slice(0, 30) : 'NO BAR', plus: !!document.querySelector('button[aria-label=\"Add to playlist\"]') }); })()"

# ---- 3. + -> E2E row -> expect SUCCESS ----
step "3. add via row click (success path)"
$AB eval "(() => { document.querySelector('button[aria-label=\"Add to playlist\"]').click(); return 'plus'; })()"
sleep 1.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); if (!h) return 'NO MODAL'; const scope = h.closest('div').parentElement; const row = Array.from(scope.querySelectorAll('button')).find(b => b.querySelector('img') && b.textContent.includes('E2E Plus Test')); if (!row) return 'NO ROW'; row.click(); return 'row clicked'; })()"
sleep 2.5
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ successToast: /Added to playlist/i.test(t), modalClosed: !Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist') }); })()"
$AB screenshot "$OUT/e2e12-success-toast.png" 2>&1 | tail -1

# ---- 4. verify count = 2 ----
step "4. reopen -> 2 tracks"
$AB eval "(() => { document.querySelector('button[aria-label=\"Add to playlist\"]').click(); return 'plus'; })()"
sleep 2.5
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); const scope = h ? h.closest('div').parentElement : null; const row = scope ? Array.from(scope.querySelectorAll('button')).find(b => b.querySelector('img') && b.textContent.includes('E2E Plus Test')) : null; return JSON.stringify({ row: row ? row.textContent.replace(/\\s+/g, ' ').slice(0, 60) : 'MISSING', posts: window.__plApi.filter(l => l.startsWith('POST')).length }); })()"
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); if (!h) return 'no modal'; let dlg = h.closest('[role=dialog]') || h.parentElement; for (let up = 0; up < 6 && dlg; up++) { const c = dlg.querySelector('button[aria-label=Close]'); if (c) { c.click(); return 'closed'; } dlg = dlg.parentElement; } return 'no close'; })()"
sleep 1

# ---- 5. cleanup: playlist page, discover More trigger empirically ----
step "5. open playlist page for delete"
$AB open about:blank > /dev/null 2>&1
$AB open "http://localhost:3000/#/library/playlist?id=$PLID" > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4.5
$AB eval "(() => JSON.stringify({ onPlaylistPage: document.body.innerText.includes('E2E Plus Test'), btnDump: Array.from(document.querySelectorAll('button')).map(b => JSON.stringify({ t: (b.textContent || '').trim().slice(0, 18), ti: b.title || undefined, a: b.getAttribute('aria-label') || undefined })).slice(0, 18) }))()"
$AB screenshot "$OUT/e2e12-playlist-page.png" 2>&1 | tail -1

step "5a. More -> Delete -> Confirm"
$AB eval "(() => { const b = document.querySelector('[title=More]') || Array.from(document.querySelectorAll('button')).find(x => (x.getAttribute('aria-label') || '') === 'More' || x.title === 'More'); if (!b) return 'NO MORE ANYWHERE'; b.click(); return 'menu open'; })()"
sleep 1
$AB eval "(() => { const item = Array.from(document.querySelectorAll('[role=menuitem], button')).find(x => x.textContent.trim() === 'Delete'); if (!item) return 'NO DELETE: ' + Array.from(document.querySelectorAll('[role=menuitem]')).map(x => x.textContent.trim()).join(','); item.click(); return 'delete clicked'; })()"
sleep 1.5
$AB eval "(() => { const b = Array.from(document.querySelectorAll('button')).filter(x => x.textContent.trim() === 'Confirm').pop(); if (!b) return 'NO CONFIRM'; b.click(); return 'confirmed'; })()"
sleep 3
$AB eval "(() => JSON.stringify({ goneFromPage: !document.body.innerText.includes('E2E Plus Test') }))()"

# ---- 6. final verify: fresh app, + modal must not list E2E playlist ----
step "6. final verify + console"
$AB open about:blank > /dev/null 2>&1
$AB open http://localhost:3000/#/ > /dev/null 2>&1
$AB reload > /dev/null 2>&1
sleep 4
$AB eval "(() => { const b = document.querySelector('button[aria-label=\"Add to playlist\"]'); if (!b) return 'NO PLUS'; b.click(); return 'plus'; })()"
sleep 2
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ e2eGone: !t.includes('E2E Plus Test'), realOnes: [t.includes('Odetari&ODECORE'), t.includes('jujubotv')] }); })()"
$AB eval "(() => { const h = Array.from(document.querySelectorAll('h2')).find(x => x.textContent === 'Add to playlist'); if (!h) return 'no modal'; let dlg = h.closest('[role=dialog]') || h.parentElement; for (let up = 0; up < 6 && dlg; up++) { const c = dlg.querySelector('button[aria-label=Close]'); if (c) { c.click(); return 'closed'; } dlg = dlg.parentElement; } return 'no close'; })()"
$AB console 2>&1 | rg -i "error|fail" | rg -v "playback|audio|TV|po-token|nSolver|WEB_REMIX|demux|sw.js|media|sign-in" | tail -5
echo; echo DONE
