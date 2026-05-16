---
name: audit-domain-08-compliance
description: Audit the legal/privacy/compliance signals - privacy policy alignment, data retention, GDPR/CCPA basics, cookie consent, export/delete capabilities. Run as part of /audit Phase E.
---

# Skill: Audit Domain 8 - Legal / Privacy / Compliance Signals

This skill audits one specific domain. Run it as an isolated pass from the audit-orchestrator: either in a fresh delegated context when the host supports delegation, or sequentially in the main context when it does not. Load this skill and the audit rules, audit only the requested scope, and return a concise findings report.

## Pre-flight

```
view ../references/audit-rules.md
view ../references/domain-audit-contract.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them - don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H1, H4
- Blind spots that route to this domain: (none - this domain has no blind-spot classes routing to it)

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Privacy policy / ToS presence and alignment, data retention policy, GDPR/CCPA basics (right-to-export, right-to-delete), cookie consent (if EU users), audit logs for sensitive data access.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Is there a privacy policy / ToS, and does the code match what it claims-
2. Is there a data retention policy, and are old records actually deleted-
3. Can a user export their data (GDPR Article 20)-
4. Can a user delete their data (GDPR Article 17)-
5. Is sensitive-data access audit-logged-
6. Are cookie consent flows present (if applicable)-


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q4, Q5, or Q6, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q2/Q3/Q4 PII storage and lifecycle inventory (mandatory)

Run:

```bash
rg -n "(email|phone|address|name|first_name|last_name|dni|document|passport|birth|dob|location|ip_address|user_agent|personal|profile|customer|delete|export|retention|erase|anonym)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,sql,json,yml,yaml}' .
find . -type f \( -name '*user*' -o -name '*profile*' -o -name '*customer*' -o -name '*privacy*' -o -name '*retention*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every place PII is stored as `encrypted-at-rest`, `plaintext`, or `unclear`. Classify lifecycle handlers as `export-supported`, `delete-supported`, `retention-enforced`, or `missing`. Verdict requirement: Q2-Q4 are not safe until PII storage and lifecycle paths are classified.

### Q5 PII logging and access audit inventory (mandatory)

Run:

```bash
rg -n "(console\.|logger\.|log\(|audit|Audit|access_log|email|phone|address|dni|document|user\.name|user\.email|profile|metadata|payload|request\.body|req\.body)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
find . -type f \( -name '*log*' -o -name '*audit*' -o -name '*middleware*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every place PII is logged or sensitive-data access is recorded as `audit-logged-minimal`, `plaintext-logged`, or `not-audit-logged`. Verdict requirement: Q5 is not safe until PII-in-logs and missing audit logs are classified.

### Q1/Q6 policy and consent inventory (mandatory)

Run:

```bash
find . -type f \( -iname '*privacy*' -o -iname '*terms*' -o -iname '*tos*' -o -iname '*cookie*' -o -iname '*consent*' \) -not -path './node_modules/*' -not -path './.git/*'
rg -n "(privacy policy|terms of service|cookie|consent|gdpr|ccpa|analytics|tracking|gtag|pixel|posthog|mixpanel|segment)" -g '*.{md,mdx,tsx,jsx,html,ts,js,json,yml,yaml}' .
```

Classify each policy/consent signal as `implemented-and-linked`, `document-only`, `code-only`, or `missing`. Verdict requirement: Q1 and Q6 need this inventory before a no-finding verdict.
## Files most likely to have findings

Don't read everything. Read these files first:

- privacy policy file (if in repo)
- data export / delete endpoints
- audit log infrastructure
- cookie / consent components

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
  DOMAIN 8: Legal / Privacy / Compliance Signals
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
Are you legally OK- Most vibe-coded apps haven't thought past 'login works.'

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-8.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-8.1>

    Verification after fix:
      <command>

  F-8.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 8]
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
