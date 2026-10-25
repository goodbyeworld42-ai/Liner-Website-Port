#!/bin/bash
# E2E: Account tab (profile customizations) — runs in ONE call because
# background browser state dies between tool calls (known harness trap).
AB="agent-browser"
OUT=/home/z/my-project/download
mkdir -p "$OUT"

step() { echo; echo "=== $1 ==="; }

step "1. fresh load of the new bundle"
$AB open http://localhost:3000/ 2>&1 | tail -1
$AB wait --load networkidle --timeout 20000 2>&1 | tail -1
$AB eval "location.hash = '#/'; 'loaded'"
$AB eval "(s => s ? s.user.username + ' / ' + s.user.displayName : 'NO_SESSION')(JSON.parse(localStorage.getItem('liner_auth_session')||'null'))"

step "2. open settings via hash route, check Account tab is default"
$AB eval "location.hash = '#/settings'; 'nav'" 2>&1 | tail -1
$AB wait 1200 2>&1 | tail -1
$AB eval "(() => { const tabs = Array.from(document.querySelectorAll('[role=tab]')).map(b => b.textContent.trim()); return JSON.stringify({tabs, hasProfileCard: !!document.getElementById('account-display-name')}); })()"

step "3. profile card identity"
$AB eval "document.body.innerText.includes('JayJoice') && document.body.innerText.includes('@jayzeyluna') && document.body.innerText.includes('seekfromohio@gmail.com')"

step "4. username inline validation (type invalid name)"
$AB eval "(() => { const el = document.getElementById('account-username'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, 'AB'); el.dispatchEvent(new Event('input', { bubbles: true })); return 'typed'; })()"
$AB wait 300 2>&1 | tail -1
$AB eval "(() => { const hint = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('3-30')); const err = Array.from(document.querySelectorAll('span')).find(s => s.className.includes('accent-primary')); return 'error shown: ' + (err ? err.textContent.slice(0, 50) : 'NONE') + ' | hint gone: ' + !hint; })()"
$AB eval "(() => { const el = document.getElementById('account-username'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, 'jayzeyluna'); el.dispatchEvent(new Event('input', { bubbles: true })); return 'restored'; })()"

step "5. change display name + bio, save"
$AB eval "(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const dn = document.getElementById('account-display-name'); set.call(dn, 'JayJoice Web'); dn.dispatchEvent(new Event('input', { bubbles: true })); return 'name set'; })()"
$AB eval "(() => { const ta = document.getElementById('account-bio'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(ta, 'Testing the website port'); ta.dispatchEvent(new Event('input', { bubbles: true })); return 'bio set'; })()"
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save Changes'); if (!btn) return 'NO_SAVE_BTN'; btn.click(); return 'clicked, disabled=' + btn.disabled; })()"
$AB wait 1500 2>&1 | tail -1
$AB eval "(() => { const toast = document.body.innerText.match(/Profile updated successfully/); const chip = Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'JayJoice Web'); return 'toast: ' + !!toast + ' | sidebar chip updated: ' + chip; })()"

step "6. verify name+bio on the API"
TOKEN=$($AB eval "JSON.parse(localStorage.getItem('liner_auth_session')).accessToken" 2>/dev/null | tail -1 | tr -d '"')
curl -s "https://api.tryliner.fun/v1/me" -H "Authorization: Bearer $TOKEN" --max-time 10 | python3 -c "import json,sys; d=json.load(sys.stdin); print('api displayName:', d.get('displayName'), '| bio:', d.get('bio'))"

step "7. upload avatar through the real file input"
$AB eval "(async () => { const c = document.createElement('canvas'); c.width = 320; c.height = 320; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 320, 320); g.addColorStop(0, '#ff4d4d'); g.addColorStop(1, '#7c3aed'); x.fillStyle = g; x.fillRect(0, 0, 320, 320); x.fillStyle = '#fff'; x.font = 'bold 140px sans-serif'; x.textAlign = 'center'; x.fillText('J', 160, 210); const blob = await new Promise(r => c.toBlob(r, 'image/png')); const file = new File([blob], 'me.png', { type: 'image/png' }); const dt = new DataTransfer(); dt.items.add(file); const input = document.querySelector('[data-testid=\"account-avatar-input\"]'); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'uploaded ' + file.size + ' bytes'; })()"
$AB wait 2500 2>&1 | tail -1
$AB eval "(() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.src.startsWith('data:image/')); return 'data-url avatars rendered: ' + imgs.length + ' | toast: ' + document.body.innerText.includes('Profile photo updated'); })()"
curl -s "https://api.tryliner.fun/v1/me" -H "Authorization: Bearer $TOKEN" --max-time 10 | python3 -c "import json,sys; d=json.load(sys.stdin); a=d.get('avatarUrl') or ''; print('api avatarUrl:', a[:40] + '... (' + str(len(a)) + ' chars)')"

