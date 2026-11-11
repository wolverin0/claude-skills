# Prompts to run each battle-test mode and its sister skills

> **Note: no mode has been run end to end yet.** These prompts are derived from the published text of the skills, not from a real run. Every flag, combination and verdict cites `file:line`; where the text is silent it says "not defined". See "Not tested" at the end.

One file per use case. Each one has a block ready to copy and paste into the agent working on your project, to run a mode without remembering flags and without the agent going beyond its scope.

## How to use them

1. Paste the block into the agent that works on your project, with the working directory in the project.
2. Replace the placeholders: `<project path>`, `<local or staging URL>`, `<screens or flow>` (and the few specific to a case, such as `<project subfolder>` or `<worktree path>`).
3. Use a current installed version of the skills: the first step of each block makes it confirm that the flag exists. If your agent has an old version, it has to stop and tell you.

All the blocks follow the same order, with the same six labels: 1. Pre-check, 2. Goal and scope, 3. Command, 4. Limits, 5. Safe side, 6. Closing. All of them fix the safe side: never against production, do not integrate to main (except case 02), do not deploy, and stop if there is no tool to ask.

## The cases

| Case | File | Command | What it does | What it does NOT do | Integrates to main? |
| --- | --- | --- | --- | --- | --- |
| 1. Full | [01-full.md](01-full.md) | `/battle-test` | Full cycle: diagnosis, browser validation, fixes and re-verification | Does not integrate to main, does not deploy | No |
| 2. Full and integrate | [02-full-and-integrate.md](02-full-and-integrate.md) | `/battle-test --push-main` | Case 1 and, with all gates green, integrates the tested range | Does not deploy (where there is auto-deploy, integrating is the same as deploying) | Yes, only with green gates |
| 3. UX/UI only | [03-ux-ui-only.md](03-ux-ui-only.md) | `/battle-test --ux` | Curates only UX/UI with one pause for you to choose which changes go in | Does not touch security, database, dependencies, performance or dead code; does not integrate | No |
| 4. Audit only | [04-audit-only.md](04-audit-only.md) | `/battle-test --audit-only` | Preflight and audit, and stops | Fixes nothing | No |
| 5. Quick | [05-quick.md](05-quick.md) | `/battle-test --quick` | `vibe-to-prod` plus a validation smoke on key routes | Never says "battle-tested"; never pushes or deploys | No |
| 6. Resume | [06-resume.md](06-resume.md) | `/battle-test --resume`, `/battle-test --ux --resume` | Continues a paused run from its checkpoint | Does not restart or change mode; does not integrate | No |
| 7. Audit and remediate with a PR | [07-audit-and-remediate-with-pr.md](07-audit-and-remediate-with-pr.md) | `/audit-remediate`; `/audit` | Audits, fixes on a branch, re-audits and opens a PR; or only audits | Does not merge, does not touch main; `/audit` does not modify code | No (opens a PR, does not merge) |
| 8. Validate the app only | [08-validate-the-app-only.md](08-validate-the-app-only.md) | `/validation` and its modes | Validation in a real browser, without auditing the code | Does not fix; standard and full create and delete `VAL_` data | No |
| 9. UX audit without fixes | [09-ux-audit-without-fixes.md](09-ux-audit-without-fixes.md) | skill `product-ux-audit` | Usability audit and a `C01..Cn` table of changes | Does not fix, does not export, does not write `DESIGN.md`, no score | No |
| 10. Screenshots only | [10-screenshots-only.md](10-screenshots-only.md) | `$visual-route-sweep <URL>` | Screenshots of every safe route in light and dark, three widths, with review | Without `--fix` it does not remediate; does not cover security or CRUD | No |
| 11. Fix from a list only | [11-fix-from-a-list.md](11-fix-from-a-list.md) | `/quality-loop --staged --from-tracks` | Fixes the AUTO items of `TRACKS.md` on a loop branch | Does not push, does not audit, does not deploy | No |

## Valid and rejected combinations

Only the rows with `file:line` are backed by the text. Those in the second table are "not defined": the text does not say whether they combine, and these prompts do not use them.

