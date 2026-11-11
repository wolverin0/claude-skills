# 04 - Audit only: diagnosis without fixes

Command: `/battle-test --audit-only`

## When to use it

You want to know how the project is doing before deciding what to fix. It runs the preflight and the stage 1 audit and stops there.
It does not touch the project's code: there is no fix stage.

## What it does

- Preflight (stage 0): resolves the project, records `HEAD` and the SHA, creates an isolated worktree and builds `validation.config.json`.
- Diagnosis (stage 1): uses `audit-orchestrator` with the project scope (about 40 to 70 minutes) and waits for the `[AUDIT COMPLETE: ...]` or `[AUDIT TRUNCATED: <reason>]` signal.
- Reads `audit-report.md` and the `AUDIT VERDICT` block.
- If the verdict is 🛑 or 🔴, it asks you fix-first / proceed / stop.
- Extracts the findings list (`F-...`, with severity and `path:line`) into the run state.
- Writes the report and stops there.

## What it does not do

- It fixes nothing: it does not run the baseline, quality-loop or the re-verification.
- It does not integrate to main, it does not deploy.
- It does not use `--ux`: `--ux` rejects `--audit-only`. For a UX audit without fixes, case 09.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm that --audit-only exists ("stop after diagnose (no fixes)"). If it does not exist, stop and tell me.
2. Goal and scope: Diagnose <project path> without fixing anything. Work from that directory; if you are not standing there, stop and tell me. If an app is needed for the preflight: <local or staging URL>; if the URL or credentials are missing, note what is missing as GATED and continue with the audit. The focus I care about most: <screens or flow>; the audit still covers the whole project.
3. Command: /battle-test --audit-only
4. Limits: Forbidden: modifying the project's code, making commits, running the baseline, quality-loop or the re-verification, integrating to main, pushing, deploying. The only new files are the ones the audit generates (audit-report.md and the run state); if an audit-report.md already existed, rename it as the skill says. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Do not integrate to main. Do not deploy. If the verdict is 🛑 or 🔴 and the flow offers fix-first / proceed / stop, ask me and recommend stop: this mode does not fix. If you need to ask me something and you have no tool to ask, write it as GATED and stop.
6. Closing: Deliver audit-report.md, the AUDIT VERDICT with one of its five exact texts, without softening it, and the [AUDIT COMPLETE: ...] or [AUDIT TRUNCATED: <reason>] signal exactly as it came out. Also the list of F-... findings with severity and path:line. Do not use any battle-test verdict (BATTLE-TESTED and the rest): this mode does not have one.
```

## Expected verdicts (the five exact audit texts)

| Token | File:line | When |
| --- | --- | --- |
| `🛑 DO NOT LAUNCH UNTIL HARD STOPS RESOLVED` | `skills/audit/references/audit-triage-rubric.md:52` | There is any hard stop |
| `🔴 BLOCK LAUNCH — fix EXPLOITABLE-NOW findings before any production traffic` | `skills/audit/references/audit-triage-rubric.md:53` | At least one EXPLOITABLE-NOW finding, no hard stops |
| `🟠 FIX BEFORE LAUNCH — multiple critical issues; estimate days-to-weeks` | `skills/audit/references/audit-triage-rubric.md:54` | 3 or more critical, or 1 critical in payments/auth/deletes |
| `🟡 SHIPPABLE WITH PLAN — significant tech debt; schedule remediation sprint` | `skills/audit/references/audit-triage-rubric.md:55` | 3 or more high, no critical |
| `🟢 ACCEPTABLE — routine cleanup; no launch-blockers` | `skills/audit/references/audit-triage-rubric.md:56` | Mostly medium and low |

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `--audit-only` | `skills/battle-test/SKILL.md:17` | Published form: "stop after diagnose (no fixes)" |
| `no fixes` | `skills/battle-test/SKILL.md:17` | No fixes |
| `Resolve the project path` | `skills/battle-test/references/stages.md:9` | Stage 0: project = argument or cwd |
| `continue with whatever can run` | `skills/battle-test/references/stages.md:28` | No URL or credentials: GATED and continue (the example is audit-only) |
| `Use the audit-orchestrator skill` | `skills/battle-test/references/stages.md:32` | Stage 1; ~40-70 min |
| `[AUDIT COMPLETE: ...]` | `skills/battle-test/references/stages.md:33` | End signal |
| `[AUDIT TRUNCATED: <reason>]` | `skills/battle-test/references/stages.md:33` | Cutoff signal |
| `AUDIT VERDICT` | `skills/battle-test/references/stages.md:35` | The block to read: one of the five exact texts |
| `AskUserQuestion: fix-first / proceed / stop` | `skills/battle-test/references/stages.md:36` | Pause on 🛑/🔴 |
| `F-1.3` | `skills/battle-test/references/stages.md:38` | Format of the finding ids, with severity and path:line |
| `write the report and stop here` | `skills/battle-test/references/stages.md:40` | Cutoff of the mode |
| `Refuse` | `skills/battle-test/references/stages.md:148` | `--ux` rejects `--audit-only` |
| `Read-only audit` | `commands/audit.md:66` | The audit does not modify source code |
| `audit-report.md` | `commands/audit.md:22` | Output file, at the project root |
| `audit-report.previous-YYYYMMDD-HHMM.md` | `skills/audit/audit-orchestrator/SKILL.md:227` | If a report already existed, it renames it |
| `[AUDIT COMPLETE: all 7 rules attested, all 13 domains covered]` | `skills/audit/audit-orchestrator/SKILL.md:243` | Full text of the end signal |
| `[AUDIT TRUNCATED: <reason>]` | `skills/audit/audit-orchestrator/SKILL.md:244` | Full text of the cutoff signal |

## Not defined in the text

- Which report "write the report and stop here" writes (`skills/battle-test/references/stages.md:40`): `audit-report.md` is certainly generated; the text does not say whether the unified HTML is also built.
- Which battle-test verdict applies: `skills/battle-test/references/report.md:7-19` defines none for `--audit-only`. The only verdict is the audit's.
- How the fix-first / proceed / stop pause fits in a mode without fixes: the text does not say; the prompt recommends stop.
- How much of the preflight runs in this mode (worktree, app startup): the text does not say it is skipped, so the prompt treats it as run.
- `--audit-only` together with `--quick`, `--push-main` or `--resume`: not mentioned.
