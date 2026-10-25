#!/bin/bash
# Reproduce "spotify playlist and youtube playlist songs dont play":
# import both via the real UI, play, capture audio/console/network evidence.
AB="agent-browser"
OUT=/home/z/my-project/download
mkdir -p "$OUT"

poll_eval() { # poll_eval <js-that-returns-true-when-done> <max-tries> <label>
  local js="$1" max="$2" label="$3" i=0
  while [ $i -lt "$max" ]; do
    r=$($AB eval "$js" 2>/dev/null | tail -1)
    if [ "$r" = "true" ]; then echo "[$label] done after $((i)) polls"; return 0; fi
    sleep 2; i=$((i+1))
  done
  echo "[$label] TIMEOUT ($r)"; return 1
}

echo "=== 0. fresh load + session ==="
$AB open http://localhost:3000/ 2>&1 | tail -1
$AB wait --load networkidle --timeout 20000 2>&1 | tail -1
$AB eval "location.hash='#/'; JSON.parse(localStorage.getItem('liner_auth_session')||'null')?.user?.username || 'NO_SESSION'" 2>&1 | tail -1

echo "=== 1. SPOTIFY import (Adele 21 album, 11 tracks) ==="
$AB eval "location.hash='#/library'; 'nav'" 2>&1 | tail -1
$AB wait 1200 2>&1 | tail -1
$AB eval "(() => { const b=document.querySelector('button[title=\"Create playlist\"]'); if(!b) return 'NO_BTN'; b.click(); return 'modal'; })()" 2>&1 | tail -1
$AB wait 700 2>&1 | tail -1
$AB eval "(() => { const t=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Import'); if(!t) return 'NO_TAB'; t.click(); return 'import-tab'; })()" 2>&1 | tail -1
$AB wait 400 2>&1 | tail -1
$AB eval "(() => { const inp=document.querySelector('input[placeholder*=\"ink\" i]'); if(!inp) return 'NO_INPUT'; const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(inp,'https://open.spotify.com/album/0Lg1uZvI312TPqxNWShFXL'); inp.dispatchEvent(new Event('input',{bubbles:true})); return 'url-set'; })()" 2>&1 | tail -1
$AB eval "(() => { const dlg=document.querySelector('[role=dialog]'); const btn=dlg&&Array.from(dlg.querySelectorAll('button')).find(b=>b.textContent.trim()==='Import'); if(!btn) return 'NO_SUBMIT'; btn.click(); return 'import-started'; })()" 2>&1 | tail -1
poll_eval "document.body.innerText.includes('Imported') || !document.querySelector('[role=dialog]') && Array.from(document.querySelectorAll('[data-testid]')).some(e=>e.dataset.testid&&e.dataset.testid.includes('importing')) === false && document.body.innerText.includes('21')" 90 "spotify-import"

echo "=== 2. open the imported playlist ==="
$AB eval "(() => { const card=Array.from(document.querySelectorAll('a,button,[role=button]')).find(e=>/Imported Spotify album|^(21|Imported)/.test(e.textContent.trim()) && e.textContent.length<80); if(!card) return 'NO_CARD: '+document.body.innerText.slice(0,200); card.click(); return 'opened'; })()" 2>&1 | tail -1
$AB wait 1500 2>&1 | tail -1
$AB eval "JSON.stringify({hash: location.hash, hasPlay: !!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Play'), rows: document.body.innerText.match(/\\d+ songs|\\d+ tracks/)?.[0]})" 2>&1 | tail -1

