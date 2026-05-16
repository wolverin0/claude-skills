---
name: audit-domain-11-demo-vs-prod
description: Audit the gap between demo-quality and production-quality - hardcoded test data, dev-only configurations shipped, missing prod hardening. Run as part of /audit Phase E.
---

# Skill: Audit Domain 11 - Demo-to-Production Gap

This skill audits one specific domain. Run it as an isolated pass from the audit-orchestrator: either in a fresh delegated context when the host supports delegation, or sequentially in the main context when it does not. Load this skill and the audit rules, audit only the requested scope, and return a concise findings report.

## Pre-flight

```
view ../references/audit-rules.md
view ../references/domain-audit-contract.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them - don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H8
- Blind spots that route to this domain: B5

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Hardcoded test data, dev-only configurations shipped to prod, missing prod hardening (CSP, HSTS, COOP/COEP), feature flags vs env config confusion, shipped TODOs.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Are there hardcoded test users / fake data in production code-
2. Are dev-only conveniences (verbose error pages, debug routes) gated by env-
3. Are CSP / HSTS / COOP / COEP / X-Frame-Options headers set-
4. Are TODO / FIXME / XXX markers present in critical paths-
5. Are 'temporary' workarounds documented, with removal criteria-


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q4, or Q5, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q1/Q2 hardcoded URL, seed, and mock inventory (mandatory)

Run:

```bash
rg -n "(localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|test@example|demo|mock|fake|seed|fixture|stub|dummy|hardcoded|DEBUG|DEV_ONLY|NODE_ENV|FLASK_ENV|ENVIRONMENT)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,json,yml,yaml,sql}' .
find . -type f \( -name '*seed*' -o -name '*mock*' -o -name '*fixture*' -o -name '*demo*' -o -name '*test*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every hardcoded URL / seed / mock as `dev-only-gated` or `leaking-to-prod`. Verdict requirement: Q1 and Q2 are not safe until every demo artifact is classified.

### Q3 production header inventory (mandatory)

Run:

```bash
rg -n "(Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|Cross-Origin-Opener-Policy|Cross-Origin-Embedder-Policy|helmet\(|secureHeaders|headers\(|HSTS|CSP)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,json,yml,yaml,toml}' .
find . -type f \( -name '*middleware*' -o -name '*server*' -o -name '*headers*' -o -name 'next.config.*' -o -name 'vercel.json' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each header as `set-in-prod`, `dev-only`, or `missing`. Verdict requirement: Q3 needs this inventory before a no-finding verdict.

### Q4/Q5 temporary-workaround inventory (mandatory)

Run:

```bash
rg -n "(TODO|FIXME|XXX|HACK|TEMP|temporary|workaround|remove before prod|for demo|not production|ship later|quick fix)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,md,sql,yml,yaml}' .
find . -type f \( -name '*todo*' -o -name '*known*' -o -name '*debt*' -o -name '*workaround*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each marker as `documented-with-removal-criteria`, `critical-path-undocumented`, or `non-critical`. Verdict requirement: Q4 and Q5 are not safe until production-impacting temporary work is classified.
## Files most likely to have findings

Don't read everything. Read these files first:

- main app config (settings.py, app.config)
- middleware setup
- anything matching /TEMP|TODO|FIXME|XXX|HACK/
- error pages / debug toolbar config

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
  DOMAIN 11: Demo-to-Production Gap
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
What 'temporary' code is still in production? Vibe-coded apps accumulate these like sediment.

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-11.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-11.1>

    Verification after fix:
      <command>

  F-11.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 11]
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
