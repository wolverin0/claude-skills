# 03 - UX/UI only

Command: `/battle-test --ux`

## When to use it

You want to curate only the experience and the interface of a project, with a single pause where you choose which changes go in.
It ends with its own verdict and with commits on the loop branch: it never integrates to main.

## What it does

- UX preflight: same worktree, app and roles; requires `validation.config.json` with ALL the routes in `routes[]`; keeps `ux-findings.json`, `test-manifest/`, `.battle-test/` and `TRACKS.md` out of git.
- UX diagnosis: uses `product-ux-audit` instead of `audit-orchestrator` (it does not run `/audit`) and stops at the `C01..Cn` table and the compatible sets.
- The only human pause: you choose a compatible set or a `Cnn` list; whatever is not chosen goes to GATED.
- Export: what was chosen moves to `TRACKS.md` as `[ux]` items and to `ux-findings.json`.
- Baseline: `visual-regression.js --update` over all routes, with no semantic review.
- Fixes: `quality-loop --staged --from-tracks` in the same worktree, only `ux` items, committing only the `owns=` paths of each item.
- Re-verification: full build/test, visual comparison of all routes, smoke of the touched routes, each `ac` criterion replayed in a real browser and `DESIGN.md` updated only with what was implemented and verified.
- Report with its own verdict.

## What it does not do

- It does not integrate to main and it rejects `--push-main`, `--quick` and `--audit-only`; it combines only with `--resume`.
- It does not review security, database, dependencies, performance or dead code.
- It does not push or deploy: it stops on the loop branch.
- It does not say BATTLE-TESTED or "ready".
- Findings that are not UX/UI are listed at the end of the report and are not fixed.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm that --ux exists and that it says it rejects --push-main, --quick and --audit-only. If it does not exist, stop and tell me.
2. Goal and scope: Curate only the UX/UI of <project path>, centered on <screens or flow>. Work from that directory; if you are not standing there, stop and tell me. App: <local or staging URL>, with the roles and the credentials through environment variables I already have loaded; the skill starts the app from its isolated worktree; if a build from another checkout or another SHA is already running at that URL, stop and tell me, because that evidence is not valid. Before starting, confirm that validation.config.json lists all the routes in routes[]. The choice of changes is mine: ask me using the question tool, recommend a compatible set and send whatever is not chosen to GATED. Recommend only changes within <screens or flow>.
3. Command: /battle-test --ux
4. Limits: Forbidden: touching security, database, dependencies, performance, refactors or files outside the screens <screens or flow>. Also do not pass --push-main, --quick or --audit-only. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Do not integrate to main or push. Do not deploy: that stays GATED for me. If you need to ask me something and you have no tool to ask, write it as GATED and stop; I will resume it later with --resume.
6. Closing: Deliver the HTML report in <repo>/artifacts/ with the verdict UX SCOPE VERIFIED or UX SCOPE FAILED, never BATTLE-TESTED or "ready". The report says that security, database, dependencies, performance and dead code were not reviewed, separates the visual comparison of all routes from the smoke of the touched routes, and ends with the section "Out of scope". GATED queue: unchosen Cnn, failed criteria and deploy approval. Missing, stale or blocked evidence counts as a failure, never as a pass.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `Start the app from the isolated worktree` | `skills/battle-test/references/stages.md:25` | The skill starts the app from the isolated worktree |
| `evidence from another checkout is invalid` | `skills/battle-test/SKILL.md:60-61` | Evidence from another checkout is not valid |
| `/battle-test --ux` | `skills/battle-test/SKILL.md:20` | Published form; "combine only with --resume" |
| `refuse + --push-main + --quick + --audit-only` | `skills/battle-test/SKILL.md:40` | Rejects the three flags |
| `never integrates to main` | `skills/battle-test/SKILL.md:40` | Ends with commits on the loop branch |
| `Findings that are not UX/UI are listed at the end` | `skills/battle-test/SKILL.md:55-56` | Final list without fixing (the second limits line of the prompt) |
| `Minimal diffs, no rewrites, no scope creep` | `skills/battle-test/SKILL.md:67` | Minimal scope |
| `choose the changes` | `skills/battle-test/SKILL.md:84` | The only human pause |
| `No question tool: write the decision as GATED and stop` | `skills/battle-test/SKILL.md:85` | No question tool: GATED and stop |
| `EVERY route in` | `skills/battle-test/references/stages.md:157` | `routes[]` with all the routes |
| `ux-findings.json test-manifest/ .battle-test/ TRACKS.md` | `skills/battle-test/references/stages.md:163` | Artifacts out of git |
| `Do not run` | `skills/battle-test/references/stages.md:171-172` | It does not run `/audit` and there is no `AUDIT VERDICT` |
| `The one human pause` | `skills/battle-test/references/stages.md:174` | The pause; whatever is not chosen goes to GATED (line 176) |
| `visual-regression.js --update --role` | `skills/battle-test/references/stages.md:185` | Baseline of all routes |
| `--staged --from-tracks` | `skills/battle-test/references/stages.md:191` | quality-loop with both flags |
| `commits only each item's` | `skills/battle-test/references/stages.md:192-193` | Commits only the `owns=` paths |
| `Replay every + in a real browser` | `skills/battle-test/references/stages.md:220` | Criteria replayed by the main session |
| `Stop on the loop branch. No push, no deploy.` | `skills/battle-test/references/stages.md:230` | Cutoff of UX stage 4 |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/stages.md:234` | Verdict of UX stage 5 |
| `Not reviewed in this mode: security, database` | `skills/battle-test/references/gates.md:52-53` | What it does not review: security, database, dependencies, performance and dead code |
| `never authorizes` | `skills/battle-test/references/gates.md:39-40` | Never authorizes BATTLE-TESTED, integration, release or deploy |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/report.md:19` | Verdict 1 of 2 |
| `UX SCOPE FAILED` | `skills/battle-test/references/report.md:19` | Verdict 2 of 2 |
| `any "ready" wording` | `skills/battle-test/references/report.md:50` | Never "ready" |
| `Out of scope` | `skills/battle-test/references/report.md:59` | Final section with the non-UX items |
| `unchosen + Cnn` | `skills/battle-test/references/report.md:58` | GATED queue of the UX mode |

## Not defined in the text

- What happens if the URL serves a build that is not the worktree's: the text says evidence from another checkout is invalid and that a missing or stale identity gives INCOMPLETE (`skills/battle-test/references/report.md:16`); the prompt orders a stop.
- `--ux` with a project path: the text does not show it (only `--ux` and `--ux` with `--resume`); that is why the prompt uses the current directory.
- How to limit the audit or the baseline to a few screens: the text covers all routes. That is why the prompt limits what is recommended at the pause, not the inventory.
