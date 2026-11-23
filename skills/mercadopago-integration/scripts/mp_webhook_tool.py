#!/usr/bin/env python3
"""MercadoPago webhook helper: simulate and check x-signature locally, and check
that the receiving Supabase Edge Function is deployed with verify_jwt = false.

  sign          print x-signature / x-request-id headers and a curl for a fake notification
  verify        check an x-signature header the way the Edge Function does
  check-config  fail unless supabase/config.toml sets verify_jwt = false for the function

Manifest (same rules as assets/mp-webhook-signature.mjs):
  id:<data.id>;request-id:<x-request-id>;ts:<ts>;   (data.id lowercased if
  alphanumeric; a part with no value is left out). v1 = hex HMAC-SHA256.
Pass the secret with --secret-env NAME (read from the environment) so it never
lands in shell history.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import os
import re
import sys
import time
import uuid
from pathlib import Path


def build_manifest(data_id: str | None, request_id: str | None, ts: str | None) -> str:
    data_id = data_id or ""
    if re.fullmatch(r"[A-Za-z0-9]+", data_id):
        data_id = data_id.lower()
    parts = []
    if data_id:
        parts.append(f"id:{data_id};")
    if request_id:
        parts.append(f"request-id:{request_id};")
    if ts:
        parts.append(f"ts:{ts};")
    return "".join(parts)


def sign(secret: str, data_id: str | None, request_id: str | None, ts: str) -> str:
    manifest = build_manifest(data_id, request_id, ts)
    return hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()


def parse_x_signature(header: str) -> dict[str, str]:
    out = {}
    for part in (header or "").split(","):
        key, _, value = part.partition("=")
        if key.strip() in ("ts", "v1") and value.strip():
            out[key.strip()] = value.strip()
    return out


def verify(secret: str, header: str, data_id: str | None, request_id: str | None) -> tuple[bool, str]:
    parsed = parse_x_signature(header)
    if "ts" not in parsed or "v1" not in parsed:
        return False, "missing ts or v1 in x-signature"
    expected = sign(secret, data_id, request_id, parsed["ts"])
    if hmac.compare_digest(expected, parsed["v1"].lower()):
        return True, "ok"
    return False, "signature mismatch"


def check_config(path: Path, function: str) -> tuple[bool, str]:
    try:
        import tomllib
    except ModuleNotFoundError:  # Python < 3.11
        return False, "needs Python 3.11+ (tomllib)"
    if not path.is_file():
        return False, f"{path} not found"
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    section = data.get("functions", {}).get(function)
    if section is None:
        return False, f"[functions.{function}] missing: add it with verify_jwt = false"
    if section.get("verify_jwt") is not False:
        return False, f"[functions.{function}] verify_jwt is {section.get('verify_jwt', 'unset (default true)')}; MercadoPago sends no Supabase JWT, set verify_jwt = false"
    return True, f"[functions.{function}] verify_jwt = false"


def secret_from(args) -> str:
    value = os.environ.get(args.secret_env, "")
    if not value:
        raise SystemExit(f"environment variable {args.secret_env} is empty")
    return value


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sign")
    s.add_argument("--data-id", required=True)
    s.add_argument("--request-id", default=None, help="default: random UUID; \"\" sends none")
    s.add_argument("--ts", default=None, help="default: now, in milliseconds")
    s.add_argument("--secret-env", default="MP_WEBHOOK_SECRET")
    s.add_argument("--url", default="http://localhost:54321/functions/v1/mercadopago-webhook")
    v = sub.add_parser("verify")
    v.add_argument("--x-signature", required=True)
    v.add_argument("--data-id", default=None)
    v.add_argument("--request-id", default=None)
    v.add_argument("--secret-env", default="MP_WEBHOOK_SECRET")
    c = sub.add_parser("check-config")
    c.add_argument("config", nargs="?", default="supabase/config.toml", type=Path)
    c.add_argument("--function", default="mercadopago-webhook")
    args = p.parse_args(argv)

    if args.cmd == "sign":
        request_id = str(uuid.uuid4()) if args.request_id is None else args.request_id
        ts = args.ts or str(int(time.time() * 1000))
        v1 = sign(secret_from(args), args.data_id, request_id, ts)
        header = f"ts={ts},v1={v1}"
        print(f"x-signature: {header}")
        rid_header = f" -H 'x-request-id: {request_id}'" if request_id else ""
        if request_id:
            print(f"x-request-id: {request_id}")
        print(f"curl -X POST '{args.url}?data.id={args.data_id}&type=payment' "
              f"-H 'Content-Type: application/json' -H 'x-signature: {header}'{rid_header} "
              f"-d '{{\"action\":\"payment.updated\",\"type\":\"payment\",\"data\":{{\"id\":\"{args.data_id}\"}}}}'")
        return 0
    if args.cmd == "verify":
        ok, reason = verify(secret_from(args), args.x_signature, args.data_id, args.request_id)
        print(reason)
        return 0 if ok else 1
    ok, reason = check_config(args.config, args.function)
    print(reason)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
