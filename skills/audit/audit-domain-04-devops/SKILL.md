---
name: audit-domain-04-devops
description: Audit the infra and DevOps domain - CI/CD, deployment, IaC, secrets management, environments, logging, observability. Run as part of /audit Phase E.
---

# Skill: Audit Domain 4 - Infrastructure & DevOps

This skill audits one specific domain. Run it as an isolated pass from the audit-orchestrator: either in a fresh delegated context when the host supports delegation, or sequentially in the main context when it does not. Load this skill and the audit rules, audit only the requested scope, and return a concise findings report.

## Pre-flight

```
view ../references/audit-rules.md
view ../references/domain-audit-contract.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them - don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H4
- Blind spots that route to this domain: B5

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

CI/CD pipelines, deployment scripts, Infrastructure-as-Code, secrets management, environment configuration (dev/staging/prod), logging, observability, monitoring, on-call.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Is the deployment process scripted and version-controlled, or manual-
2. Are secrets handled by a real secret manager, or env vars on disk-
3. Are environments (dev/staging/prod) properly isolated-
4. Is logging centralized and searchable-
5. Are basic metrics (request rate, error rate, p50/p95 latency) collected-
6. Is there an on-call setup / alerting-
7. Are CI workflows tested as part of code review-

## Files most likely to have findings

Don't read everything. Read these files first:

- .github/workflows/ or equivalent
- Dockerfile / docker-compose.yml
- deployment scripts
- env example files
- logging config

If you exhaust these and the budget allows, expand outward. Otherwise,
report what you found and note what you didn't read.

## Process

1. **Re-read the rules.** R1-R7 apply to every finding. Especially R2
   (quote before cite) - for a domain skill running as an isolated pass, the
   audit context is fresh; don't assume you remember a file from
   a previous turn.

2. **Enumerate before verdict.** List every CI/deploy/security workflow
   first, then audit each listed workflow. Do not conclude "CI exists"
   from a trigger or filename alone. The verdict must be about success
   semantics: which commands run, whether failures fail the job, whether
   deploy actually deploys, and whether missing secrets/env make the
   workflow fail closed.

3. **Run mandatory shortcut-audit checks.** These checks exist because
   the v4 remediation comparison found DevOps audits treated automation
   presence as a gate and missed miswired success behavior.

   - Security scan gate check: grep every workflow for
     `continue-on-error: true`, `continue-on-error:true`, `exit-code: 0`,
     and `exit-code: '0'` on security scan steps such as Trivy, npm audit,
     Snyk, CodeQL wrappers, or custom vulnerability scans. Any match on a
     security-scan path is a finding unless a later explicit blocking gate
     proves the scan still fails the workflow.
   - Frontend build env injection check: enumerate all frontend build-time
     env vars from Vite/Next/frontend config and browser source
     (`VITE_*`, `NEXT_PUBLIC_*`, equivalent public build prefixes). Verify
     each one is injected into the deploy workflow or documented as
     intentionally absent for that deploy target. A required build env var
     missing from deploy workflow injection is a finding.
   - Deploy success-semantics check: for each deploy workflow, prove that
     an action intended to deploy cannot finish green when deploy secrets,
     environment IDs, artifact upload, or provider CLI calls are missing.
     "Workflow dispatch exists", "runs on main", or "has a deploy job" is
     only trigger presence and is not sufficient.

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
  DOMAIN 4: Infrastructure & DevOps
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
What happens when you push to main- What happens at 3am when it breaks- This is operational maturity.

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-4.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-4.1>

    Verification after fix:
      <command>

  F-4.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 4]
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
