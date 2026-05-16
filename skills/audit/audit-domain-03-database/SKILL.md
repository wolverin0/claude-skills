---
name: audit-domain-03-database
description: Audit the database and data layer - schema design, query patterns, migrations, indexing, RLS, soft-delete, transactions. Run as part of /audit Phase E.
---

# Skill: Audit Domain 3 - Database & Data Layer

This skill audits one specific domain. Run it as an isolated pass from the audit-orchestrator: either in a fresh delegated context when the host supports delegation, or sequentially in the main context when it does not. Load this skill and the audit rules, audit only the requested scope, and return a concise findings report.

## Pre-flight

```
view ../references/audit-rules.md
view ../references/domain-audit-contract.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them - don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H1, H7
- Blind spots that route to this domain: B3, B4

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Schema design, foreign keys, constraints, indexing, query patterns (N+1, full-table scans), migrations, soft-delete handling, transactions, RLS / row-level access.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine - every finding maps back to one of them.

1. Are foreign keys defined and enforced-
2. Are indexes present on every column queried by WHERE / JOIN / ORDER BY-
3. Are queries free of N+1 patterns-
4. Are migrations forward-only, or do they get edited after running-
5. Is RLS enabled on user-data tables (Postgres), or app-level enforcement provably correct-
6. Are soft-delete columns filtered in every read query-
7. Are transactions used where multiple writes must be atomic-
8. **Are RLS policies actually restrictive, or do they use permissive shortcuts that defeat their purpose-** (Q8 was added 2026-05-10 after a remediation pass shipped a migration with `using (true)` as the "fix" for a prior `using (true)` finding. Verification ("migration applies cleanly") missed that the new migration replicated the anti-pattern.)

## Permissive-RLS sweep (mandatory for Q8)

Before producing findings, run ALL of these greps GLOBALLY across every
SQL file in the repo (migrations, seeds, RPC definitions, grants files):

```bash
# Anti-patterns that defeat RLS:
rg -n "using\s*\(\s*true\s*\)" -g '*.sql'
rg -n "using\s*\(\s*auth\.role\(\)\s*=\s*'authenticated'\s*\)" -g '*.sql'
rg -n "with\s+check\s*\(\s*true\s*\)" -g '*.sql'
rg -n "for\s+(select|insert|update|delete|all)\s+to\s+authenticated\s+using\s*\(\s*true\s*\)" -g '*.sql'

# Bypasses:
rg -n "alter\s+table\s+\w+\s+disable\s+row\s+level\s+security" -g '*.sql'
rg -n "force\s+row\s+level\s+security" -gV '*.sql'  # NOT having this on sensitive tables is a smell

# Service-role abuse (RLS-bypass code path):
rg -n "service_role|SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdmin\(\)" -g '*.{ts,tsx,js,jsx,mjs,cjs}'
```

Every match of the first three patterns is a Critical or High finding
(severity depends on the table's data sensitivity). Match means: a row
is exposed to ANY authenticated user, regardless of ownership.

Required verification for every RLS fix the audit recommends:

```sql
-- Adversarial RLS test: as user A, attempt to read user B's row.
-- Expected: 0 rows returned, NOT an error.
set local role authenticated;
set local request.jwt.claims = '{"sub":"<user_a_uuid>","role":"authenticated"}';
select * from <table> where <ownership_column> = '<user_b_uuid>';
-- if this returns >0 rows, the RLS policy is permissive.
```

Flag any RLS finding whose recommended fix only says "apply migration"
without specifying the adversarial test the migration must pass.

## Migration self-violation check

When a migration claims to FIX an RLS issue (filename contains
`rls`, `policy`, `tenant`, `isolation`, `security`, or migration commit
message references a prior audit finding), grep that file for the same
permissive patterns above. Findings that fix RLS by writing more
permissive RLS are a regression class - flag with severity High and
include `Recommended fix:` that explicitly states the adversarial test
must pass post-remediation, not just "migration applies".

## Files most likely to have findings

Don't read everything. Read these files first:

- schema files / migrations
- ORM model definitions
- any 'repo' / 'dao' / 'data' modules
- DB connection config

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
  DOMAIN 3: Database & Data Layer
=======================================================================

> FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
How is the data stored, queried, and protected- This is where breaches happen and where slowness compounds.

> TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-3.1 - <one-line title>
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
      <one paragraph; for full fix prompt, use /audit-fix F-3.1>

    Verification after fix:
      <command>

  F-3.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 3]
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
