---
name: audit-domain-01-security
description: Audit the security domain — auth, authz, secrets, transport, sensitive data exposure, dependency CVEs. Run as part of /audit Phase E.
---

# Skill: Audit Domain 1 — Security

This skill audits one specific domain. It runs in an isolated subagent
context spawned by the audit-orchestrator. The subagent loads this
skill and the audit rules, runs against the audit scope, and returns
a ~2K-token findings report.

## Pre-flight

```
view ~/.codex/context\audit-rules.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them — don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H1, H2, H3, H6, H7, H8, H11 (H10 related)
- Blind spots that route to this domain: B1, B7, B8, B18

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Authentication, authorization, session management, secrets handling, transport security (TLS), CORS, CSRF, rate limiting, input validation, output encoding, dependency vulnerabilities (CVEs).

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine — every finding maps back to one of them.

1. Is auth wired to every protected route, not just defined?
2. Are sessions invalidated on logout server-side?
3. Are passwords hashed with a slow algorithm (bcrypt/argon2)?
4. Are tokens in httpOnly cookies, not localStorage?
5. Is CORS scoped to specific origins, not `*`?
6. Is rate limiting in place on login, password reset, and AI calls?
7. Are dependencies free of known high/critical CVEs?
8. Are TLS certs valid, modern, and HSTS-enforced?
9. Are public forms (signup, login, contact, waitlist) protected from bots — CAPTCHA/Turnstile/hCaptcha in code OR Supabase Auth captcha enabled? An unprotected public form is a spam/abuse and credential-stuffing vector.
10. Do auth flows avoid user/account enumeration — do signup-with-existing-email, password-reset-for-nonexistent-email, and wrong-password all return GENERIC responses that don't reveal whether an account exists?
11. Do error responses return generic messages to the client (no raw `error.message`, stack traces, or SQL/schema/table names), with full errors logged server-side only? Also flag rate limiters / auth checks that "fail open" on error.

### Vibe-coding specific checks (production-readiness)

Cite the playbook for depth: view ~/.codex/context\production-readiness-playbook.md

- Secrets in the client bundle: open built JS / search for `sk_`, `sk_live`, `AIza`, OpenAI/Stripe keys, or public-prefixed secret env vars (NEXT_PUBLIC_/VITE_/PUBLIC_). Any paid-API secret reachable in the browser = serious (playbook H11, FM-4, L8).
- Session expiry: copy the URL/session after logout and reuse it — must fail (playbook CHK-4, L4).
- IDOR manual test: change the user/resource id in the URL or body — can you see another user's data? (playbook CHK-4, B8).
- Dependency CVEs: run `npm audit` / equivalent; flag critical/high and abandoned packages (playbook FM-20, L8).
- Password-reset links must expire and be single-use (playbook L4).
- Unique API keys per environment (dev/staging/prod), never shared (playbook L8).
- XSS / log-injection: ~86% of AI code fails XSS, ~88% log injection — verify output is escaped/sanitized (playbook FM-3, L8).
- Rate limit AND spend cap on auth + AI/paid endpoints (playbook H10, FM-5, L9).
- CAPTCHA / bot-protection on public forms (signup, login, contact, waitlist): grep `captcha|turnstile|hcaptcha|recaptcha` in app code (exclude node_modules); if none, check whether the form posts to Supabase Auth with captcha enabled dashboard-side. No protection on a public form = bot-spam + credential-stuffing vector (vibe-coder playbook §5).
- User/account enumeration: read the signup, login, and password-reset handlers. A differential response (e.g. "email already registered" vs generic success, or "user not found" vs generic error on reset) leaks which emails have accounts. Verdict requires reading all three handlers (vibe-coder playbook §3).
- Error-message info disclosure: grep `error.message|err.message|\.stack|res.*json\(\{.*error` in API/route handlers. Any client-facing response that returns a raw error string, stack trace, or DB/schema detail is a finding — show generic message to the client, log full error server-side only. Also flag any limiter/auth that "fails open" on its own error path (vibe-coder playbook §2).


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q4, Q5, or Q6, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q4 secret and token storage inventory (mandatory)

Run:

```bash
rg -n "(localStorage|sessionStorage|document\.cookie|Authorization|Bearer|jwt|token|refresh_token|access_token|id_token)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
find . -type f \( -name '*auth*' -o -name '*session*' -o -name '*token*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every token/session storage path as `httpOnly-cookie`, `browser-readable-storage`, or `server-only`. Verdict requirement: Q4 is not safe until every browser-readable token path is either proven test-only or reported.

### Q5 CORS and origin inventory (mandatory)

Run:

```bash
rg -n "(cors\(|Access-Control-Allow-Origin|allow_origins|allowedOrigins|CORS_ORIGIN|origin:\s*['\"]\*)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,yml,yaml,json}' .
find . -type f \( -name '*cors*' -o -name '*server*' -o -name '*app*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every origin decision as `explicit-allowlist`, `env-configured-allowlist`, or `wildcard`. Verdict requirement: Q5 is not safe until every wildcard or reflected-origin path is reported or proven dev-only gated.

### Q6 secret-reading and rate-limit inventory (mandatory)

Run:

```bash
rg -n "(process\.env|os\.environ|getenv|import\.meta\.env|Deno\.env|get_config|settings\.|SECRET|TOKEN|API_KEY|PRIVATE_KEY|PASSWORD|OPENAI|ANTHROPIC|SUPABASE|JWT)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
rg -n "(rateLimit|rate_limit|Limiter|throttle|slow_down|express-rate-limit|Flask-Limiter|Retry-After|429)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
find . -type f \( -name '.env*' -o -name '*secret*' -o -name '*config*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every secret-reading code path as `env-only`, `fallback-with-default`, or `hardcoded`. Classify every login/password-reset/AI entrypoint as `rate-limited`, `not-rate-limited`, or `unclear`. Verdict requirement: Q6 is not safe until both inventories are classified.
## Files most likely to have findings

Don't read everything. Read these files first:

- auth middleware
- session/token handling
- password hashing utility
- rate limiter config
- CORS config
- dependency manifest

If you exhaust these and the budget allows, expand outward. Otherwise,
report what you found and note what you didn't read.

## Process

1. **Re-read the rules.** R1-R7 apply to every finding. Especially R2
   (quote before cite) — for a domain skill running in a subagent, the
   subagent's context is fresh; don't assume you remember a file from
   a previous turn.

2. **Walk the key questions.** For each question, run the relevant
   detection commands (greps, file reads, schema lookups). Capture
   evidence at path:line. Verify by reading the actual code.

3. **Cross-reference orchestrator inputs.** If the orchestrator passed
   hard-stops or blind-spots findings tagged for this domain, include
   them in your report. Don't re-investigate; just include with the
   provided evidence.

4. **Triage.** For each finding, set severity per the audit rubric and
   exploitability per R4.

5. **Produce the domain report.**

## Output format

```
═══════════════════════════════════════════════════════════════════════
  DOMAIN 1: Security
═══════════════════════════════════════════════════════════════════════

▶ FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
What can a stranger break by visiting your site? This domain answers that, in concrete attack scenarios.

▶ TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-1.1 — <one-line title>
    Severity:        Critical | High | Medium | Low
    Exploitability:  EXPLOITABLE-NOW | EXPLOITABLE-LOW-EFFORT | BAD-PRACTICE | UNKNOWN
    Hard-stop:       H<N> if applicable
    Blind-spot:      B<N> if applicable

    Evidence:
      <path:line>  <one-line description>

    What's wrong:
      <one paragraph>

    Why it matters:
      <one sentence>

    Recommended fix:
      <one paragraph; for full fix prompt, use /audit-fix F-1.1>

    Verification after fix:
      <command>

  F-1.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 1]
```

If the domain has zero findings:

```
▶ TECHNICAL EVIDENCE

  ✅ No findings in this domain.

  Verification:
    <commands run that produced no signal>

  Confidence: High | Medium | Low
  Reason for low confidence: <if applicable>
```



## Failure modes to refuse

- ❌ Producing findings without path:line citations (R1)
- ❌ Citing a path you didn't read (R2)
- ❌ Re-running hard-stops or blind-spots walks (orchestrator did this)
- ❌ Including findings outside this domain's scope (route them to the
  right domain instead)
- ❌ Soft-pedaling a Critical to Medium because "it's a small app" (R3)
- ❌ Skipping section completion marker (R6)
---

## Codex Port Notes

- Audit mode is read-only for product code unless the user explicitly requests remediation.
- Treat `.claude/`, `.codex/`, `.agents/`, `.gitnexus/`, caches, `node_modules/`, virtualenvs, and generated build outputs as tooling or generated scope unless the finding is specifically repo hygiene.
- For context references written as `@.claude/context/<file>`, read `~/.codex/context\<file>` in Codex.
- Prefer PowerShell equivalents on Windows; use `rg` before `grep` and `Get-ChildItem` before Unix `find` when running in PowerShell.
- If GitNexus MCP tools are unavailable, use `.gitnexus/meta.json`, `.gitnexus/` artifacts, and `npx gitnexus` CLI as the fallback.
- Findings should also be representable as: `{id, domain, severity, exploitability, evidence_path, evidence_line, summary, impact, recommended_fix, verification}`.
