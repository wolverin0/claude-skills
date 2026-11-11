# 01 - Full: complete curation, without integrating to main

Command: `/battle-test`

## When to use it

You want the full cycle on a project: diagnosis, browser validation, fixes and re-verification.
The fixes are left as commits on a separate branch; nothing goes into main. It is a run of several hours and it saves state per stage.

## What it does

- Stage 0, preflight: creates an isolated worktree at the recorded SHA, builds `validation.config.json` and starts the app from that worktree.
- Stage 1, diagnosis: runs `audit-orchestrator`, reads `audit-report.md` and the `AUDIT VERDICT` block; with 🛑 or 🔴 it asks you fix-first / proceed / stop.
- Stage 2, baseline: `validation --full --fresh`, multi-role, `security-probe.js`, `visual-regression.js --update` and a performance budget with Lighthouse.
- Stage 3, fixes: `quality-loop --staged --from-tracks` in the same worktree; commits on the `loop/<project>` branch.
- Stage 4, re-verification: repeats the exhaustive validation on the candidate build and compares against the baseline.
- Stage 5, report: HTML in `<repo>/artifacts/` and the GATED queue with what only you can do.

## What it does not do

- It does not integrate to main: without `--push-main` it stays on the loop branch.
- It does not deploy: `vercel --prod` and equivalents are always a GATED item.
- It does not declare BATTLE-TESTED if anything in stage 4 is red, if a critical security finding is open or if coverage is incomplete.
- It does not stop to ask you anything except at the gates below.

## Warnings before pasting it

- Stage 2 creates and deletes test data with the `VAL_` prefix and runs active security probes: only against local or staging data.
- The performance budget runs `npx lighthouse`, which is downloaded from npm the first time and needs Chrome.
- Pauses it will ask for: an audit verdict of 🛑/🔴, no running app or missing credentials, and push/deploy without authorization (they go to GATED).

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm it says that integrating to main requires --push-main and that --ux exists (a sign that it is the new version). If it does not say so, stop and tell me.
2. Goal and scope: Complete curation of <project path>, without integrating to main. Work from that directory; if you are not standing there, stop and tell me. App for the browser stages: <local or staging URL>; the skill starts the app from its isolated worktree; if a build from another checkout or another SHA is already running at that URL, stop and tell me, because that evidence is not valid. The focus I care about most: <screens or flow>; the cycle still covers the whole project. Credentials arrive through environment variables I already have loaded; if they are missing, note what is missing as GATED and continue with whatever can run.
3. Command: /battle-test
4. Limits: Forbidden: integrating to main, pushing any branch, deploying, running migrations, rotating secrets, changing external platforms or touching data that is not test data. Fixes with minimal diffs, no rewrites. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Do not integrate to main. Do not deploy: that stays in the GATED queue for me. If you need to ask me something and you have no tool to ask, write it as GATED and stop.
6. Closing: Deliver the HTML report, opened and verified, in <repo>/artifacts/, the GATED queue, the commit range of the loop branch and the line [QUALITY-LOOP COMPLETE: ...] with pushed=false. Verdict: exactly one of BATTLE-TESTED, READY WITH GATED ITEMS, NOT READY or INCOMPLETE. Do not say BATTLE-TESTED with anything red, incomplete coverage, unreviewed screenshots or a SHA that does not match. What did not run goes as NOT RUN, BLOCKED or INCOMPLETE, never as zero.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `/battle-test` | `skills/battle-test/SKILL.md:14` | Form with no arguments: current project |
| `--push-main` | `skills/battle-test/SKILL.md:3` | Integrating to main requires the flag; deployment is never automatic |
| `Without + --push-main` | `skills/battle-test/SKILL.md:64` | Without the flag it stays with commits on the loop branch |
| `Deploy is never automatic` | `skills/battle-test/SKILL.md:66` | Deploy is always GATED |
| `multi-hour` | `skills/battle-test/SKILL.md:87` | Multi-hour run with checkpoints |
| `Start the app from the isolated worktree` | `skills/battle-test/references/stages.md:25` | The skill starts the app from the isolated worktree |
| `evidence from another checkout is invalid` | `skills/battle-test/SKILL.md:60-61` | Evidence from another checkout is not valid |
| `Resolve the project path` | `skills/battle-test/references/stages.md:9` | Project = argument or cwd |
| `Credentials go in env vars only` | `skills/battle-test/references/stages.md:24` | Credentials only through environment variables |
| `record the` | `skills/battle-test/references/stages.md:27` | If the URL or credentials are missing: GATED and continue with what runs |
| `[AUDIT COMPLETE: ...]` | `skills/battle-test/references/stages.md:33` | End-of-audit signal |
| `AskUserQuestion: fix-first / proceed / stop` | `skills/battle-test/references/stages.md:36` | Pause on 🛑/🔴 |
| `validation --full --fresh` | `skills/battle-test/references/stages.md:52` | Stage 2 baseline |
| `visual-regression.js --update` | `skills/battle-test/references/stages.md:62` | Visual baseline |
| `fetches it on first use` | `skills/battle-test/references/stages.md:92` | Lighthouse is downloaded with npx |
| `--staged --from-tracks` | `skills/battle-test/references/stages.md:107` | How it invokes quality-loop |
| `Do **not** let it push to main yet` | `skills/battle-test/references/stages.md:111` | No push in stage 3 |
| `Deploy remains GATED regardless` | `skills/battle-test/references/stages.md:135` | Deploy is gated |
| `Do not claim "battle-tested"` | `skills/battle-test/references/stages.md:140` | Conditions for not declaring it |
| `Hard stops: choose fix-first` | `skills/battle-test/references/gates.md:59` | First human decision point |
| `require + separate explicit authority` | `skills/battle-test/references/gates.md:62-63` | Migrations, secrets, platforms and deploy ask for separate authority |
| `BATTLE-TESTED` | `skills/battle-test/references/report.md:11` | Verdict 1 of 4 |
| `READY WITH GATED ITEMS` | `skills/battle-test/references/report.md:13` | Verdict 2 |
| `NOT READY` | `skills/battle-test/references/report.md:15` | Verdict 3 |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Verdict 4 |
| `<repo>/artifacts/YYYY-MM-DD-battle-test.html` | `skills/battle-test/references/report.md:3` | Where the report ends up |
| `NOT RUN` | `skills/battle-test/references/report.md:44` | Never show zero for what was not run |
| `VAL_` | `skills/validation/SKILL.md:52` | Full mode creates data with the VAL_ prefix |
| `QUALITY-LOOP COMPLETE` | `skills/quality-loop/SKILL.md:115` | Final line of quality-loop |

## Not defined in the text

- What happens if the URL serves a build that is not the worktree's: the text says evidence from another checkout is invalid and that a missing or stale identity gives INCOMPLETE (`skills/battle-test/references/report.md:16`); the prompt orders a stop.
- How a project path combines with a flag: the text only shows one form with an example relative path and the flag forms separately, so the prompt uses the current directory.
- What happens if there are uncommitted changes in the project: stage 0 says to stop and ask (`skills/battle-test/references/stages.md:10`), but it does not say how to answer in an unattended run.
