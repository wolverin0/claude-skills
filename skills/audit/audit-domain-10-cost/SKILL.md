---
name: audit-domain-10-cost
description: Audit the cost and billing risk domain - runaway loops, unbounded LLM/API calls, missing rate limits on paid services, infrastructure cost amplifiers. Run as part of /audit Phase E.
---

# Skill: Audit Domain 10 - Cost & Billing Risk

This skill audits one specific domain. Run it as an isolated pass from the audit-orchestrator: either in a fresh delegated context when the host supports delegation, or sequentially in the main context when it does not. Load this skill and the audit rules, audit only the requested scope, and return a concise findings report.

## Pre-flight

```
view ../references/audit-rules.md
view ../references/domain-audit-contract.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them - don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: (none - this domain has no hard-stop classes routing to it)
- Blind spots that route to this domain: B3, B6

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Runaway loops, unbounded LLM/external API calls, missing rate limits on paid services, infrastructure cost amplifiers (oversized DB, over-provisioned compute), budget alerts.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Can a single user trigger an unbounded number of LLM calls (e.g., OpenAI, Anthropic)-
2. Are external API calls rate-limited per user-
3. Are there monthly budget alerts on the LLM / cloud account-
4. Is the infrastructure right-sized for current scale (no $500/month for 10 users)-
5. Are background jobs bounded in runtime / retries-
6. Are large-result queries (full table scans, unpaginated) bounded-


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q5, or Q6, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q1/Q2 paid API call inventory (mandatory)

Run:

```bash
rg -n "(OpenAI|openai\.|Anthropic|anthropic\.|MercadoPago|mercadopago|AWS|boto3|S3|Textract|Comprehend|Bedrock|Twilio|twilio\.|stripe\.|sendgrid|resend|elevenlabs|replicate)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,json,yml,yaml}' .
find . -type f \( -name '*client*' -o -name '*service*' -o -name '*integration*' -o -name '*billing*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every external paid API call as `quota-capped`, `unlimited`, or `per-request-limited`. Verdict requirement: Q1 and Q2 are not safe until every paid call path has a per-user and global cost-control classification.

### Q3 budget and infrastructure inventory (mandatory)

Run:

```bash
rg -n "(budget|alert|quota|limit|billing|cost|instance|replica|autoscale|autoscaling|size|plan|tier|vercel|render|railway|fly\.io|aws|gcp|azure|supabase)" -g '*.{tf,tfvars,yml,yaml,json,ts,js,py,md}' .
find . -type f \( -name '*infra*' -o -name '*terraform*' -o -name '*deploy*' -o -name '*billing*' -o -name '*budget*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each spend-control signal as `budget-alert-configured`, `quota-configured`, `right-sized`, or `no-cost-control-found`. Verdict requirement: Q3 and Q4 need this inventory before a no-finding verdict.

### Q5/Q6 background job and large-query inventory (mandatory)

Run:

```bash
rg -n "(cron|schedule|queue|worker|job|retry|while\s*\(|for\s*\(|findMany|findAll|select\(|limit\(|take:|page|pageSize|offset|cursor|batch|chunk)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,sql,yml,yaml}' .
find . -type f \( -name '*worker*' -o -name '*job*' -o -name '*queue*' -o -name '*cron*' -o -name '*repo*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each runtime/query path as `bounded-runtime`, `unbounded-runtime`, `paginated`, or `unbounded-result`. Verdict requirement: Q5 and Q6 are not safe until runaway job and large-result risks are classified.
## Files most likely to have findings

Don't read everything. Read these files first:

- LLM client wrappers
- external API client wrappers (Stripe, MercadoPago, etc.)
- rate limiter config
- background job runners
- infra config (Dockerfile resource limits, K8s requests)

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
  DOMAIN 10: Cost & Billing Risk
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
Could a single malicious user empty your bank account this month- Many vibe-coded LLM apps have unbounded API calls.

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-10.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-10.1>

    Verification after fix:
      <command>

  F-10.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 10]
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
