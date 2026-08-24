# Battle Test — Stage Execution

Run stages in order. Checkpoint to `<repo>/.battle-test/state.json` after each stage so
`--resume` can continue. Keep this orchestrator's context lean by dispatching heavy stages as
subagents and reading back only their result + the artifact path.

## Stage 0 — Preflight

1. Resolve the project path (arg, or cwd). Record `HEAD`, `origin/main`, dirty paths, and the exact
   source SHA. Never stash, discard, or silently omit dirty work. If dirty changes affect the target
   app, stop and ask whether the run targets current `HEAD` without them or an operator-provided
   committed revision.
2. Create one isolated worktree at the recorded source SHA. Audit, baseline server, remediation,
   and re-verification all run there. Create `<worktree>/.battle-test/<timestamp>/` for artifacts.
3. Resolve `VALIDATION_SKILL_ROOT` from the active provider's sibling skill directory; fall back to
   `$HOME/.agents/skills/validation`. Run `verify-provider-parity.js`, then fail preflight unless
   `assert-coverage.js`, `validate-multirole.js`, `security-probe.js`, and `visual-regression.js`
   exist under that root. Always invoke helpers as
   `node "$VALIDATION_SKILL_ROOT/scripts/<name>.js"`, never as battle-test-relative `scripts/...`.
4. Detect whether the app gates content behind login (look for an auth provider, a login route,
   protected routes in the router). If yes, validation needs roles + credentials.
5. Reconcile code scan and runtime crawl into `validation.config.json`: every route, modal, critical
   flow, CRUD module, backend API method/path, role/access matrix, and security target. Set `inventoryComplete:true` only
   after the sources reconcile. Credentials go in env vars only — never write them to config.
6. Start the app from the isolated worktree and record URL, source SHA, build identifier, config
   hash, and test-data/database identity in state. If credentials/URL are unknown, ask for the running
   URL and how to authenticate (env creds / saved storage-state / manual login), or record the
   missing pieces as GATED and continue with whatever can run (e.g. audit-only).

## Stage 1 — Diagnose (audit)

1. "Use the audit-orchestrator skill" with the project scope (it spawns audit-runner; ~40–70 min).
2. Wait for `[AUDIT COMPLETE]` (or `[AUDIT TRUNCATED]`). Read `<repo>/audit-report.md`.
3. Parse the VERDICT line. Gate per `references/gates.md`:
   - 🛑 / 🔴 → AskUserQuestion: fix-first / proceed / stop.
   - 🟠 / 🟡 / 🟢 → proceed.
4. Extract the finding list (IDs `F-…` with severity + path:line) into the run state — Stage 3
   feeds these to quality-loop so it doesn't re-audit from scratch.
5. If `--audit-only`, write the report and stop here.

## Quick profile (`--quick`)

Run `vibe-to-prod` plus `validation --mode smoke --fresh` against key/changed routes. Review every
captured screenshot and require `smokeScopeComplete:true`, but skip the full audit, autonomous
hardening, security depth, and exhaustive ledger. Report `QUICK CHECK`, never `battle-tested`, and
never push or deploy. Stop after the quick report.

## Stage 2 — Baseline runtime verification (validation)

1. Run `validation --full --fresh --config validation.config.json <url>`. The deterministic browser
   collector is only the first pass: inspect every queued screenshot, record semantic reviews,
   exercise modal/flow/`VAL_` CRUD queues, then run `assert-coverage.js`. Require `completed`,
   `coverageComplete:true`, and `coverage.unaccounted:[]` even when app findings are red.
2. For multi-role apps, also run `validate-multirole.js` (`--url --config --channel chrome`). It is
   supplementary auth/access evidence and cannot substitute for the exhaustive ledger.
3. Also run, per role/storage-state:
   - `security-probe.js` (secrets, IDOR, fuzz, headers) — supply `security.idorTargets` in
     the config for real object-level coverage.
   - `visual-regression.js --update --role <role>` to **write the baseline** (this is the "before" the
     re-verify compares against).
4. Write a baseline manifest containing source SHA/build, config hash, role, expected route ×
   breakpoint keys, and baseline file hashes. A missing key later is a failure, not a new baseline.
5. Collect runtime findings: failed routes, authorization leaks, responsive high-severity issues,
   IDOR/secret findings. Read signals per `references/gates.md`.
6. Record the baseline result (the "before" column of the report).

## Stage 3 — Harden (quality-loop)

1. Seed `TRACKS.md` AUTO with **both** sets of findings:
   - audit findings from Stage 1 (security → prod-readiness → deps → tests → dead-code → perf →
     a11y → docs order), and
   - the Stage-2 runtime findings (broken routes, authz leaks, responsive fails, IDOR, secrets).
   Anything needing a secret/rotation/deploy/design call goes to the GATED section, not AUTO.
2. "Use the quality-loop skill". It works one AUTO item at a time behind its build/test gate,
   commits to `loop/<project>`. Invoke it staged/from-tracks so it cannot push.
3. Do **not** let it push to main yet — Stage 4 is the gate that authorizes the push.

## Stage 4 — Re-verify (prove the fixes)

1. Record the candidate SHA/build/config hash. After each green batch (or at end of AUTO), re-run
   the entire Stage-2 exhaustive validation against that exact worktree build, including the
   multi-role, security-probe, and `visual-regression.js` (compare mode) checks vs the
   Stage-2 baseline.
2. A fix counts as proven only if: validation `session.status: completed`,
   `coverageComplete:true`, `unaccounted:[]`, every screenshot semantically reviewed, 0 new authorization
   leaks, 0 new responsive-high, no new visual regression on routes it shouldn't have touched, and
   no new security critical. Re-run the audit on the changed scope if a security/architecture
   finding was the target.
3. Intended visual fixes are reviewed as expected diffs. Re-baseline only the approved changed
   routes after their semantic/responsive checks pass; never weaken the global threshold. Missing
   baselines or unexpected changes on untouched routes fail the gate.
4. Without `--push-main`, stop on the loop branch. With `--push-main`, fetch and prove the target is
   still a fast-forward from the recorded base, re-run the build/test gate, then integrate only the
   proven commit range. A regressing batch stays unintegrated and becomes a TRACKS item.
5. Deploy remains GATED regardless.

## Stage 5 — Report + stop

Write the unified HTML report (`references/report.md`) to `<repo>/artifacts/`, open it, integrate
only when explicitly authorized, and print the GATED operator queue. Do not claim "battle-tested" while any Stage-4
re-validation is red or any critical security/authz finding is unresolved — say exactly what's
left and where it's queued. Also block the verdict on incomplete coverage, pending screenshot
reviews, missing baseline keys, or SHA/build/config mismatch.
