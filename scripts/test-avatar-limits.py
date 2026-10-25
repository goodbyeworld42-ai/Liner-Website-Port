#!/usr/bin/env python3
"""Test Liner API avatarUrl size limits with data URLs."""
import json
import subprocess
import sys
import base64

def get_token():
    out = subprocess.run(
        ["agent-browser", "eval", "JSON.parse(localStorage.getItem('liner_auth_session')).accessToken"],
        capture_output=True, text=True, timeout=30,
    )
    lines = [l for l in out.stdout.strip().splitlines() if l.strip()]
    return lines[-1].strip().strip('"')

def patch(token, payload, tmp="/tmp/patch_body.json"):
    with open(tmp, "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "PATCH", "https://api.tryliner.fun/v1/users/me",
         "-H", f"Authorization: Bearer {token}",
         "-H", "Content-Type: application/json",
         "--data", f"@{tmp}", "--max-time", "20", "-w", "\n%{http_code}"],
        capture_output=True, text=True, timeout=30,
    )
    body, _, code = r.stdout.rpartition("\n")
    return code.strip(), body[:200]

def make_data_url(size_kb):
    raw = base64.b64encode(b"\x89PNG" + b"\x00" * (size_kb * 1024 - 4)).decode()
    return f"data:image/png;base64,{raw}"

def main():
    token = get_token()
    print(f"token: {len(token)} chars")
    for kb in (20, 60, 120, 260, 510, 1024):
        du = make_data_url(kb)
        payload = {"avatarUrl": du}
        code, body = patch(token, payload)
        print(f"{kb:5d} KB data URL -> HTTP {code} :: {body[:120]}")

if __name__ == "__main__":
    main()
