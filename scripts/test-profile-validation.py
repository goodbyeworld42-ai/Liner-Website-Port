#!/usr/bin/env python3
"""Test field validation rules of PATCH /v1/users/me."""
import json
import subprocess

def get_token():
    out = subprocess.run(
        ["agent-browser", "eval", "JSON.parse(localStorage.getItem('liner_auth_session')).accessToken"],
        capture_output=True, text=True, timeout=30,
    )
    lines = [l for l in out.stdout.strip().splitlines() if l.strip()]
    return lines[-1].strip().strip('"')

def patch(token, payload, tmp="/tmp/patch_body2.json"):
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
    return code.strip(), body[:220]

def main():
    token = get_token()
    tests = [
        ("long displayName 120ch", {"displayName": "X" * 120}),
        ("long bio 500ch", {"bio": "B" * 500}),
        ("bio 2000ch", {"bio": "B" * 2000}),
        ("invalid username UPPER", {"username": "JayZey"}),
        ("short username", {"username": "ab"}),
        ("username with dash", {"username": "jay-zey"}),
        ("email change attempt", {"email": "newemail@test.com"}),
        ("unknown field", {"favoriteColor": "red"}),
    ]
    for name, payload in tests:
        code, body = patch(token, payload)
        print(f"{name:28s} -> {code} :: {body[:150]}")

if __name__ == "__main__":
    main()
