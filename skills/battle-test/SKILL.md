---
name: battle-test
description: 'Run a fail-closed end-to-end project hardening cycle: static audit, exhaustive real-browser validation, semantic screenshot review, multi-role/security/visual-regression probes, isolated remediation, and re-verification. Use when the user asks to battle-test or prove production readiness. Default is the full cycle; --quick runs a clearly weaker smoke/readiness check and can never emit a battle-tested verdict. Main integration requires --push-main; deployment is never automatic.'
---

# Battle Test

`/battle-test [project-path-or-name]` runs the full quality loop end-to-end and produces one
report: **diagnose → runtime-verify → harden → re-verify**. It does not reimplement those
capabilities — it conducts three existing skills and gates between them.

```
/battle-test                 # current project
/battle-test ../crm          # a specific project path
/battle-test --resume        # continue a paused run
/battle-test --audit-only    # stop after diagnose (no fixes)
/battle-test --quick         # vibe-to-prod + validation smoke; no "battle-tested" verdict
/battle-test --push-main     # explicitly authorize integration after all gates pass
```

## What it conducts (each is a separately-proven skill)

| Stage | Skill | Produces / signal to read |
| --- | --- | --- |
| 1. Diagnose | `audit-orchestrator` (the `/audit` pipeline) | `<repo>/audit-report.md` + VERDICT line + `[AUDIT COMPLETE]` |
| 2. Baseline verify | `validation --full` (delegates its route/theme/viewport matrix to `$visual-route-sweep`, then adds multi-role, element/modal/CRUD, security, and visual baseline checks) | state has `completed`, `coverageComplete:true`, zero unaccounted; coverage/multi-role/security/visual exits |
| 3. Harden | `quality-loop` | commits on `loop/<project>`; `TRACKS.md` AUTO/GATED |
| 4. Re-verify | `$visual-route-sweep` on the candidate build + `validation` compare + targeted `audit` re-check | current-build route matrix, re-run state, and visual-regression diff vs Stage-2 baseline |
| 5. Report | this skill | one HTML artifact under `<repo>/artifacts/` |

Load `references/stages.md` for the step-by-step of each stage, `references/gates.md` for how to
read every signal and where the human decisions are, and `references/report.md` for the unified
report. Run heavy stages as subagents (the audit pipeline already does) to keep this context lean.

## Safety policy

- Work in one isolated worktree pinned to the recorded source SHA. Audit, baseline app, fixes, and
  re-verification must identify their exact SHA/build; evidence from another checkout is invalid.
- Without `--push-main`, stop with proven commits on the loop branch. With `--push-main`, integrate
  only after the quality-loop gate and Stage-4 exhaustive re-validation both pass.
- **Deploy is never automatic.** `vercel --prod` and equivalents are always a GATED operator item.
- **Minimal diffs, no rewrites, no scope creep** (inherited from quality-loop).

## Hard prerequisite (the one thing that needs a human)

Stages 2 and 4 drive a **real browser against a running app**. Before they can run you need:
1. the app running at a URL (dev/preview server), and
2. `validation.config.json` with `roles[]` + credentials supplied via env vars (never in files).

Stage 0 reconciles a code scan and runtime crawl into `validation.config.json` with routes, modals,
flows, CRUD modules, backend API endpoints, roles, and `inventoryComplete:true`. If the URL, inventory, or credentials are
missing, stop and ask rather than validating the login screen. Public-only apps skip roles.

## Operator gates (the only times it pauses for you)

1. **Hard stops found** (audit verdict 🛑/🔴) → ask: fix-first / proceed / stop.
2. **Missing running app or credentials** → ask for the URL + creds, or queue as GATED.
3. **Push without `--push-main`, deploy, or platform actions** → queue as GATED, never auto-run.

Everything else runs autonomously. A full run is multi-hour; it checkpoints after each stage and
resumes with `/battle-test --resume`. Self-pace long waits with `ScheduleWakeup`.

## Done

When AUTO hardening is drained and re-validation is green (or a budget is hit): write the unified
report, integrate only when `--push-main` was supplied, list the remaining GATED queue, and stop.
Never declare "battle-tested" while any Stage-4 re-validation is red or any critical
security/authz finding is unresolved, coverage is incomplete, screenshots remain unreviewed, or
the evidence SHA/build does not match the candidate commits.
