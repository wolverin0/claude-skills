---
disable-model-invocation: true
description: End-to-end audit + remediation. Audits the repo, fixes findings on an isolated branch with per-fix verification, re-audits until the verdict is green (or budget/rounds run out), and opens a PR for review. Never merges, never touches main. Runs as a deterministic multi-agent Workflow. Args: --scope=<path>, --max-rounds=<N>.
allowed-tools: Bash, Read, Grep, Glob, Task, Skill
---

# /audit-remediate — full audit → fix → re-review → PR

This launches the `audit-remediate` **Workflow** against the current repo. It is the
heavyweight, hands-off path: a deterministic loop that parallel-audits, serially
remediates on a branch with verification, re-audits, and opens a PR. You review the
PR — the workflow never merges and never touches `main`.

> For a quick read-only check use `/vibe-to-prod` (5 min) or `/audit` (read-only report).
> Use `/audit-remediate` when you actually want the fixes applied and a PR opened.

## What to do RIGHT NOW

1. Parse `$ARGUMENTS`: `--scope=<path>` (default `.`), `--max-rounds=<N>` (default 4).
2. Get today's date as a stamp (the Workflow can't read the clock): run
   `date +%Y%m%d` (bash) or `Get-Date -Format yyyyMMdd` (PowerShell).
3. Confirm with the user in ONE line that this will create a branch and open a PR
   (a full audit is ~40–70 min; the whole loop is hours). Proceed on yes.
4. Launch the Workflow:

   ```
   Workflow({
     scriptPath: "~/.claude/workflows/audit-remediate.mjs",
     args: { scope: "<scope>", stamp: "<YYYYMMDD>", maxRounds: <N> }
   })
   ```

   (If your install registered it as a named workflow, `Workflow({ name: "audit-remediate", args: {...} })` also works.)

5. When it completes, relay the returned summary: status (green / partial /
   rounds-exhausted / budget-exhausted), rounds run, findings remaining, blocked
   count, the branch name, and the PR url. Surface the "HUMAN ACTION REQUIRED" list
   prominently — those are the things only you can do (rotate a leaked key, enable RLS
   in a dashboard, buy a paid tier, run a data migration).

## Guarantees (by design)

- Read-only audit; remediation only on a dedicated branch; never merges; never force-pushes.
- Each fix is verified against the cumulative branch state (tests + the finding's own
  verification) before it is committed; unverifiable fixes are reverted and reported.
- A test is never weakened or deleted to go green (that is the H9/B13 failure mode).
- The loop is bounded by `maxRounds` and the token budget, and is resumable.