| Combination | Status | Backing |
| --- | --- | --- |
| `--resume` | valid | `skills/battle-test/SKILL.md:16` |
| `--audit-only` | valid | `skills/battle-test/SKILL.md:17` |
| `--quick` | valid | `skills/battle-test/SKILL.md:18` |
| `--push-main` | valid | `skills/battle-test/SKILL.md:19` |
| `--ux` | valid | `skills/battle-test/SKILL.md:20` |
| `--ux + --resume` | valid: `--ux` combines only with `--resume` | `skills/battle-test/SKILL.md:20` |
| `--ux + --push-main` | rejected | `skills/battle-test/SKILL.md:37-40` |
| `--ux + --quick` | rejected | `skills/battle-test/SKILL.md:37-40` |
| `--ux + --audit-only` | rejected | `skills/battle-test/references/stages.md:145-148` |
| `--staged + --from-tracks` | valid: that is how battle-test invokes it | `skills/battle-test/references/stages.md:107` |
| `--no-push + --staged` | valid: `--no-push` is an alias of `--staged` | `skills/quality-loop/SKILL.md:18` |
| `--full + --fresh` | valid (from `/validation`) | `skills/battle-test/references/stages.md:52` |
| `--mode smoke + --fresh` | valid (from `/validation`) | `skills/battle-test/references/stages.md:44` |
| `--scope + --max-rounds` | valid (from `/audit-remediate`) | `commands/audit-remediate.md:19` |

The ones the text does not define (not backed; each one is documented as "not defined"):

| Combination | What the text says |
| --- | --- |
| `--resume` with `--audit-only`, `--quick` or `--push-main` | Nothing. Only `--ux --resume` is defined. Case 06 does not integrate and stops if the state says the original run used `--push-main`. |
| `--quick` with `--push-main` | Nothing about how they combine. About `--quick` it only says it never pushes or deploys (`skills/battle-test/references/stages.md:48`). |
| `--audit-only` with `--push-main` or `--quick` | Nothing. |
| Any battle-test flag with a project path | The text shows the path alone (`skills/battle-test/SKILL.md:15`) and the flags alone; not the combination. The prompts use the current directory. |
| `--fix` with `--resume` (`visual-route-sweep`) | Nothing. |
| `--fresh` with `--resume`, `--full` with `--mode`, `--interactive` with other flags (`/validation`) | Nothing. `--full` is an alias of `--mode exhaustive`. |
| `--priority-domains` or `--resume-from` with `/audit-remediate` | Its published arguments are only `--scope` and `--max-rounds`. |
| `--scope`, `--priority-domains` and `--resume-from` with each other (`/audit`) | They are listed as supported arguments, with no combination rules. |
| `--from-tracks` without `TRACKS.md` (quality-loop) | Nothing. With `TRACKS.md` present, `--from-tracks` makes not re-auditing mandatory. |
| `quality-loop` without `--staged` | Defined: the default behavior pushes the green batches to main. That is why no prompt in this folder uses it. |

## Flags, verdicts and signals: where each one is

Each row was checked against the text: the cited line contains the token.

