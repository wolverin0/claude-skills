# 06 - Resume a paused run

Commands: `/battle-test --resume` (block A) and `/battle-test --ux --resume` (block B)

## When to use it

A battle-test run paused (it reached a gate, ran out of context or was waiting for your answer) and you want to continue from where it stopped.
Use block A for a full run and block B for a run in UX mode.

## What it does

- Reads the checkpoint `<repo>/.battle-test/state.json`, which is saved after each stage, and continues from there.
- In UX mode, the state stores `mode: ux` so that `--resume` restores it.
- In UX mode, if the run was left waiting for your choice of changes (no question tool), `--resume` continues from your answer.

## What it does not do

- It does not start from scratch or change mode.
- It does not integrate to main or deploy.
- It does not define how it combines with `--push-main`, `--quick` or `--audit-only`.

## Block A: full run

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm that --resume exists ("continue a paused run"). If it does not exist, stop and tell me. Then read <project path>/.battle-test/state.json; if it does not exist, stop and tell me.
2. Goal and scope: Resume the paused run of <project path>. Work from that directory; if you are not standing there, stop and tell me. Before continuing, tell me in one line: mode, last completed stage, recorded SHA and whether the state says the original run had --push-main. If the state says mode: ux, stop and use block B. Running app: <local or staging URL>; if it no longer responds there, do not point it at another URL, and if it serves a build from a different SHA than the recorded one, that evidence is not valid: stop and tell me in both cases. The focus I care about most: <screens or flow>; the run still covers the whole project.
3. Command: /battle-test --resume
4. Limits: Forbidden: restarting the run, changing mode, integrating to main, pushing, deploying, touching data that is not test data. This run does NOT integrate to main even if the original one asked for it: if the state asked for it, stop and tell me, because the text does not define how --resume combines with --push-main. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Do not integrate to main. Do not deploy. If you need to ask me something and you have no tool to ask, write it as GATED and stop.
6. Closing: Finish the remaining stages and deliver the HTML report in <repo>/artifacts/ and the GATED queue. Verdict: exactly one of BATTLE-TESTED, READY WITH GATED ITEMS, NOT READY or INCOMPLETE; never BATTLE-TESTED with anything red, incomplete coverage, unreviewed screenshots or a SHA that does not match. If the SHA, the build or the config do not match the saved state, it is INCOMPLETE.
```

## Block B: run in UX mode

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm that --ux and --resume exist, and that --ux combines only with --resume. If not, stop and tell me. Then read <project path>/.battle-test/state.json; if it does not exist, stop and tell me.
2. Goal and scope: Resume the paused UX run of <project path>, centered on <screens or flow>. Work from that directory; if you are not standing there, stop and tell me. Before continuing, tell me in one line: mode, last completed stage and recorded SHA. If the state was left waiting for my choice of changes, my choice is: <compatible set, Cnn list or none>. If the state is not waiting for a choice, ignore that line. Running app: <local or staging URL>; if it no longer responds there, or if it serves a build from a different SHA than the recorded one, stop and tell me.
3. Command: /battle-test --ux --resume
4. Limits: Forbidden: touching security, database, dependencies, performance, refactors or files outside the screens <screens or flow>. Also do not pass --push-main, --quick or --audit-only. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Do not integrate to main or push. Do not deploy. If you need to ask me something and you have no tool to ask, write it as GATED and stop.
6. Closing: Finish the remaining UX stages and deliver the HTML report in <repo>/artifacts/ with the verdict UX SCOPE VERIFIED or UX SCOPE FAILED, never BATTLE-TESTED or "ready", plus the "Out of scope" section and the GATED queue. Missing, stale or blocked evidence counts as a failure.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `--resume` | `skills/battle-test/SKILL.md:16` | Published form: "continue a paused run" |
| `combine only with --resume` | `skills/battle-test/SKILL.md:20` | `--ux` combines only with `--resume` |
| `Record + mode: ux` | `skills/battle-test/SKILL.md:41` | The state stores `mode: ux` so that `--resume` restores it |
| `resumes with` | `skills/battle-test/SKILL.md:88` | The run saves a checkpoint per stage and resumes with `/battle-test --resume` |
| `state.json` | `skills/battle-test/references/stages.md:3` | Checkpoint after each stage |
| `--resume + continues from the` | `skills/battle-test/references/stages.md:149-150` | In UX mode, it resumes from the operator's answer |
| `Without + AskUserQuestion + GATED + stop` | `skills/battle-test/references/stages.md:149-150` | No question tool: GATED and stop |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Verdict when evidence is missing or the identity does not match |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/report.md:19` | UX mode verdict |

## Not defined in the text

- `--resume` together with `--push-main`, `--quick` or `--audit-only`: not mentioned. That is why block A does not integrate and stops if the state says the original run asked for it.
- Whether the state stores `--push-main`: the text does not say.
- How the answer to the UX-mode pause is passed to the run: the text says `--resume` continues "from the operator's answer" but not the mechanism; block B includes it in the scope.
- Whether `--resume` only restores UX mode or whether `--ux` has to be repeated: the text says the state stores `mode: ux` so that `--resume` restores it and also shows `--ux --resume`.
- The exact location of the state: the text says `<repo>/.battle-test/state.json` in one place and `<worktree>/.battle-test/<timestamp>/` for the artifacts in another.
