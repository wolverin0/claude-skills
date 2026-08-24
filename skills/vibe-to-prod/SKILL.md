---
name: vibe-to-prod
description: Guided 13-layer production-readiness self-check for a vibe-coded app. Use when the user asks "is this production ready", "what am I missing before launch", "ship check", "did I forget anything", or wants to harden an AI-generated MVP. Walks the 13 layers, runs cheap detections + manual tests, emits a per-layer PASS/GAP scorecard. Lighter than /audit (which is full due-diligence).
---

# Skill: vibe-to-prod

A fast, friendly self-check that walks the **13-layer production stack** against
the current project and tells the user what separates their demo from a product.
This is the "finish the last 20%" companion (see playbook `PRIN-1`).

**This is NOT `/audit`.** `/audit` is heavyweight due-diligence: isolated
subagents per domain, hard-stops, a dual-layer report, a deterministic verdict.
`vibe-to-prod` is a single-pass guided walk that a founder runs on their own app
to find gaps quickly. If the user wants exhaustive evidence-cited findings or an
acquisition-grade report, point them to `/audit` instead.

## Source of truth

Read the playbook first — it holds the layer definitions, thresholds, failure
modes, and manual tests this skill checks against:

```
view ~/.codex/context\production-readiness-playbook.md
```

Cite playbook anchors (`L1`-`L13`, `FM-*`, `CHK-*`) in every gap you report so
the user can read the depth. Do not paste the playbook back; reference it.

## When to use

- "Is my app ready to ship / go to production?"
- "What am I missing before launch?" / "Did I forget anything?"
- "Harden this" / "make this production-ready" on a vibe-coded MVP.
- After a demo works and the user wants to know the gap to a real product.

## Process

### 1. Detect the stack (don't assume)
Identify language, framework, DB, auth, hosting, and whether there's a
front-end bundle and a paid/AI API. Read the manifest (`package.json`,
`pyproject.toml`, etc.), `.env.example`, and the entry point. This sets which
layers are in scope (e.g. no front-end → L1 mostly N/A).

### 2. Walk the 13 layers
For each layer `L1`-`L13`, run the cheap detections below and judge PASS / GAP /
N/A. Read actual code before declaring a gap (don't guess). Detections are
signals, not proof — confirm by reading.

Representative detections (rg; use PowerShell equivalents on Windows if rg is
absent). Adapt to the detected stack:

- **L1 front-end (4 UI states):** in components, look for `isLoading`/`isError`/
  empty-state handling. Flag components that render data with no error/empty
  branch. (`FM-6`, `B19`)
- **L2/L8 secrets in client:** `rg -n "(NEXT_PUBLIC_|VITE_|PUBLIC_).*(SECRET|KEY|TOKEN|PRIVATE)" src/` and search the built bundle for `sk_`/`sk_live`/`AIza`/`eyJ...service_role`. Any paid-API secret reachable client-side = serious gap (`FM-4`, `H11`).
- **L3 database:** is there a migrations dir? `rg -n "SELECT \*|select\(\)" ` for unindexed scans; check for one-giant-table; pooled vs direct connection string (`5432` vs `6543`). (`FM-11`, `FM-1`)
- **L4 auth:** battle-tested auth lib present? RLS policies on user tables? Walk `CHK-4` manual tests with the user. (`FM-8`)
- **L5/L7 deploy/CI:** is there a CI workflow? staging/preview config? a documented rollback? are commits atomic? (`FM-12`)
- **L6 cloud:** on a free tier with background-job needs? sync long ops? (`FM-9`)
- **L9 rate limiting:** `rg -n "rateLimit|rate_limit|Limiter|throttle|express-rate-limit|Flask-Limiter|Upstash"` — any limiter on auth/AI/public endpoints? Spend cap on paid APIs? (`FM-5`, `H10`)
- **L10 caching:** `rg -n "cache|Cache|redis|Redis|revalidate|stale-while"` — any cache on hot/expensive paths? (`FM-21`, `B17`)
- **L11 scaling:** connection pooling configured? heavy ops queued vs inline? any load test? (`FM-1`, `B16`)
- **L12 observability:** `rg -n "Sentry|console\.log|logging\.|logger\."` — structured logging + error tracker, or just console.log? uptime monitor? (`FM-14`)
- **L13 recovery:** automated backups + tested restore? incident runbook? canary / feature flags? (`PRIN-8`)
- **L5b email deliverability** (any app that sends email — the classic silent
  launch-killer): SPF/DKIM/DMARC on the sending domain (`nslookup -type=txt`),
  transactional provider wired (not a console.log fallback), a real email
  received in Gmail AND Outlook (ask the user — cannot be inferred from code),
  app mail on a subdomain. All missing = GAP at launch-blocker priority.

### 3. Run the manual tests with the user
Walk `CHK-4` (auth boundary tests) and `CHK-1` (30-min security audit:
`npm audit`, change-id-in-URL, secret review) interactively — these need the
running app, so ask the user to perform them and report results.

### 4. Emit the scorecard
Prioritize gaps by blast radius: secrets/auth/cost first (can cause day-one
damage), then reliability/scale, then polish.

## Output format

```
VIBE-TO-PROD SCORECARD — <project>
Stack: <detected stack>   |   Layers in scope: <N>/13

  L1  Front-end foundations      [PASS | GAP | N/A]   <one line + playbook ref>
  L2  APIs & back-end logic       ...
  ...
  L13 Availability & recovery     ...

TOP GAPS (fix first):
  1. <layer> — <gap> — why it bites (cite FM-x / CHK-x) — concrete fix
  2. ...

THE BORING 20% STILL MISSING (CHK-5):
  - <items absent: error states, password reset, ToS, rate limits, ...>

NEXT STEP:
  - Quick wins (<1 day): <list>
  - Before launch: <list>
  - For exhaustive evidence-cited findings, run /audit.
```

## Failure modes to refuse
- ❌ Declaring a layer PASS/GAP without reading the actual code (signals ≠ proof).
- ❌ Reproducing the playbook content instead of citing its anchors.
- ❌ Pretending to be `/audit` — no dual-layer report, no deterministic verdict; if the user needs that, hand off to `/audit`.
- ❌ Performing destructive or write actions — this is a read-only self-check.
- ❌ Reporting the value of any secret you find (name the location, never the value).

## Codex Port Notes
- For context references written as `@.claude/context/<file>`, read `~/.codex/context\<file>` in Codex.
- Prefer PowerShell equivalents on Windows; use `rg` before `grep` and `Get-ChildItem` before Unix `find`.
- Read-only by default; only remediate if the user explicitly asks.
