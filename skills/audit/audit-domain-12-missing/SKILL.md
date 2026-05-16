---
name: audit-domain-12-missing
description: Audit what a normal production app at this scale would have but is absent - health checks, error tracking, feature flags, audit logs, on-call. Run as part of /audit Phase E.
---

# Skill: Audit Domain 12 - What's Missing But Expected

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
- Blind spots that route to this domain: (none - this domain has no blind-spot classes routing to it)

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

What's absent that should be present at this stage: health checks, error tracking (Sentry/etc.), feature flags, audit logs, on-call rotation, runbooks, incident response process.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Is there a /health endpoint-
2. Is error tracking integrated (Sentry, Rollbar, Honeycomb)-
3. Is there a feature-flag system, or is everything env-toggled-
4. Are sensitive operations (admin changes, deletes) audit-logged-
5. Is there an on-call rotation / runbook-
6. Are backups configured and tested-


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q4, Q5, or Q6, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q1/Q2 health and observability inventory (mandatory)

Run:

```bash
rg -n "(/health|/ready|/live|healthcheck|readiness|liveness|Sentry|Rollbar|Honeycomb|Datadog|NewRelic|OpenTelemetry|otel|captureException|tracing|metrics)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,json,yml,yaml,toml}' .
find . -type f \( -name '*health*' -o -name '*observability*' -o -name '*sentry*' -o -name '*telemetry*' -o -name '*metrics*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each operational signal as `runtime-wired`, `declared-only`, or `missing`. Verdict requirement: Q1 and Q2 are not safe until health and error-tracking paths are classified.

### Q3 feature-flag inventory (mandatory)

Run:

```bash
rg -n "(featureFlag|feature_flag|FeatureFlag|flags\.|useFlag|isEnabled|LaunchDarkly|Unleash|growthbook|posthog\.isFeatureEnabled|process\.env\.[A-Z0-9_]*(FLAG|ENABLE|DISABLE|FEATURE))" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,json,yml,yaml}' .
find . -type f \( -name '*flag*' -o -name '*feature*' -o -name '*config*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every feature-flag definition as `consumed-in-runtime` or `orphan`. Verdict requirement: Q3 is not safe until env toggles and flag definitions are inventoried and classified.

### Q4/Q5/Q6 audit-log, runbook, and backup inventory (mandatory)

Run:

```bash
rg -n "(audit|AuditLog|admin|delete|destroy|backup|restore|snapshot|dump|pg_dump|runbook|on-call|incident|pager|rotation|RTO|RPO)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb,sql,md,yml,yaml,json,toml}' .
find . -type f \( -name '*audit*' -o -name '*backup*' -o -name '*restore*' -o -name '*runbook*' -o -name '*incident*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each operational control as `implemented-and-tested`, `implemented-untested`, `documented-only`, or `missing`. Verdict requirement: Q4-Q6 need this inventory before a no-finding verdict.
## Files most likely to have findings

Don't read everything. Read these files first:

- anywhere a /health route would be
- main app initialization (where Sentry would init)
- any 'feature_flag' module
- audit log infrastructure
- backup scripts

If you exhaust these and the budget allows, expand outward. Otherwise,
report what you found and note what you didn't read.

## Process

1. **Re-read the rules.** R1-R7 apply to every finding. Especially R2
   (quote before cite) - for a domain skill running as an isolated pass, the
   audit context is fresh; don't assume you remember a file from
   a previous turn.

2. **Enumerate feature flags before verdict.** Grep the codebase and DB
   migrations for every feature-flag definition before checking usage.
   Include flags defined in SQL seed data, migrations, config constants,
   admin UI options, backend services, env defaults, and documentation
   that claims runtime support. Produce the complete list first.

3. **Run mandatory feature-flag checks.** These checks exist because the
   v4 remediation comparison found Domain 12 accepted "feature flag
   system exists" and missed flags that were defined but not consumed.

   - For each defined flag, grep for its runtime read/consumer path in
     frontend, backend, workers, middleware, and scheduled jobs. A flag
     that is defined or editable but never read at runtime is a HIGH
     finding.
   - For each admin/API path that creates, updates, deletes, or toggles a
     feature flag, verify the change is written to the audit log with
     actor, target flag, old value, new value, timestamp, and request
     context where available. Feature-flag changes without audit logging
     are a finding.
   - Do not treat storage tables, CRUD screens, or env variables as a real
     feature-flag system until a runtime consumer is proven for each flag.

4. **Walk the key questions.** For each question, run the relevant
   detection commands (greps, file reads, schema lookups). Capture
   evidence at path:line. Verify by reading the actual code.

5. **Cross-reference orchestrator inputs.** If the orchestrator passed
   hard-stops or blind-spots findings tagged for this domain, include
   them in your report. Don't re-investigate; just include with the
   provided evidence.

6. **Triage.** For each finding, set severity per the audit rubric and
   exploitability per R4.

7. **Produce the domain report.**

## Output format

```
=======================================================================
  DOMAIN 12: What's Missing But Expected
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
What would an experienced engineer expect to see in a production app, that this app doesn't have- Absence is itself a signal.

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-12.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-12.1>

    Verification after fix:
      <command>

  F-12.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 12]
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
