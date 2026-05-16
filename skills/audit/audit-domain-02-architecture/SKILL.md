---
name: audit-domain-02-architecture
description: Audit the architecture and code quality domain - module boundaries, abstraction layers, code organization, naming, documentation. Run as part of /audit Phase E.
---

# Skill: Audit Domain 2 - Architecture & Code Quality

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
- Blind spots that route to this domain: B12

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Module boundaries, layering, separation of concerns, dependency direction, abstraction quality, naming consistency, documentation, technical debt indicators.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Do modules have clear single responsibilities, or are concerns mixed-
2. Is business logic separated from HTTP handling-
3. Is the dependency direction sane (UI -> service -> repo -> DB), or does it cycle-
4. Are similar concerns (e.g., 'utility') consolidated, or scattered across utils/helpers/lib-
5. Are abstractions earning their complexity, or premature-
6. Is code documented where it needs to be (public APIs, complex algorithms)-
7. Are modules deep (small interface, large leverage) or shallow (interface nearly as complex as implementation)-
8. Are friction points present - concepts whose understanding requires bouncing through 3+ files-


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q4, or Q8, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q2 HTTP-to-business-logic inventory (mandatory)

Run:

```bash
rg -n "(app\.(get|post|put|patch|delete)|router\.(get|post|put|patch|delete)|@app\.route|@router\.|Controller|Route\(|FastAPI\(|Blueprint\()" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
find . -type f \( -name '*route*' -o -name '*controller*' -o -name '*handler*' -o -name '*api*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every route/handler as `thin-delegator`, `mixed-business-logic`, or `unclear`. Verdict requirement: Q2 is not safe until mixed handlers are either justified as trivial or reported.

### Q3 cross-module import boundary inventory (mandatory)

Run:

```bash
rg -n "^(import|from)\s+|require\(|import\(" -g '*.{ts,tsx,js,jsx,mjs,cjs,py}' .
rg -n "using\s+|namespace\s+|import\s+" -g '*.{cs,java,go}' .
find . -type f \( -name 'index.ts' -o -name 'index.js' -o -name '__init__.py' -o -name 'mod.rs' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every cross-module import boundary as `intended`, `unexpected-coupling`, or `unclear`. Verdict requirement: Q3 is not safe until dependency-direction violations and cycles have an explicit classification.

### Q4/Q8 scattering and friction inventory (mandatory)

Run:

```bash
find . -type d \( -iname '*util*' -o -iname '*helper*' -o -iname '*common*' -o -iname '*shared*' -o -iname '*lib*' \) -not -path './node_modules/*' -not -path './.git/*'
rg -n "(TODO|FIXME|HACK|workaround|temporary|shared|common|helper|util)" -g '*.{ts,tsx,js,jsx,mjs,cjs,py,go,java,cs,php,rb}' .
```

Classify each shared/helper cluster as `cohesive-module`, `scattered-duplicate-concern`, or `unclear`. Classify each 3+ file concept trace as `intentional-layering` or `friction-point`. Verdict requirement: Q4 and Q8 need this inventory before a no-finding verdict.
## Architectural heuristics (Ousterhout-derived)

Apply these alongside the questions above. They sharpen the smell tests
for premature/shallow abstraction (Q5, Q7) and locality failure (Q8).

### The deletion test (for Q5, Q7)

For any wrapper, helper, or thin abstraction layer: ask "if this module
were deleted and its body inlined into callers, would complexity
*concentrate* (callers gain duplication / lose locality) or *evaporate*
(callers stay readable, the module added no leverage)-"

- **Concentrates -> earns its keep.** Deep module. Not a finding.
- **Evaporates -> shallow.** Flag as F-2.x with severity Low/Medium
  depending on caller blast radius. Cite >=2 caller sites to prove the
  inline would be tractable.

This is the empirical anchor for "premature abstraction" findings -
without it, the call is a matter of taste.

### The two-adapter rule (for Q5)

A single adapter / strategy / interface implementation is a *speculative
seam*. Two or more concrete implementations of the same interface is a
*real seam*. Vibe-coded codebases routinely ship interfaces with one
adapter "for testability" or "for future flexibility" that never
materializes.

- 1 adapter behind an interface -> flag as speculative-seam (Low unless
  it adds runtime indirection cost, then Medium).
- 2+ adapters -> legitimate; do not flag.
- 0 adapters but interface defined -> dead seam, flag as Medium.

### Friction-point framing (for Q8)

When tracing how one concept (e.g., "how a payment is recorded")
requires reading 3+ files in different directories before the picture
closes, that's a locality failure - knowledge is smeared, not
concentrated. Report as a finding even when each individual file is
fine; the cost is in the aggregate. Cite the bounce path:

```
Friction: tracing 'payment recording' requires reading
  src/api/payments.ts:42  -> enqueues to bus
  src/jobs/processor.ts:88 -> consumes
  src/db/payments.ts:15   -> persists
  src/lib/audit-log.ts:30 -> side-effect
  (no module owns the lifecycle; no doc names this flow)
```

## Files most likely to have findings

Don't read everything. Read these files first:

- main entry point
- module structure (top-level directories)
- any 'utils' / 'helpers' / 'lib' directories
- shared / common modules

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
  DOMAIN 2: Architecture & Code Quality
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
How well-organized is the code- Will a new engineer understand it in a week, or never-

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-2.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-2.1>

    Verification after fix:
      <command>

  F-2.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 2]
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
