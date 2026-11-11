---
name: battle-test
description: 'Run a fail-closed end-to-end project hardening cycle: static audit, exhaustive real-browser validation, semantic screenshot review, multi-role/security/visual-regression probes, isolated remediation, and re-verification. Use when the user asks to battle-test or prove production readiness. Default is the full cycle; --quick runs a clearly weaker smoke/readiness check and can never emit a battle-tested verdict. Main integration requires --push-main; deployment is never automatic. --ux curates only UX/UI and ends with its own verdict (UX SCOPE VERIFIED or UX SCOPE FAILED), never battle-tested.'
---

# Battle Test

`/battle-test [project-path-or-name]` runs the full quality loop end-to-end and produces one
report: **diagnose → runtime-verify → harden → re-verify**. It does not reimplement those
capabilities — it conducts four existing skills (`audit-orchestrator`, `validation`,
`visual-route-sweep`, `quality-loop`; `--quick` adds `vibe-to-prod`) and gates between them.

```
/battle-test                 # current project
/battle-test ../crm          # a specific project path
/battle-test --resume        # continue a paused run
/battle-test --audit-only    # stop after diagnose (no fixes)
/battle-test --quick         # vibe-to-prod + validation smoke; no "battle-tested" verdict
/battle-test --push-main     # explicitly authorize integration after all gates pass
/battle-test --ux            # curate only UX/UI: own verdict, no integration (combine only with --resume)
```

## What it conducts (each is a separately-proven skill)

| Stage | Skill | Produces / signal to read |
| --- | --- | --- |
| 1. Diagnose | `audit-orchestrator` (the `/audit` pipeline) | `<repo>/audit-report.md` + `AUDIT VERDICT` block + `[AUDIT COMPLETE: ...]` token |
| 2. Baseline verify | `validation --full` (runs its own route/theme/viewport matrix, not that of `$visual-route-sweep`, then adds multi-role, element/modal/CRUD, security, and visual baseline checks) | `assert-coverage.js` and `certify-validation.js` both exit `0`; state has `completed`, `coverageComplete:true`, zero unaccounted, and clean health/multi-role/security/visual signals |
| 3. Harden | `quality-loop` | commits on `loop/<project>`; `TRACKS.md` AUTO/GATED |
| 4. Re-verify | `$visual-route-sweep` on the candidate build + `validation` compare + targeted `audit` re-check | current-build route matrix, re-run state, and visual-regression diff vs Stage-2 baseline |
| 5. Report | this skill | one HTML artifact under `<repo>/artifacts/` |

Load `references/stages.md` for the step-by-step of each stage, `references/gates.md` for how to
read every signal and where the human decisions are, and `references/report.md` for the unified
report. Run heavy stages as subagents (the audit pipeline already does) to keep this context lean.

## UX mode (`--ux`)

Curates only the UX/UI of a project, with one human pause: choosing which changes go. Combine it only
with `--resume`; refuse `--push-main`, `--quick` and `--audit-only`. It never integrates to main: it ends
with commits on the loop branch. Record `mode: ux` in state so `--resume` restores it. Per-stage steps
are in `references/stages.md` ("UX mode"), gates in `references/gates.md`, the verdict in
`references/report.md`.

| Stage | UX variant |
| --- | --- |
| 0. Preflight | Same worktree, app and roles; also keep `ux-findings.json`, `test-manifest/`, `.battle-test/` and `TRACKS.md` out of git |
| 1. Diagnose | `auditar-ux-producto` instead of `audit-orchestrator` (no `/audit`) → `C01..Cn` table → **operator chooses** → export |
| 2. Baseline | `visual-regression.js --update` over ALL routes; no semantic review |
| 3. Harden | `quality-loop --staged --from-tracks` in the same worktree, `ux` items only |
| 4. Re-verify | Full build/test gate, full visual compare, `validation --mode smoke` on touched routes, each `ac` replayed in a browser, `DESIGN.md` |
| 5. Report | Verdict `UX SCOPE VERIFIED` or `UX SCOPE FAILED`; never `BATTLE-TESTED`, never "ready" |

The design skills (impeccable, ui-ux-pro-max, emil-design-eng, taste-skill) are not stages: an item may
name one, only if it is installed. Findings that are not UX/UI are listed at the end of the report, not
fixed.

## Safety policy

- Work in one isolated worktree pinned to the recorded source SHA. Audit, baseline app, fixes, and
  re-verification must identify their exact SHA/build; evidence from another checkout is invalid.
- `quality-loop` works in that same worktree: hand it the worktree path and the recorded source SHA as
  its worktree and base (it skips its own setup).
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
4. **`--ux` only: choose the changes** (after `auditar-ux-producto`) → ask which compatible set or
   `Cnn` list goes; the rest is GATED. No question tool: write the decision as GATED and stop.

Everything else runs autonomously. A full run is multi-hour; it checkpoints after each stage and
resumes with `/battle-test --resume`. Self-pace long waits with `ScheduleWakeup`.

## Done

When AUTO hardening is drained and re-validation is green (or a budget is hit): write the unified
report, integrate only when `--push-main` was supplied, list the remaining GATED queue, and stop.
Never declare "battle-tested" while any Stage-4 re-validation is red or any critical
security/authz finding is unresolved, coverage is incomplete, screenshots remain unreviewed, or
the evidence SHA/build does not match the candidate commits. `--ux` never declares battle-tested: its
end state is the UX verdict in `references/gates.md`.
