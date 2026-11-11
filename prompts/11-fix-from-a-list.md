# 11 - Fix from a list only (`quality-loop --staged --from-tracks`)

Command: `/quality-loop --staged --from-tracks`

> Never use `quality-loop` without `--staged`: without that flag its default behavior is to push the green batches to main.
> This file has no prompt without `--staged`.

## When to use it

You already have a work list ready in `TRACKS.md` (AUTO section) and you want it fixed item by item, with commits on a separate branch, without auditing again or pushing anything.
You build the list yourself or it comes from another run (for example, the diagnosis of `/battle-test`).

## What it does

- Works in an isolated worktree and creates the `loop/<project>` branch on the base you indicate.
- Uses `TRACKS.md` as it is, without running `/audit` (that forces `--from-tracks`).
- Takes one AUTO item at a time in a fixed order: security, prod-readiness, deps/CVEs, tests/coverage, dead code, performance, a11y, ux, docs. It does not reorder.
- Makes the smallest diff and passes the verification gate before each commit; commits only the item's `owns=` paths.
- Items with `ac=` are left at `[~]` waiting for their criterion: the build and test gate does not prove UX.
- What a person needs to do (secret, support ticket, plan change, key rotation, product decision, deploy approval) goes to GATED and to `gated.json`, without being executed.
- When finished it writes `quality-loop-state.json` and the final closing line.

## What it does not do

- With `--staged` it does not push to main or anywhere else: it commits to the loop branch and stops.
- It does not deploy: that is always left GATED.
- It does not audit: with `--from-tracks` it does not run `/audit`.
- It does not act on the GATED items.
- It does not define what to do if `TRACKS.md` does not exist with `--from-tracks`.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of quality-loop and confirm that --staged ("commit to loop branch, DO NOT push") and --from-tracks ("never run /audit") exist. If they do not exist, stop and tell me. Then confirm that TRACKS.md exists at the root of the worktree below; if it does not exist, stop: the text does not define --from-tracks without TRACKS.md.
2. Goal and scope: Fix the AUTO items of TRACKS.md of <project path>, one at a time, in this already-created worktree: <worktree path>, standing on the base <base SHA>. Use that tree and that base, create the loop/<project> branch inside it and do not do your own setup. If the .env is missing in the tree, do not copy it from anywhere: stop and tell me. If you need to start the app to test an item, it is <local or staging URL>. Focus: items that touch <screens or flow>; the rest of AUTO is also done in its order.
3. Command: /quality-loop --staged --from-tracks
4. Limits: Forbidden: pushing any branch, running /audit, reordering the priorities, enlarging an item, touching paths that are not in the item's owns=, committing TRACKS.md or gated.json, acting on the GATED items, deploying, rotating secrets, running reset --hard against main. Minimal diffs, no rewrites. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only with local or staging configuration, never against production: before running the gate, check that the tree's .env points to local or staging; if it points to production, stop and tell me. Do not integrate to main. Do not deploy: it stays GATED. A red gate blocks the commit: fix or revert, never advance blindly. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Write quality-loop-state.json at the root of the worktree (status, fixed, gated, commitRange, gateStatus, pushedToMain) and gated.json next to TRACKS.md. The last line is [QUALITY-LOOP COMPLETE: fixed=N gated=M gate=green commits=<base>..<head> pushed=false]. It has to say pushed=false; if it said true, it is an error and tell me. Items with ac= that were left at [~] are listed in the last checkpoint. The loop has no verdict of its own: what is reported is gateStatus (green or red) and the commit range.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `--staged` | `skills/quality-loop/SKILL.md:15` | "commit to loop branch, DO NOT push" |
| `--from-tracks` | `skills/quality-loop/SKILL.md:16` | "never run /audit; work the existing pre-seeded TRACKS.md as-is" |
| `Default (no flag) = standalone auto-push` | `skills/quality-loop/SKILL.md:18` | Without `--staged` it pushes to main |
| `hands you a worktree and base` | `skills/quality-loop/SKILL.md:23` | Uses the tree and the base it is given and skips its own setup |
| `Missing + .env + Copy it first` | `skills/quality-loop/SKILL.md:123` | Without .env the build fails (the skill says to copy it; the prompt asks to stop) |
| `do NOT run` | `skills/quality-loop/SKILL.md:38` | With an existing TRACKS.md, it does not run `/audit` |
| `makes this mandatory` | `skills/quality-loop/SKILL.md:41` | `--from-tracks` makes it mandatory |
| `TRACKS.md` | `skills/quality-loop/SKILL.md:45` | Lives at the worktree root |
| `do not reorder` | `skills/quality-loop/SKILL.md:52` | Fixed order |
| `security → prod-readiness → deps/CVEs → tests/coverage → dead-code → perf → a11y → ux → docs` | `skills/quality-loop/SKILL.md:53` | Priority order |
| `staging only that item's` | `skills/quality-loop/SKILL.md:63` | Commits only the `owns=` paths |
| `awaiting ac` | `skills/quality-loop/SKILL.md:67-68` | Items with `ac=` are left at `[~]` |
| `npm ci` | `skills/quality-loop/SKILL.md:76` | The verification gate |
| `A red gate blocks the commit` | `skills/quality-loop/SKILL.md:82` | A red gate blocks the commit |
| `STOP THERE` | `skills/quality-loop/SKILL.md:89` | Staged: it does not push to main |
| `Deploying is ALWAYS gated` | `skills/quality-loop/SKILL.md:92` | Deploy is always GATED |
| `Gated items — surface, never act` | `skills/quality-loop/SKILL.md:94` | What is gated is noted, not executed |
| `gated.json` | `skills/quality-loop/SKILL.md:96` | Mirror of the GATED queue |
| `quality-loop-state.json` | `skills/quality-loop/SKILL.md:105` | State file at the worktree root |
| `pushedToMain` | `skills/quality-loop/SKILL.md:111` | State field |
| `QUALITY-LOOP COMPLETE` | `skills/quality-loop/SKILL.md:115` | Final line with the `pushed` field as true or false |
| `git reset --hard` | `skills/quality-loop/SKILL.md:121` | `reset --hard` against main is blocked by a guardrail |
| `--staged --from-tracks` | `skills/battle-test/references/stages.md:107` | battle-test always invokes it with both flags together |
| `without + --staged + its default` | `skills/battle-test/references/stages.md:108` | Without `--staged` the default is to push the green batches to main |

## Not defined in the text

- `--from-tracks` without an existing `TRACKS.md`: the text does not cover it; the prompt stops.
- How a person provides the worktree and the base: the text describes it for a parent orchestrator ("If the parent orchestrator hands you a worktree and base, use them"); the prompt gives that role to whoever pastes it.
- A project path together with the flags: the text shows one form with a path and the flag forms separately, not combined.
- The gate uses `npm`, `tsc` and the project's lint config: for another stack the text does not define the gate.
- `--no-push` is an alias of `--staged` and could be used; this file uses `--staged` everywhere to avoid mixing.