echo "=== 3. play first track (spotify-imported playlist) ==="
: > /tmp/console-before.txt
$AB eval "window.__errs=[]; window.addEventListener('error',e=>window.__errs.push(String(e.message))); 'listening'" 2>&1 | tail -1
$AB eval "(() => { const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Play'); if(!b) return 'NO_PLAY'; b.click(); return 'play-clicked'; })()" 2>&1 | tail -1
$AB wait 3000 2>&1 | tail -1
$AB eval "(() => { const a=document.querySelector('audio'); return JSON.stringify({hasAudio: !!a, src: a ? a.src.slice(0,90) : null, paused: a ? a.paused : null, t: a ? a.currentTime.toFixed(2) : null, errs: window.__errs||[], bodyHasUnavailable: document.body.innerText.includes('Track unavailable'), bodyHasSignin: /sign in to youtube/i.test(document.body.innerText)}); })()" 2>&1 | tail -1
$AB wait 4000 2>&1 | tail -1
$AB eval "(() => { const a=document.querySelector('audio'); return JSON.stringify({paused: a ? a.paused : null, t: a ? a.currentTime.toFixed(2) : null, errs: window.__errs||[]}); })()" 2>&1 | tail -1
$AB screenshot "$OUT/e2e5-spotify-play.png" 2>&1 | tail -1
$AB console 2>&1 | tail -15

echo "=== 4. YOUTUBE import ==="
$AB eval "location.hash='#/library'; 'nav'" 2>&1 | tail -1
$AB wait 1200 2>&1 | tail -1
$AB eval "(() => { const b=document.querySelector('button[title=\"Create playlist\"]'); if(!b) return 'NO_BTN'; b.click(); return 'modal'; })()" 2>&1 | tail -1
$AB wait 700 2>&1 | tail -1
$AB eval "(() => { const t=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Import'); if(!t) return 'NO_TAB'; t.click(); return 'import-tab'; })()" 2>&1 | tail -1
$AB wait 400 2>&1 | tail -1
$AB eval "(() => { const inp=document.querySelector('input[placeholder*=\"ink\" i]'); if(!inp) return 'NO_INPUT'; const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(inp,'https://www.youtube.com/playlist?list=PLEBY6E55uF5VWeDbTPc3JiiUlDsbjhlC_'); inp.dispatchEvent(new Event('input',{bubbles:true})); return 'url-set'; })()" 2>&1 | tail -1
$AB eval "(() => { const dlg=document.querySelector('[role=dialog]'); const btn=dlg&&Array.from(dlg.querySelectorAll('button')).find(b=>b.textContent.trim()==='Import'); if(!btn) return 'NO_SUBMIT'; btn.click(); return 'import-started'; })()" 2>&1 | tail -1
poll_eval "!document.querySelector('[role=dialog]')" 150 "youtube-import"

echo "=== 5. open the youtube-imported playlist + play ==="
$AB eval "(() => { const card=Array.from(document.querySelectorAll('a,button,[role=button]')).find(e=>/Imported YouTube/i.test(e.textContent.trim()) && e.textContent.length<90); if(!card) return 'NO_CARD'; card.click(); return 'opened'; })()" 2>&1 | tail -1
$AB wait 1500 2>&1 | tail -1
$AB eval "JSON.stringify({hash: location.hash, hasPlay: !!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Play')})" 2>&1 | tail -1
$AB eval "window.__errs=[]; window.addEventListener('error',e=>window.__errs.push(String(e.message))); 'listening'" 2>&1 | tail -1
$AB eval "(() => { const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Play'); if(!b) return 'NO_PLAY'; b.click(); return 'play-clicked'; })()" 2>&1 | tail -1
$AB wait 3000 2>&1 | tail -1
$AB eval "(() => { const a=document.querySelector('audio'); return JSON.stringify({hasAudio: !!a, src: a ? a.src.slice(0,90) : null, paused: a ? a.paused : null, t: a ? a.currentTime.toFixed(2) : null, errs: window.__errs||[], bodyHasUnavailable: document.body.innerText.includes('Track unavailable')}); })()" 2>&1 | tail -1
$AB wait 4000 2>&1 | tail -1
$AB eval "(() => { const a=document.querySelector('audio'); return JSON.stringify({paused: a ? a.paused : null, t: a ? a.currentTime.toFixed(2) : null, errs: window.__errs||[]}); })()" 2>&1 | tail -1
$AB screenshot "$OUT/e2e5-youtube-play.png" 2>&1 | tail -1
$AB console 2>&1 | tail -15

echo "REPRO DONE"
