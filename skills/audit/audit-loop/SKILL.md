---
name: audit-loop
description: Orchestrate the full audit improvement cycle: audit, roadmap, remediation, rerun, delta comparison, and skill patching for missed findings until convergence or a terminal blocked state.
---

# Skill: Audit Loop

Use this skill when the user wants the audit kit to drive an improvement
cycle instead of a one-time report.

This skill coordinates existing audit skills. It does not replace
`audit-orchestrator`; it calls it repeatedly and compares outputs.

---

## Loop Contract

Run this cycle:

1. Run `audit-orchestrator` against the requested scope and write a fresh
   audit report.
2. Generate a remediation roadmap from the report findings.
3. Execute remediation or dispatch remediation work as requested.
4. Re-run `audit-orchestrator` against the same scope.
5. Compare the last two audit reports and classify the delta:
   - fixed findings
   - unchanged findings
   - severity changes
   - new findings
6. If new findings appear, patch the audit skill that missed them before
   starting the next loop. Use the report's "why missed" or comparison
   rationale to identify the failing skill and add an enumeration,
   grep, trace, or success-semantics check that would have caught it.
7. Continue until the convergence rule is met or a terminal blocked
   state is reached.

---

## Convergence Rule

The loop terminates only when both conditions are true:

- All findings are `RESOLVED`, `BLOCKED-EXTERNAL`, or `BLOCKED-POLICY`.
- The delta between the last two audit runs shows zero new findings.

Do not treat "no time left", "not currently visible", or "probably
fixed" as convergence.

---

## BLOCKED Item Tactics

Use these tactics for items that cannot be remediated directly in the
current repo. They come from claim `mm-9af7` and are mandatory.

### Dirty-tree stash

If uncommitted changes block a command or verification step:

1. Inspect `git status` and identify unrelated dirty paths.
2. Stash only when needed to run the step.
3. Run the blocked step.
4. Pop the stash and verify the worktree returned to its previous state.
5. Record the tactic in the loop notes.

### External-action doc

If a finding requires action outside the repo, create or update
`external-actions-required.md` with:

- Finding ID
- External owner or system
- Required action
- Evidence needed to unblock
- Review date

Mark the finding `BLOCKED-EXTERNAL`.

### Baseline-policy banner

If the team deliberately accepts a policy exception, invoke
`audit-decisions`, add a structured entry to `baseline-policy.md`, and
mark the finding `BLOCKED-POLICY`. `BLOCKED-POLICY` counts as resolved
for convergence only while the policy entry is complete, approved, and
not expired.

---

## Delta Report Format

Each loop iteration must produce:

```
AUDIT LOOP ITERATION <N>

Previous report: <path>
Current report:  <path>
Roadmap:         <path>

Delta:
  Fixed:            <count>
  Unchanged:        <count>
  Severity changed: <count>
  New findings:     <count>

New findings:
  <Finding ID> - <summary>
    Missed by: <skill>
    Skill patch required: yes/no
    Patch summary: <what changed>

Blocked:
  <Finding ID> - BLOCKED-EXTERNAL | BLOCKED-POLICY
    Gate file: external-actions-required.md | baseline-policy.md

Convergence: READY | LOOP AGAIN | TERMINAL BLOCKED
```

---

## Failure Modes To Refuse

- Marking convergence while new findings still appear in the latest delta.
- Marking `BLOCKED-POLICY` without a complete baseline-policy entry.
- Marking legal/privacy/security policy exceptions accepted without
  running `audit-decisions`.
- Patching product code when the user only requested audit-loop planning.
- Patching an audit skill without explaining which missed-finding pattern
  the patch closes.

[SECTION COMPLETE: audit-loop]
