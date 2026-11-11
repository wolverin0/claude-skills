---
name: quality-loop
description: "Drive a project hardening + full quality-sweep loop in an isolated worktree. Use when the user wants to harden/improve a project autonomously — security, prod-readiness, deps/CVEs, tests/coverage, dead-code, perf, a11y, ux, docs — with self-verification before anything merges to main, and clean queueing of anything that needs the operator. Trigger: /quality-loop. Runs standalone (auto-pushes verified batches) or staged under an orchestrator like /battle-test (--staged: commit only, parent controls the push). Claude-only (no codex/auto-harness); runs locally."
---

# quality-loop

Run THIS project through a hardening + quality sweep as a **self-verifying loop in an isolated git
worktree**. You work the AUTO list, prove every change before it can reach `main`, and queue
anything that needs a human. Minimal diffs. No rewrites. No scope creep.

```
/quality-loop                      # standalone: audit if needed, fix, verify, AUTO-PUSH green batches to main
/quality-loop ../crm               # a specific project path
/quality-loop --staged             # orchestrated: commit to loop branch, DO NOT push (parent pushes after its gate)
/quality-loop --from-tracks        # never run /audit; work the existing pre-seeded TRACKS.md as-is
```
`--no-push` is an alias for `--staged`. Default (no flag) = standalone auto-push.

Optional loop scaffold files: `.loop/DRIVER.md`, `TRACKS.md`, `KICK.md`.

## 0. Setup (isolated, from deployed main)
**If the parent orchestrator hands you a worktree and base, use them.** Skip this step except branch
creation: work in that tree and create `loop/<project>` at the base SHA inside it
(`git switch -c loop/<project> <base>`; on resume, switch to the existing branch). Do not fetch,
do not branch from `origin/main`, and do not remove the tree: the parent still needs it for its own
re-verification and removes it.
```bash
git fetch origin
git worktree add ../_worktrees/<project>-loop -b loop/<project> origin/main
# gitignored; the app/build/prerender CANNOT boot without these → copy then VERIFY they landed
cp .env .env.development .env.local ../_worktrees/<project>-loop/ 2>/dev/null
ls ../_worktrees/<project>-loop/.env >/dev/null 2>&1 || echo "STOP: no .env in worktree — the gate WILL fail on every route; get real env before building"
```
Work entirely in that worktree. **Never** edit another pane's tree; **never** push a stale local `main`.

## 1. Get a work-list (don't re-audit if a parent pre-seeded it)
- **If `TRACKS.md` already exists, use it as-is — do NOT run `/audit`.** An orchestrator (e.g.
  `/battle-test`) pre-seeds AUTO with BOTH static-audit findings AND runtime findings (authz leaks,
  IDOR, secrets-in-bundle, responsive fails, visual regressions). Treat those as normal AUTO items.
  `--from-tracks` makes this mandatory.
- **Only if `TRACKS.md` is absent** (standalone): run `/audit`, then write it.

**TRACKS.md format** (stable — orchestrators parse it):
- `TRACKS.md` lives at the worktree root.
- Two sections: `## AUTO` (you do + verify) and `## GATED` (operator/external only).
- Item: `- [ ] T## | owns=<path[,path]> | <desc>`  ·  status markers: `[ ]` todo · `[~]` in-progress ·
  `[x]` done · `[!]` blocked→moved to GATED. Optional trailing fields (backward compatible; a parser that
  ignores them still works): a `[ux]` tag at the start of `<desc>`, `src=<ids>`, `routes=<paths>`,
  `ac=ux-findings.json#<id>`. `owns=` and `routes=` take comma-separated lists. Example:
  `- [ ] T21 | owns=src/pages/Customers.tsx,src/components/CustomerPanel.tsx | [ux] side panel when editing a customer | src=UX-H03,UX-C02 | routes=/customers | ac=ux-findings.json#UX-H03`
- AUTO worked in this order (do-no-harm-first — **do not reorder**):
  **security → prod-readiness → deps/CVEs → tests/coverage → dead-code → perf → a11y → ux → docs.**
