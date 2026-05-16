---
name: audit-domain-01-security
description: Audit the security domain - auth, authz, secrets, transport, sensitive data exposure, dependency CVEs. Run as part of /audit Phase E.
---

# Skill: Audit Domain 1 - Security

This skill audits one specific domain. Run it as an isolated pass from the audit-orchestrator: either in a fresh delegated context when the host supports delegation, or sequentially in the main context when it does not. Load this skill and the audit rules, audit only the requested scope, and return a concise findings report.

## Pre-flight

```
view ../references/audit-rules.md
view ../references/domain-audit-contract.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them - don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H1, H2, H3, H6, H7, H8
- Blind spots that route to this domain: B1, B7, B8

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Authentication, authorization, session management, secrets handling, transport security (TLS), CORS, CSRF, rate limiting, input validation, output encoding, dependency vulnerabilities (CVEs).

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Is auth wired to every protected route, not just defined-
2. Are sessions invalidated on logout server-side-
3. Are passwords hashed with a slow algorithm (bcrypt/argon2)-
4. Are tokens in httpOnly cookies, not localStorage-
5. Is CORS scoped to specific origins, not `*`-
6. Is rate limiting in place on login, password reset, and AI calls-
7. Are dependencies free of known high/critical CVEs-
8. Are TLS certs valid, modern, and HSTS-enforced-


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
   (quote before cite) - for a domain skill running as an isolated pass, the
   audit context is fresh; don't assume you remember a file from
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
=======================================================================
  DOMAIN 1: Security
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
What can a stranger break by visiting your site- This domain answers that, in concrete attack scenarios.

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-1.1 - <one-line title>
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
> TECHNICAL EVIDENCE

  PASS: No findings in this domain.

  Verification:
    <commands run that produced no signal>

  Confidence: High | Medium | Low
  Reason for low confidence: <if applicable>
```



## Failure modes to refuse

- FAIL: Producing findings without path:line citations (R1)
- FAIL: Citing a path you didn't read (R2)
- FAIL: Re-running hard-stops or blind-spots walks (orchestrator did this)
- FAIL: Including findings outside this domain's scope (route them to the
  right domain instead)
- FAIL: Soft-pedaling a Critical to Medium because "it's a small app" (R3)
- FAIL: Skipping section completion marker (R6)
---

## Codex Port Notes

- Audit mode is read-only for product code unless the user explicitly requests remediation.
- Treat `.claude/`, `.codex/`, `.agents/`, `.gitnexus/`, caches, `node_modules/`, virtualenvs, and generated build outputs as tooling or generated scope unless the finding is specifically repo hygiene.
- Prefer PowerShell equivalents on Windows; use `rg` before `grep` and `Get-ChildItem` before Unix `find` when running in PowerShell.
- If GitNexus MCP tools are unavailable, use `.gitnexus/meta.json`, `.gitnexus/` artifacts, and `npx gitnexus` CLI as the fallback.
- Findings should also be representable as: `{id, domain, severity, exploitability, evidence_path, evidence_line, summary, impact, recommended_fix, verification}`.
