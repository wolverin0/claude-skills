---
name: audit-hard-stops
description: Walk the H1-H11 hard-stops catalog systematically against an audit scope. Use as the FIRST audit phase after audit-method completes. Runs detection commands for each hard stop class and reports FOUND / NOT FOUND with evidence. If any hard stop is found, the audit verdict locks to 🛑 DO NOT LAUNCH.
---

# Skill: Audit Hard Stops (H1-H11)

This skill walks the eleven hard-stop conditions from
`@.claude/context/audit-hard-stops.md` and produces a structured report
of findings. It runs FIRST in the audit pipeline because hard stops
override every other consideration.

## What this skill does

For each of H1 through H11:

1. Run the detection commands documented in
   `@.claude/context/audit-hard-stops.md`
2. Read the output
3. For each match, **read the actual code** at the cited path:line to
   verify (R2 — quote before cite). A grep match alone is not a finding;
   a confirmed pattern at a specific line is.
4. Classify: `FOUND` / `NOT FOUND` / `UNABLE TO CHECK (and why)`
5. Capture evidence in the structured shape below

## What this skill does NOT do

- Write fix code (that's `audit-fix-generator`)
- Soften any finding ("technically present but probably fine" — no, R3)
- Skip hard stops because the codebase is "small" or "demo" (no, the
  conditions don't care about scale)
- Halt the audit on first finding — keep walking H1-H11 to surface ALL
  hard stops

## Process

### Pre-flight (load context once)

```
view @.claude/context/audit-rules.md       # R1-R7
view @.claude/context/audit-hard-stops.md  # H1-H11 detection details
```

### Walk H1-H11 in order

For each, follow this template:

```
═══════════════════════════════════════════════════════════════════════
  H<N> — <NAME>
═══════════════════════════════════════════════════════════════════════

[Run the detection commands from audit-hard-stops.md]

If output is empty / clean:
  Status: NOT FOUND
  Detection commands run:
    <list>
  Note any limitations (e.g., "RLS check requires DB access — verified
  via migrations only")

If output has matches:
  For each match:
    1. View the file at the cited line
    2. Verify the pattern is real (not a false positive — a string
       in a comment, a test fixture, a documentation example)
    3. If real, capture the finding

  Status: FOUND (<N> instances)
  Findings:
    F-H<N>.1
      Evidence:        <path:line>
      Pattern:         <which sub-pattern from audit-hard-stops.md>
      Severity:        Critical (hard stop)
      Exploitability:  EXPLOITABLE-NOW | EXPLOITABLE-LOW-EFFORT
      What's wrong:    <one paragraph>
      Why it matters:  <one sentence on real-world impact>
      Recommended fix: <one paragraph, concrete>
      Verification:    <command to confirm fixed>

    F-H<N>.2
      [same shape if multiple]

If unable to check:
  Status: UNABLE TO CHECK
  Reason: <e.g., "Database access required for RLS verification.
                   Local migrations show RLS being enabled but cannot
                   confirm production state.">
  Mitigation: Mark as [UNVERIFIED]. Recommend the user runs the
              detection command directly against production.
```

## Specific guidance per H-class

### H1 (RLS) — handle carefully

Without DB access, you can only check:
- Whether migrations enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Whether policies are defined (`CREATE POLICY ...`)
- Whether the app reads via `service_role` (which bypasses RLS)

If migrations enable RLS and the app reads via the anon/user role, you
can mark H1 as NOT FOUND with confidence "based on migrations."

If the app reads via `service_role` for user-data tables, mark H1 as
FOUND regardless of RLS state — the service role bypasses RLS, so RLS
provides no protection.

### H2 (secrets in client) — be precise

A grep match for `SERVICE_ROLE` in client code is suspicious but not
automatic. Check:
- Is the variable actually exposed to the client bundle? (`NEXT_PUBLIC_`
  / `VITE_` / `PUBLIC_` prefix = yes; bare name = no)
- Is the file actually shipped to the browser? (Code in `src/server/`
  or `app/api/` runs server-side and is not exposed)

Only mark H2 as FOUND if a service-role-shaped key actually reaches the
client bundle. Otherwise it's a `BAD-PRACTICE` (Medium) about secret
naming, not a hard stop.

### H3 (unauthed mutation) — check the wiring

For each mutation endpoint:

1. Open the route file
2. Look at the handler signature
3. Verify a dependency / middleware enforces auth

Common false positive: an internal endpoint (e.g., `/internal/jobs/*`)
that intentionally has no auth because it's behind a private network or
API-key-protected at a different layer. Check if API-key auth is
enforced; if so, that's not H3 (different class).

Common true positive: endpoint marked as auth-required in
documentation/comments but the actual code has no `Depends()` /
`requireAuth()`. Read the bytes (R2).

### H4 (.env in history) — depth matters

Use `git log --all --full-history --diff-filter=A -- <file>` to find the
**adding** commit. Files removed in a later commit are still in history;
this is what makes H4 a hard stop.

If the repo was rebased aggressively or used `git filter-repo`, the
file might not be in history despite being briefly committed. Don't
mark H4 as NOT FOUND on the absence of `git log` evidence alone — also
check git reflog if accessible.

### H5 (webhooks) — enumerate FIRST, then read every handler

**MANDATORY ENUMERATION STEP — do this BEFORE writing any H5 verdict.**
The most common H5 false-negative is the auditor noticing the obvious
webhook (MercadoPago, Stripe, GitHub) and skipping the rest. Forcing
yourself to list every inbound webhook route prevents that shortcut.

Run all of these and put the union in your scratch inventory:

```bash
# Express/Hono/Fastify-style route definitions
rg -n "(app|router|api|fastify|hono)\.(post|put|patch|delete|all)\(" \
   -g '!node_modules' -g '!dist' -g '*.{js,ts,jsx,tsx,mjs,cjs}'

# Supabase Edge Functions (each function is a webhook target)
rg -n "Deno\.serve|export default async function" supabase/functions

# Next.js / Vercel API routes
rg -lE "export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)" \
   app/api pages/api 2>/dev/null

# Any path containing 'webhook' or 'hook'
rg -l -i "webhook|/hook" -g '*.{js,ts,jsx,tsx}' -g '!node_modules'
```

Produce an inventory line for each route found:

```
[H5-route-N]  <method> <path>  →  <handler-file:line>  →
   signature-check: yes (function:line) | no | conditional (`if (DEBUG)…`)
```

**Findings rule:** an H5 finding is valid for ANY route in the inventory
where signature-check is `no` OR `conditional`. Do NOT close H5 with a
verdict until every route in the inventory has been classified. If the
codebase has 5 inbound webhook routes and only 2 are checked, the H5
verdict is `incomplete` not `not found`.

Don't trust function names. A function called `verifyWebhook` might do
nothing if it's wrapped in `if (DEBUG): pass`. Read the actual code path
from request entry to side effect. The pattern that's H5:

```
request → read body → check event type → execute side effect → verify signature (or never)
```

The pattern that's safe:

```
request → read body bytes → verify signature against bytes → parse → side effect
```

### H3 (unauthed mutation) — same enumeration rule

H3 has the same shortcut risk: auditors notice the one obvious unauthed
mutation route and stop. To prevent it, run the same route enumeration
above (every `app.post|put|patch|delete`), then for EACH route classify:

```
[H3-route-N]  <method> <path>  →  <handler-file:line>  →
   auth-middleware: yes (named) | no | conditional
   service-role used: yes | no
```

Service-role + no-auth-middleware is H3-FOUND. Audit verdict cannot
close until every route in the inventory has both fields filled.

### H6 (HTML rendering) — trace the input

A `dangerouslySetInnerHTML` of a hardcoded string (e.g., a pre-rendered
SVG icon) is not H6. The finding requires user-controlled input
reaching the renderer. Trace the source:

```
The string passed to dangerouslySetInnerHTML comes from <where>?
  → If from a literal in source: not H6 (might be a code smell, not a
    security issue)
  → If from a CMS / database / API response derived from user input: H6
  → If from a Markdown-to-HTML pipeline: check whether the pipeline
    sanitizes (most don't by default)
```

### H7 (SQL injection) — false positives are common

Many ORMs use parameterized queries that LOOK like string formatting:

```python
# Looks scary but is parameterized — safe
query = "SELECT * FROM users WHERE id = :id"
result = await db.execute(query, {"id": user_id})

# Actually scary — H7
query = f"SELECT * FROM users WHERE id = {user_id}"
result = await db.execute(query)
```

Read the surrounding code. The criterion is whether user input reaches
the query as a literal string vs as a bound parameter.

### H8 (hardcoded admin) — read the surrounding logic

`if user.email == "admin@..."` is H8. But:

```python
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
if user.email == ADMIN_EMAIL:
    user.is_admin = True
```

is NOT H8 — the email is configured, not hardcoded. (It might be a
different finding — single-admin design, no role table — but not H8.)

### H9 (test asserts buggy code) — heuristic

True H9 requires:

1. The flow is critical (auth, payments, deletes, data export, billing)
2. The test is the only safety net (no integration test, no manual QA gate)
3. The test mocks the function under test, or asserts mocked output

Mark H9 as FOUND only when all three are present. Mark `B13`
(test-mirrors-code) for less severe versions; that's a domain-13
finding, not a hard stop.

### H10 (unbounded cost) — require all three conditions

H10 is FOUND only when ALL hold: (1) the endpoint reaches a metered/paid/AI
call, (2) it's reachable by an unauthenticated or self-service user, (3) there
is neither a rate limiter on the path NOR a spend cap. If it's behind auth with
a per-user quota/credit system → Domain 10 finding, not H10. A loose limiter →
Domain 1/10, not H10. Internal-only worker (not request-reachable) → not H10.
Capture the paid-call file:line AND proof that no limiter and no cap apply.

### H11 (paid-API secret in client bundle) — distinguish from H2

H11 is for paid-API secrets (OpenAI/Anthropic/Stripe `sk_*`/SendGrid/Twilio)
that ship to the browser. De-dup rule: if the leaked key is a Supabase
`service_role` / admin / infra master key → report as **H2**, not H11. A
publishable/anon key (`pk_*`, Supabase anon) is designed to be public → not a
finding. Confirm the secret actually reaches the client (public env prefix OR
imported into a client-shipped file OR found in the built bundle) — a secret
read only in a server route/component is safe. Never print the value.

## Output format

```
═══════════════════════════════════════════════════════════════════════
  HARD STOPS REPORT
═══════════════════════════════════════════════════════════════════════

Total hard stops detected: <N> of 11 categories

  H1 — RLS / row-level access control:           [FOUND/NOT FOUND/UNABLE]
  H2 — Service-role secrets in client:           [FOUND/NOT FOUND]
  H3 — Unauthed data-mutation endpoints:         [FOUND/NOT FOUND]
  H4 — Secrets in git history:                   [FOUND/NOT FOUND]
  H5 — Webhooks without signature verification:  [FOUND/NOT FOUND]
  H6 — User HTML rendering without sanitization: [FOUND/NOT FOUND]
  H7 — SQL injection:                            [FOUND/NOT FOUND]
  H8 — Hardcoded admin / temp bypass:            [FOUND/NOT FOUND]
  H9 — Test asserts buggy critical-flow code:    [FOUND/NOT FOUND]
  H10 — Unbounded cost on paid/AI endpoint:      [FOUND/NOT FOUND]
  H11 — Paid-API secret in client bundle:        [FOUND/NOT FOUND]

[Then the detailed findings per FOUND class, in the format above]

[If ANY were FOUND, append:]

🛑 LAUNCH DECISION OVERRIDE

This codebase has <N> hard-stop conditions present. Per the audit
triage rubric, the verdict is locked to:

  🛑 DO NOT LAUNCH UNTIL HARD STOPS RESOLVED

Total estimated remediation time for hard stops: <X-Y> developer-days.
See the per-finding "Recommended fix" sections above.

[SECTION COMPLETE: audit-hard-stops]
```

## Failure modes to refuse

- ❌ Marking H<N> as NOT FOUND without showing the detection commands run
- ❌ Marking H<N> as FOUND from grep alone without reading the actual code
- ❌ Softening any FOUND finding ("technically yes but probably fine")
- ❌ Mixing hard-stop findings into other domains' sections — they
  belong in this report
- ❌ Producing fewer than 11 entries (one per H-class) — even if NOT
  FOUND, the entry must exist with evidence of the search