- `ux` = interaction, flow or visual changes the operator already chose. It enters AUTO only from an
  orchestrator's `ux-findings.json` export (the one design call that is AUTO because the operator picked
  it); unchosen ones stay GATED. Inside `ux`, honor each finding's `needs` order and never do both of two
  mutually exclusive alternatives. A finding may name a third-party design skill in `skill`; use it only if
  it is installed.

## 2. Iterate (one track at a time)
1. Pick the next `[ ]` AUTO track in priority order. Mark it `[~]`. Implement the **smallest diff**.
2. Run the **gate** (below). It must pass before you commit.
3. Commit on `loop/<project>` (conventional message + `T##`), staging only that item's `owns=` paths,
   never the whole tree. Mark the item `[x]` with a one-line evidence note. Checkpoint: "Done: X.
   Verified: Y. Next: Z."
   - **An item with `ac=` is not done on the gate alone** (build/tests do not prove UX). After its commit it
     stays `[~]` with the note `committed <sha>, awaiting ac`. It becomes `[x]` only with an evidence note
     that cites that criterion (role and route checked, capture or state observed). The parent verifies it in
     a real browser, outside this executor: whoever fixed does not approve. A failed criterion becomes `[!]`
     plus a GATED entry. Items awaiting `ac` count as handled for "AUTO drained", are not counted in
     `fixed`, and are listed in the last checkpoint.
4. Repeat.

## 3. Verification gate (MANDATORY before every commit — the load-bearing safety property)
```
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit -p tsconfig.app.json     # + tsconfig.node.json if present
npm test                                   # test:coverage if a coverage gate exists
npm run build                              # MUST include any prerender/SSG step
```
A red gate blocks the commit — fix or revert, never advance on a guess. If the build's prerender
fails with `waitForSelector`/blank pages on ALL routes, that's the **missing-env** gotcha — copy
`.env*` from the main repo and rebuild (environmental, not a regression).

## 4. Consolidate
- **Standalone (default):** when a batch is green, rebase/cherry-pick onto current `origin/main`,
  re-run the gate, then `git push origin loop/<project>:main` as a **fast-forward**.
- **Staged (`--staged`/`--no-push`):** commit green batches to `loop/<project>` and **STOP THERE —
  do not push to `main`.** The parent orchestrator runs its own re-validation, then pushes the proven
  commit range itself. Report the commit range so it knows what to push.
- **Deploying is ALWAYS gated** — never run `vercel --prod` (or equivalent) yourself; queue it.

## 5. Gated items — surface, never act
Move each to `TRACKS.md` → GATED with the **exact** action needed (mark the AUTO item `[!]`), and
mirror the queue to **`gated.json`** next to `TRACKS.md`:
```json
[ { "id": "T07", "item": "enable storage RLS", "needs": "Supabase support ticket / dashboard toggle", "who": "operator" } ]
```
Continue other AUTO items — never block the whole loop on one gated thing. (Anything needing a
secret/key, support ticket, paid-plan change, key rotation, destructive history rewrite,
platform-locked setting, deploy approval, or a design/product decision is GATED.)

## 6. Stop + machine-readable completion signal
When AUTO is drained (or a budget is hit): write `quality-loop-state.json` at the worktree root, then
print the end token as the last line.

`quality-loop-state.json`:
```json
{ "status": "completed|in_progress|blocked", "fixed": N, "gated": M,
  "commitRange": "<base>..<head>", "gateStatus": "green|red", "pushedToMain": true|false }
```
End token (final line of output, for parents that read stdout):
```
[QUALITY-LOOP COMPLETE: fixed=N gated=M gate=green commits=<base>..<head> pushed=<true|false>]
```
Self-pace long runs with `/loop` + `ScheduleWakeup`; push a progress line every ~3 min during long work.

## Guardrails (don't relearn today's scars)
- Always branch from `origin/main` (fetch first) unless the parent supplied a base (§0); never push a stale local `main` (clobbers prod).
- `git reset --hard` against main is guardrail-blocked → do not rework main; start a new branch from `origin/main`.
- Cherry-pick of an already-shipped commit returns "empty" (not a conflict) → `git cherry-pick --skip`.
- Missing `.env*` in the worktree → build/prerender fails on every route. Copy it first.
- One worktree per loop; remove it when done (`git worktree remove ...`) if you created it. A parent-supplied tree stays.
