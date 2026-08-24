---
name: audit-domain-07-reliability
description: Audit the reliability domain — error handling, retries, idempotency, race conditions, partial failures, timeouts, graceful degradation. Run as part of /audit Phase E.
---

# Skill: Audit Domain 7 — Reliability & Edge Cases

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

- Hard stops related to this domain: H5
- Blind spots that route to this domain: B2, B5, B6, B10, B11, B16, B18

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Error handling completeness, retry logic, idempotency, race conditions, partial failures, timeouts, graceful degradation, circuit breakers, bulkheads.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine — every finding maps back to one of them.

1. Does every external call have a timeout?
2. Are retries bounded (no infinite retry loops)?
3. Are write operations idempotent where they need to be?
4. Are partial failures handled (multi-step ops that succeed halfway)?
5. Are exceptions logged with enough context to debug, or just swallowed?
6. Does the app degrade gracefully when a dependency is down?

### Vibe-coding specific checks (production-readiness)

Cite the playbook for depth: view ~/.codex/context\production-readiness-playbook.md

- Try-catch on every external call (payment/API/DB) with a fallback, not a blank screen (playbook L2, FM-6).
- Retry with exponential backoff on transient failures (playbook L12).
- Idempotency on user-initiated create/charge/submit actions (double-click must not double-charge) — not just webhooks (playbook B18, FM-9).
- A one-page incident runbook written during calm time (what to check first) (playbook L13, PRIN-8).
- Uptime monitoring that alerts before users notice (playbook L12, L13).
- Graceful degradation + circuit breakers for failing external services (playbook L13).
- Heavy operations are async (not inline in the request) (playbook B16, FM-9).


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q4, Q5, or Q6, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q1/Q6 external dependency timeout inventory (mandatory)

Run:

```bash
rg -n "(fetch\(|axios\.|requests\.|httpx\.|urllib|got\(|superagent|OpenAI|Anthropic|MercadoPago|stripe|twilio|sendgrid|supabase\.|s3\.|boto3|redis\.|createClient\()" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
find . -type f \( -name '*client*' -o -name '*service*' -o -name '*api*' -o -name '*integration*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every external call as `timeout-configured`, `no-timeout`, or `timeout-inherited`. Verdict requirement: Q1 and Q6 are not safe until every dependency call has a timeout/degradation classification.

### Q2/Q3 retry and idempotency inventory (mandatory)

Run:

```bash
rg -n "(retry|Retry|backoff|while\s*\(|for\s*\(|setInterval|queue|job|idempot|dedupe|lock|transaction|upsert|ON CONFLICT|unique)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,sql}' .
find . -type f \( -name '*job*' -o -name '*queue*' -o -name '*worker*' -o -name '*retry*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each retry/write path as `bounded-retry`, `unbounded-retry`, `idempotent-write`, or `non-idempotent-write`. Verdict requirement: Q2 and Q3 need this inventory before a no-finding verdict.

### Q4/Q5 error-handler inventory (mandatory)

Run:

```bash
rg -n "(try\s*\{|catch\s*\(|except\s+|finally\s*\{|rescue\s+|onError|\.catch\(|throw\s+|raise\s+)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
find . -type f \( -name '*error*' -o -name '*exception*' -o -name '*handler*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every try/catch or error handler as `logged+recovered`, `swallowed`, or `re-thrown`. Verdict requirement: Q4 and Q5 are not safe until swallowed errors and partial-failure paths are classified.
## Files most likely to have findings

Don't read everything. Read these files first:

- external API client wrappers
- any 'retry' / 'backoff' utility
- webhook handlers
- background job handlers
- transaction boundaries

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
  DOMAIN 7: Reliability & Edge Cases
═══════════════════════════════════════════════════════════════════════

▶ FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
When something goes wrong (network blip, DB hiccup, third-party outage) — does the app recover, or does it corrupt state?

▶ TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-7.1 — <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-7.1>

    Verification after fix:
      <command>

  F-7.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 7]
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
