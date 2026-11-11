# 02 - Full and integrate to main

Command: `/battle-test --push-main`

> **WARNING: wherever there is auto-deploy, integrating to main is the same as deploying.**
> The flag only authorizes integrating to main; the skill never deploys by itself. But if your platform deploys every time something lands in main, this prompt ends up in production.
> If you are not sure your project has no auto-deploy, run case 01 and merge by hand.

## When to use it

You want the full cycle of case 01 and, only if all the gates are green, the tested commit range to land in main.
It is the only case in this folder that touches main.

## What it does

- Everything in case 01, stages 0 to 4, in an isolated worktree and with commits on the loop branch.
- Stage 4, final step: fetches, proves main is still a direct advance (fast-forward) from the recorded base, repeats the build/test and only then integrates just the tested range.
- A batch that regresses is not integrated: it stays as a TRACKS item.
- Stage 5: HTML report and GATED queue.

## What it does not do

- It does not deploy: `--push-main` authorizes only the integration to main (`vercel --prod` and equivalents stay GATED).
- It does not run migrations, rotate secrets or change platforms: they ask for separate authority.
- It does not integrate with a signal that is red, stale or does not match the exact candidate.
- It does not declare BATTLE-TESTED with anything red.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm that --push-main exists, that it says it authorizes integrating to main only after passing all the gates and that deployment is never automatic. If it does not say so, stop and tell me.
2. Goal and scope: Complete curation of <project path> and integration to main of the tested commit range, only if all the gates are green. Work from that directory; if you are not standing there, stop and tell me. App for the browser stages: <local or staging URL>; the skill starts the app from its isolated worktree; if a build from another checkout or another SHA is already running at that URL, stop and tell me, because that evidence is not valid. The focus I care about most: <screens or flow>; the cycle still covers the whole project. Credentials arrive through environment variables I already have loaded; if they are missing, note what is missing as GATED and continue with whatever can run.
3. Command: /battle-test --push-main
4. Limits: Forbidden: deploying, running migrations, rotating secrets, changing external platforms, touching data that is not test data, force-pushing or running reset --hard against main, integrating anything that is not the tested range. Fixes with minimal diffs, no rewrites. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Integrate to main only if, after the fetch, main still descends from the recorded base, the build/test passes and all the stage 4 gates are green on the exact candidate; if anything is red, stale or does not match, do not integrate and leave it as a TRACKS item. After integrating, do not deploy: that stays GATED for me. If you need to ask me something and you have no tool to ask, write it as GATED and stop.
6. Closing: Deliver the HTML report, opened and verified, in <repo>/artifacts/, the GATED queue and the commit range. Say whether the range stayed on the loop branch or was integrated, and only write that it was integrated if you have the evidence of the push. Verdict: exactly one of BATTLE-TESTED, READY WITH GATED ITEMS, NOT READY or INCOMPLETE. Do not say BATTLE-TESTED with anything red, incomplete coverage, unreviewed screenshots or a SHA that does not match.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `Start the app from the isolated worktree` | `skills/battle-test/references/stages.md:25` | The skill starts the app from the isolated worktree |
| `evidence from another checkout is invalid` | `skills/battle-test/SKILL.md:60-61` | Evidence from another checkout is not valid |
| `--push-main` | `skills/battle-test/SKILL.md:19` | Published form: authorizes integrating after passing all the gates |
| `deployment is never automatic` | `skills/battle-test/SKILL.md:3` | Deployment is never automatic |
| `With + --push-main` | `skills/battle-test/SKILL.md:64-65` | Integrates only after the quality-loop gate and the exhaustive re-validation of stage 4 |
| `Deploy is never automatic` | `skills/battle-test/SKILL.md:66` | Deploy is always GATED |
| `With + --push-main` | `skills/battle-test/references/stages.md:132-134` | Fetch, fast-forward proof, build/test, integrates only the tested range; a batch that regresses stays as TRACKS |
| `Deploy remains GATED regardless` | `skills/battle-test/references/stages.md:135` | Deploy is gated anyway |
| `--push-main + never deploy` | `skills/battle-test/references/gates.md:63` | `--push-main` authorizes only integration to main, never deploy |
| `Main integration, deployment, migrations, secret rotation` | `skills/battle-test/references/gates.md:62` | Migrations, secrets and platforms ask for separate authority |
| `prove it still descends from the recorded base` | `skills/battle-test/references/gates.md:69-70` | Integration condition |
| `A failed or stale signal blocks` | `skills/battle-test/references/gates.md:71-72` | A failed or stale signal blocks the push |
| `Never list a commit as pushed` | `skills/battle-test/references/report.md:44` | Do not say "pushed" without evidence |
| `BATTLE-TESTED` | `skills/battle-test/references/report.md:11` | Verdict 1 of 4 |
| `READY WITH GATED ITEMS` | `skills/battle-test/references/report.md:13` | Verdict 2 |
| `NOT READY` | `skills/battle-test/references/report.md:15` | Verdict 3 |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Verdict 4 |
| `git reset --hard` | `skills/quality-loop/SKILL.md:121` | `reset --hard` against main is blocked by a guardrail |

## Not defined in the text

- What happens if the URL serves a build that is not the worktree's: the text says evidence from another checkout is invalid and that a missing or stale identity gives INCOMPLETE (`skills/battle-test/references/report.md:16`); the prompt orders a stop.
- What the target branch is besides "main": the text says "main" and "the target" with nothing more.
- Whether `--push-main` combines with `--resume`, `--quick` or `--audit-only`: not mentioned. On `--quick`, the text only says it never pushes or deploys.
- Which platforms have auto-deploy: you know that; the skill does not detect it.
