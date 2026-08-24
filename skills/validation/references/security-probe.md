# Security & Ownership Probe

Validation proves the app *works*; this proves it doesn't *leak*. `scripts/security-probe.js` is a
lightweight ACTIVE probe — right-sized for Supabase / SMB web apps, not a full pentest. It detects;
it never exploits or mutates.

## What it checks

| Check | Severity | Catches |
| --- | --- | --- |
| `secrets-in-bundle` | critical/high | Supabase **service_role** JWT, private keys, `sk_live_…`, `AKIA…`, `service_role`/`*_secret` assignments shipped in client JS. The public **anon** key is allowed and never flagged. |
| `idor` | critical / medium | Object-level auth: navigate an authenticated role to a resource it should NOT own. Confirmed foreign-id targets = critical leak; auto-incremented ids that return content = "suspect, confirm ownership". This is the "change the id in the URL" test. |
| `input-fuzz` | critical/high | Reflected XSS execution and 500s from hostile values in non-destructive forms. `VAL_`/inert payloads only; never submits password/email/payment/destructive forms. |
| `headers` | medium/low | Missing CSP, `X-Content-Type-Options`, `X-Frame-Options`/frame-ancestors, `Referrer-Policy`. |

## How to run it

```bash
node path/to/scripts/security-probe.js \
  --url http://localhost:5173/ \
  --storage-state test-manifest/auth/admin-state.json \
  --config validation.config.json \
  --out test-manifest/security/admin-probe.json \
  --channel chrome
```

Run it **authenticated, per role** (pass each role's storage-state) — IDOR and many leaks only
appear inside an authenticated session, and different roles own different objects. Exit code is 1
if any critical/high finding exists, 0 otherwise.

## Config (`validation.config.json` → `security`)

```json
{
  "security": {
    "allowSecrets": ["known-public-token-fragment"],
    "idorTargets": [
      { "url": "/orders/{id}", "foreignId": "2", "label": "an order owned by another user" }
    ],
    "autoIdorPaths": ["/orders/1", "/invoices/10"],
    "skipFuzz": false
  }
}
```

- `idorTargets` — strongest signal: a `{id}` route plus a `foreignId` known to belong to a
  *different* user. If this role can read it, that's a **critical** authorization hole.
- `autoIdorPaths` — a resource id this role legitimately owns; the probe increments the id and
  flags as **suspect** (medium) if the next object renders, for a human to confirm ownership.
- `allowSecrets` — fragments to ignore (e.g. a deliberately public token). Keep this short and
  document why; do not use it to silence real leaks.

## Verdict mapping

- Any `critical` (service-role key shipped, confirmed IDOR, executed XSS) → the run **fails**; these
  are launch-blockers and should become hardening tasks immediately.
- `high` (500 on input, broad secret) → fail.
- `medium`/`low` (suspect IDOR, missing headers) → record and queue; not auto-blocking.

Findings flow into the validation report and, under `/battle-test`, become `TRACKS.md` hardening
items. Always run `scripts/redact-artifacts.js` afterward if any storage-state or token was used.