| Token | File:line | What it is |
| --- | --- | --- |
| `--resume` | `skills/battle-test/SKILL.md:16` | battle-test: continue a paused run |
| `--audit-only` | `skills/battle-test/SKILL.md:17` | battle-test: stop after the diagnosis |
| `--quick` | `skills/battle-test/SKILL.md:18` | battle-test: quick check |
| `--push-main` | `skills/battle-test/SKILL.md:19` | battle-test: authorizes integrating to main |
| `--ux` | `skills/battle-test/SKILL.md:20` | battle-test: UX/UI only |
| `--staged` | `skills/quality-loop/SKILL.md:15` | quality-loop: commits to the loop branch and does not push |
| `--from-tracks` | `skills/quality-loop/SKILL.md:16` | quality-loop: does not audit, uses `TRACKS.md` |
| `--no-push` | `skills/quality-loop/SKILL.md:18` | quality-loop: alias of `--staged` |
| `--mode` | `skills/validation/SKILL.md:20` | validation: chooses the mode |
| `--full` | `skills/validation/SKILL.md:22` | validation: alias of `--mode exhaustive` |
| `--interactive` | `skills/validation/SKILL.md:23` | validation: asks for backend, mode and authentication |
| `--fresh` | `skills/validation/SKILL.md:24` | validation: start from scratch |
| `--resume` | `skills/validation/SKILL.md:25` | validation: continue an incomplete run |
| `--max-routes` | `skills/validation/SKILL.md:59` | validation: route cap; cutting leaves the run incomplete |
| `--fix` | `skills/visual-route-sweep/SKILL.md:14` | visual-route-sweep: with remediation (the prompts do not use it) |
| `--scope` | `commands/audit.md:34` | `/audit`: scope |
| `--priority-domains` | `commands/audit.md:35` | `/audit`: domains to audit |
| `--resume-from` | `commands/audit.md:36` | `/audit`: resume a truncated audit |
| `--max-rounds` | `commands/audit-remediate.md:19` | `/audit-remediate`: maximum rounds (default 4) |
| `BATTLE-TESTED` | `skills/battle-test/references/report.md:11` | Full-cycle verdict |
| `READY WITH GATED ITEMS` | `skills/battle-test/references/report.md:13` | Full-cycle verdict |
| `NOT READY` | `skills/battle-test/references/report.md:15` | Full-cycle verdict |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Full-cycle verdict |
| `QUICK CHECK PASSED` | `skills/battle-test/references/report.md:18` | `--quick` verdict |
| `QUICK CHECK FAILED` | `skills/battle-test/references/report.md:18` | `--quick` verdict |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/report.md:19` | `--ux` verdict |
| `UX SCOPE FAILED` | `skills/battle-test/references/report.md:19` | `--ux` verdict |
| `SMOKE VERIFIED` | `skills/validation/SKILL.md:50` | Verdict of the validation smoke mode |
| `VISUAL ROUTE SWEEP GREEN` | `skills/visual-route-sweep/SKILL.md:46` | visual-route-sweep verdict |
| `🛑 DO NOT LAUNCH UNTIL HARD STOPS RESOLVED` | `skills/audit/references/audit-triage-rubric.md:52` | Audit verdict (1 of 5) |
| `🟢 ACCEPTABLE — routine cleanup; no launch-blockers` | `skills/audit/references/audit-triage-rubric.md:56` | Audit verdict (5 of 5) |
| `AUDIT COMPLETE: all 7 rules attested, all 13 domains covered` | `skills/audit/audit-orchestrator/SKILL.md:243` | End-of-audit signal |
| `AUDIT TRUNCATED: <reason>` | `skills/audit/audit-orchestrator/SKILL.md:244` | Audit cutoff signal |
| `QUALITY-LOOP COMPLETE` | `skills/quality-loop/SKILL.md:115` | quality-loop end signal |
| `=== VALIDATION COMPLETE ===` | `skills/validation/SKILL.md:198` | validation close |
| `rounds-exhausted` | `commands/audit-remediate.md:36` | `/audit-remediate` statuses: green, partial, rounds-exhausted, budget-exhausted |

The other four audit verdicts are in `04-audit-only.md`, also with their line.

## Not defined: what the skills' text does not say

What each case says in its own section is repeated here.

- Cases 01 to 06: how a path combines with a flag; which report `--audit-only` writes; which battle-test verdict applies to it; how the answer to the pause is passed to `--ux --resume`; whether `--quick` creates the worktree; whether the state stores `--push-main`.
- Case 07: which branch the `/audit-remediate` PR is opened against; how it is resumed; the `audit-remediate` workflow does not ship in this repo.
- Case 08: there is no positive verdict for the standard and full modes; whether smoke writes data.
- Case 09: there is no slash command, flags or verdict; the text does not set where the deliverable is saved.
- Case 10: there is no failure verdict; the sweep cannot be limited to a few routes without leaving it incomplete.
- Case 11: `--from-tracks` without `TRACKS.md`.

## Not tested

- No mode has been run end to end. Nor has any of these prompts been pasted into an agent.
- The citations were checked with a script that verifies that each cited line contains the flag or the verdict. That proves none was made up; it does not prove that the skill behaves as its text describes.
- It was assumed that a current installed version has the flags. Which version each agent has was not checked.
- It was not checked that the `audit-remediate` workflow, the `audit-runner` and `audit-domain-runner` agents, or the reference file that `vibe-to-prod` cites exist in your installation; the repo does not include them.
- The `$visual-route-sweep` form is the published one; it was not tried in an agent that does not use `$`.
- The prompts were never put to the test against a project with auto-deploy, nor against one without `validation.config.json`.
- How an agent reacts to the "stop and tell me" instructions was not observed: it is the intent of the prompt, not an observed behavior.
