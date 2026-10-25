#!/bin/bash
# Diagnostic: play imported-playlist tracks (signed-in) and capture the failure point.
AB="agent-browser"
OUT=/home/z/my-project/download
mkdir -p "$OUT"

step() { echo; echo "=== $1 ==="; }

# jukebox of known playlists from worklog task 10:
JUJU="0e6cf0f3-96ff-4b74-a412-8cee4b1159e4"   # jujubotv (20 tracks)
ODETARI="67a67463-e481-4fea-9788-b7c8b695091c" # Odetari&ODECORE (29 tracks)

play_row() { # $1 = row index
  $AB eval "(() => { const rows = Array.from(document.querySelectorAll('div[role=button].group')).filter(x => x.querySelector('h3') && x.querySelector('img')); const r = rows[$1]; if (!r) return 'NO ROW $1'; r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 })); return 'clicked: ' + r.querySelector('h3').textContent.slice(0, 32) + ' / ' + (r.textContent.match(/([0-9]:[0-9]{2})/) || [''])[0]; })()"
}

audio_state() {
  $AB eval "(() => { const a = document.querySelector('#liner-audio') || document.querySelector('audio'); const barTitle = document.querySelector('span[aria-label=\"Open player\"]'); return JSON.stringify({ bar: barTitle ? barTitle.textContent.slice(0, 28) : '?', hasAudio: !!a, src: a ? (a.src || 'EMPTY').slice(0, 90) : null, paused: a ? a.paused : null, t: a ? +a.currentTime.toFixed(1) : null, readyState: a ? a.readyState : null, err: a && a.error ? a.error.code : null }); })()"
}

console_tail() {
  $AB console 2>&1 | tail -${1:-40}
}

$AB open about:blank > /dev/null 2>&1
$AB open "http://localhost:3000/#/library/playlist?id=$JUJU" > /dev/null 2>&1
$AB reload > /dev/null 2>&1
$AB wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 4
$AB console --clear > /dev/null 2>&1

step "playlist page state"
$AB eval "(() => { const t = document.body.innerText; return JSON.stringify({ isJuju: t.includes('jujubotv'), trackRows: document.querySelectorAll('div[role=button].group').length, sample: t.split('\\n').slice(0, 24).join(' | ').slice(0, 350) }); })()"

step "play row 0 (jujubotv)"
play_row 0
sleep 6
audio_state

step "console after first attempt"
console_tail 45

step "network failures seen in page (perf entries)"
$AB eval "(() => { const es = performance.getEntriesByType('resource').filter(e => /api\/(media|fetch|yt|sc)|googlevideo|sabr/.test(e.name)); return JSON.stringify(es.slice(-12).map(e => ({ u: e.name.slice(0, 110), s: e.responseStatus, ms: Math.round(e.duration) }))); })()"

step "play row 3 (skip deeper into playlist)"
play_row 3
sleep 6
audio_state

step "console tail 2"
console_tail 50

$AB screenshot "$OUT/e2e13-jujubotv-attempt.png" 2>&1 | tail -1
echo; echo DONE