step "8. avatar visible in home header too"
$AB eval "location.hash = '#/'; 'home'" 2>&1 | tail -1
$AB wait 1200 2>&1 | tail -1
$AB eval "(() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.src.startsWith('data:image/')); return 'header data-url avatar imgs: ' + imgs.length; })()"
$AB screenshot "$OUT/e2e4-account-avatar-home.png" 2>&1 | tail -1

step "9. remove avatar"
$AB eval "location.hash = '#/settings'; 'back'" 2>&1 | tail -1
$AB wait 800 2>&1 | tail -1
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().replace(/\s+/g,' ') === 'Remove photo'); if (!btn) return 'NO_REMOVE_BTN'; btn.click(); return 'clicked'; })()"
$AB wait 2000 2>&1 | tail -1
$AB eval "(() => ({ toast: document.body.innerText.includes('Profile photo removed'), removeBtnGone: !Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim().replace(/\s+/g,' ') === 'Remove photo') }))" | tail -1
curl -s "https://api.tryliner.fun/v1/me" -H "Authorization: Bearer $TOKEN" --max-time 10 | python3 -c "import json,sys; d=json.load(sys.stdin); print('api avatarUrl after remove:', d.get('avatarUrl'))"

step "10. privacy toggle round-trip (show history)"
$AB eval "(() => { const row = Array.from(document.querySelectorAll('div')).find(d => d.textContent.trim().startsWith('Share listening history') && d.querySelector('button[aria-pressed]')); const btn = row && row.querySelector('button[aria-pressed]'); if (!btn) return 'NO_TOGGLE'; return 'before=' + btn.getAttribute('aria-pressed') + '; ' + (btn.click(), 'clicked'); })()"
$AB wait 1800 2>&1 | tail -1
$AB eval "(() => { const row = Array.from(document.querySelectorAll('div')).find(d => d.textContent.trim().startsWith('Share listening history') && d.querySelector('button[aria-pressed]')); return 'after=' + (row && row.querySelector('button[aria-pressed]').getAttribute('aria-pressed')); })()"
curl -s "https://api.tryliner.fun/v1/me" -H "Authorization: Bearer $TOKEN" --max-time 10 | python3 -c "import json,sys; d=json.load(sys.stdin); print('api showHistory:', d.get('showHistory'))"
$AB eval "(() => { const row = Array.from(document.querySelectorAll('div')).find(d => d.textContent.trim().startsWith('Share listening history') && d.querySelector('button[aria-pressed]')); row.querySelector('button[aria-pressed]').click(); return 'toggled back'; })()"
$AB wait 1500 2>&1 | tail -1
curl -s "https://api.tryliner.fun/v1/me" -H "Authorization: Bearer $TOKEN" --max-time 10 | python3 -c "import json,sys; d=json.load(sys.stdin); print('api showHistory restored:', d.get('showHistory'))"

step "11. security section renders"
$AB eval "(() => ({ security: document.body.innerText.includes('Security'), password: document.body.innerText.includes('Change password'), support: document.body.innerText.includes('Contact support'), note: document.body.innerText.includes(\"doesn't offer in-app password changes\") }))" | tail -1

step "12. restore original profile"
$AB eval "(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const dn = document.getElementById('account-display-name'); set.call(dn, 'JayJoice'); dn.dispatchEvent(new Event('input', { bubbles: true })); const ta = document.getElementById('account-bio'); const tset = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; tset.call(ta, ''); ta.dispatchEvent(new Event('input', { bubbles: true })); return 'staged'; })()"
$AB eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save Changes'); btn.click(); return 'saved'; })()"
$AB wait 1500 2>&1 | tail -1
curl -s "https://api.tryliner.fun/v1/me" -H "Authorization: Bearer $TOKEN" --max-time 10 | python3 -c "import json,sys; d=json.load(sys.stdin); print('final api state:', d.get('displayName'), '| bio:', d.get('bio'), '| avatar:', d.get('avatarUrl'), '| showHistory:', d.get('showHistory'))"

step "13. screenshot of the Account tab"
$AB screenshot "$OUT/e2e4-account-tab.png" 2>&1 | tail -1

echo; echo "E2E DONE"
