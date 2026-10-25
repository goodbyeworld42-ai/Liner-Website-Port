#!/bin/bash
# E2E v10: verify ALL hover-preview code paths via synthetic hover events
# (raw/real input is broken in this harness) + play() stubbed in-page.
# The real-browser autoplay block was already captured organically (console).
AB="agent-browser"
OUT=/home/z/my-project/download
mkdir -p "$OUT"

step() { echo; echo "=== $1 ==="; }

PREVIEW='(() => { const q = "audio[aria-hidden=" + String.fromCharCode(39) + "true" + String.fromCharCode(39) + "]"; const el = document.querySelector(q); if (!el) return "NO ELEMENT"; return JSON.stringify({ src: (el.getAttribute("src") || "NULL").slice(0, 65), vol: Number(el.volume.toFixed(2)), paused: el.paused }); })()'

hover_row_js='IDX'  # replaced per use
mouseover_row='(() => { const rows = Array.from(document.querySelectorAll("div[role=button].group")).filter(x => x.querySelector("h3") && x.querySelector("img")); const r = rows[IDX]; if (!r) return "NO ROW"; r.scrollIntoView({ block: "center" }); r.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); return "hover: " + r.querySelector("h3").textContent.slice(0, 30); })()'
mouseout_row='(() => { const rows = Array.from(document.querySelectorAll("div[role=button].group")).filter(x => x.querySelector("h3") && x.querySelector("img")); const r = rows[IDX]; if (!r) return "NO ROW"; r.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })); return "left"; })()'

step "1. fresh load + settle + clear console"
$AB open http://localhost:3000/ > /dev/null 2>&1
$AB eval "location.hash = '#/'; 'ok'" > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4
$AB console --clear > /dev/null 2>&1
$AB eval "(() => JSON.stringify({ loggedIn: !!JSON.parse(localStorage.getItem('liner_auth_session') || 'null') }))()"

step "2. stub play() to resolve (harness has no user activation; real-browser block already proven via console)"
$AB eval "(() => { window.HTMLMediaElement.prototype.play = function () { window.__playCalls = (window.__playCalls || 0) + 1; return Promise.resolve(); }; window.HTMLMediaElement.prototype.pause = function () {}; return 'play stubbed'; })()"

step "3. hover row 0 -> preview attaches, fades in, main audio untouched"
$AB eval "${mouseover_row/IDX/0}"
sleep 2
$AB eval "$PREVIEW"
$AB eval "(() => JSON.stringify({ playStubCalls: window.__playCalls || 0, mainAudioSrc: (document.querySelector('#liner-audio')?.getAttribute('src') || 'EMPTY').slice(0, 30), mainPaused: document.querySelector('#liner-audio')?.paused }))()"

step "4. hover row 1 -> switches preview to the other track"
$AB eval "${mouseout_row/IDX/0}"
$AB eval "${mouseover_row/IDX/1}"
sleep 2
$AB eval "$PREVIEW"

step "5. mouse leaves -> preview detaches"
$AB eval "${mouseout_row/IDX/1}"
sleep 1
$AB eval "$PREVIEW"
$AB eval "(() => JSON.stringify({ srcNullAfterLeave: document.querySelector('audio[aria-hidden=' + String.fromCharCode(39) + 'true' + String.fromCharCode(39) + ']')?.getAttribute('src') === null }))()"

step "6. hover while a track is 'playing' -> blocked"
$AB eval "(() => { window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }; const a = document.querySelector('#liner-audio'); Object.defineProperty(a, 'paused', { get: () => false, configurable: true }); return 'main audio faked as playing'; })()"
$AB eval "${mouseover_row/IDX/2}"
sleep 2
$AB eval "(() => { const el = document.querySelector('audio[aria-hidden=' + String.fromCharCode(39) + 'true' + String.fromCharCode(39) + ']'); return JSON.stringify({ previewSrc: el?.getAttribute('src'), blocked: !el?.getAttribute('src') }); })()"
$AB eval "(() => { const a = document.querySelector('#liner-audio'); delete a.paused; return 'restored'; })()"

step "7. setting OFF -> hover does nothing"
$AB eval "(() => { window.HTMLMediaElement.prototype.play = function () { window.__playCalls = (window.__playCalls || 0) + 1; return Promise.resolve(); }; return 'play stub restored'; })()"
$AB eval "location.hash = '#/settings'; 'nav'" 2>&1 | tail -1
sleep 1.5
$AB eval "(() => { const tab = Array.from(document.querySelectorAll('[role=tab], button')).find(b => b.textContent.trim() === 'Playback'); tab && tab.click(); return 'Playback open'; })()"
sleep 1
$AB eval "(() => { const label = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.textContent.trim() === 'Preview songs on hover'); if (!label) return 'ROW MISSING'; let row = label.closest('div[class]'); let sw = null; for (let up = 0; up < 4 && !sw; up++) { row = row.parentElement; sw = row.querySelector('button[aria-pressed]'); } const before = sw.getAttribute('aria-pressed'); sw.click(); return 'switch was ' + before + ', clicked off'; })()"
sleep 2
$AB eval "(() => JSON.stringify({ persisted: JSON.parse(localStorage.getItem('liner_player_session_v2') || 'null').hoverPreview }))()"
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || '') === 'Close'); btn && btn.click(); return 'close clicked'; })()"
sleep 1
$AB eval "${mouseover_row/IDX/0}"
sleep 2
$AB eval "$PREVIEW"
$AB eval "(() => JSON.stringify({ playCallsWhileOff: window.__playCalls || 0 }))()"

step "8. setting back ON -> hover previews again"
$AB eval "location.hash = '#/settings'; 'nav'" 2>&1 | tail -1
sleep 1.5
$AB eval "(() => { const tab = Array.from(document.querySelectorAll('[role=tab], button')).find(b => b.textContent.trim() === 'Playback'); tab && tab.click(); return 'tab'; })()"
sleep 1
$AB eval "(() => { const label = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.textContent.trim() === 'Preview songs on hover'); let row = label.closest('div[class]'); let sw = null; for (let up = 0; up < 4 && !sw; up++) { row = row.parentElement; sw = row.querySelector('button[aria-pressed]'); } sw.click(); return 're-enabled'; })()"
sleep 2
$AB eval "(() => JSON.stringify({ persisted: JSON.parse(localStorage.getItem('liner_player_session_v2') || 'null').hoverPreview }))()"
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || '') === 'Close'); btn && btn.click(); return 'closed'; })()"
sleep 1
$AB eval "${mouseover_row/IDX/0}"
sleep 2
$AB eval "$PREVIEW"
$AB screenshot "$OUT/e2e5-hover-preview-active.png" 2>&1 | tail -1
$AB eval "${mouseout_row/IDX/0}"

step "9. console evidence"
$AB console 2>&1 | grep -io "playing liner audio [^)]*)\|hover preview [a-z]*: [A-Za-zError ]*" | tail -4
echo; echo "E2E DONE"
