#!/bin/bash
# Focused repro: play from the REAL user playlists (Odetari&ODECORE / jujubotv)
AB="agent-browser"
OUT=/home/z/my-project/download
mkdir -p "$OUT"

echo "=== 1. open Odetari&ODECORE playlist page directly ==="
$AB open "http://localhost:3000/#/library/playlist?id=67a67463-e481-4fea-9788-b7c8b695091c" 2>&1 | tail -1
$AB wait --load networkidle --timeout 20000 2>&1 | tail -1
$AB wait 2500 2>&1 | tail -1
$AB eval "JSON.stringify({hash: location.hash, title: document.querySelector('h1,h2')?.textContent, rowSample: document.body.innerText.split('\\n').slice(0,30).join(' | ').slice(0,400)})" 2>&1 | tail -1

echo "=== 2. play: click Play all ==="
$AB eval "window.__errs=[]; window.addEventListener('error',e=>window.__errs.push(String(e.message).slice(0,120))); 'ok'" 2>&1 | tail -1
$AB eval "(() => { const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Play'); if(!b) return 'NO_PLAY_BTN: '+Array.from(document.querySelectorAll('button')).map(b=>b.textContent.trim()).filter(t=>t&&t.length<20).slice(0,12).join(','); b.click(); return 'clicked'; })()" 2>&1 | tail -1
$AB wait 4000 2>&1 | tail -1
$AB eval "(() => { const a=document.querySelector('audio'); return JSON.stringify({hasAudio: !!a, src: a?a.src.slice(0,100):null, paused: a?a.paused:null, t: a?+a.currentTime.toFixed(2):null, errs: window.__errs, unavailableToast: document.body.innerText.includes('Track unavailable'), signinPrompt: /sign in/i.test(document.body.innerText)&&/youtube/i.test(document.body.innerText)}); })()" 2>&1 | tail -1

echo "=== 3. same for jujubotv playlist ==="
$AB open "http://localhost:3000/#/library/playlist?id=0e6cf0f3-96ff-4b74-a412-8cee4b1159e4" 2>&1 | tail -1
$AB wait 2500 2>&1 | tail -1
$AB eval "(() => { const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Play'); if(!b) return 'NO_PLAY_BTN'; b.click(); return 'clicked'; })()" 2>&1 | tail -1
$AB wait 4000 2>&1 | tail -1
$AB eval "(() => { const a=document.querySelector('audio'); return JSON.stringify({paused: a?a.paused:null, t: a?+a.currentTime.toFixed(2):null, src: a?a.src.slice(0,100):null, errs: window.__errs}); })()" 2>&1 | tail -1

echo "=== 4. console tail ==="
$AB console 2>&1 | rg -i "error|fail|warn|unavailable|playback" | tail -12
echo "=== 5. screenshot ==="
$AB screenshot "$OUT/e2e5-playlist-page.png" 2>&1 | tail -1
echo DONE
