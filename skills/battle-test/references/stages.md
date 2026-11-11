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
    `assert-coverage.js`, `certify-validation.js`, `validate-multirole.js`, `security-probe.js`, and `visual-regression.js`
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
2. Wait for the `[AUDIT COMPLETE: ...]` token (or `[AUDIT TRUNCATED: <reason>]`); match on the text
   before the colon, the token carries a suffix. Read `<repo>/audit-report.md`.
3. Parse the `AUDIT VERDICT` block (one of the five exact strings in the audit triage rubric). Gate per `references/gates.md`:
   - 🛑 / 🔴 → AskUserQuestion: fix-first / proceed / stop.
   - 🟠 / 🟡 / 🟢 → proceed.
4. Extract the finding list (IDs of the form `F-…`, e.g. `F-1.3`, `F-H1.1`, `F-T1.1`, with severity + path:line) into the run state — Stage 3
   feeds these to quality-loop so it doesn't re-audit from scratch.
5. If `--audit-only`, write the report and stop here.

## Quick profile (`--quick`)

Run `vibe-to-prod` plus `validation --mode smoke --fresh` against key/changed routes. Review every
captured screenshot and require `smokeScopeComplete:true`, but skip the full audit, autonomous
hardening, security depth, and exhaustive ledger; run the Stage-2 perf budget once on the home
route when the app has a web UI. Report `QUICK CHECK`, never `battle-tested`, and
never push or deploy. Stop after the quick report.

## Stage 2 — Baseline runtime verification (validation)

1. Run `validation --full --fresh --config validation.config.json <url>`. The deterministic browser
   collector is only the first pass: inspect every queued screenshot, record semantic reviews,
    exercise modal/flow/`VAL_` CRUD queues, then run `assert-coverage.js` for accounting and
    `certify-validation.js` for final health/image certification. Require `completed`,
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
   IDOR/secret findings. They come from `test-manifest/validation-state.json` and from the
   `validate-multirole.js`, `security-probe.js` and `visual-regression.js` output. Read signals per
   `references/gates.md`.
6. **Perf budget** (measured, not grepped). Run Lighthouse mobile with simulated CPU/network
   throttling against the app URL (home route; repeat for other key routes if the project lists them):

   ```bash
   npx lighthouse "$URL" --preset=perf --form-factor=mobile --throttling-method=simulate \
     --output=json --output-path="$RUN/lh.json" --chrome-flags="--headless=new" --quiet
   node -e 'const fs=require("fs"),r=JSON.parse(fs.readFileSync(process.argv[1])),a=r.audits;
   let c={};try{c=JSON.parse(fs.readFileSync("validation.config.json")).perfBudget||{}}catch{}
   const b={lcpMs:2500,tbtMs:200,cls:0.1,jsKb:300,...c};
   const js=a["network-requests"].details.items.filter(i=>i.resourceType==="Script").reduce((n,i)=>n+(i.transferSize||0),0)/1024;
   const m={lcpMs:a["largest-contentful-paint"].numericValue,tbtMs:a["total-blocking-time"].numericValue,cls:a["cumulative-layout-shift"].numericValue,jsKb:js};
   const f=Object.keys(b).filter(k=>!(m[k]<=b[k]));
   console.log(JSON.stringify({m,b,fail:f,runtimeError:r.runtimeError||null}));process.exit(f.length||r.runtimeError?1:0)' "$RUN/lh.json"
   ```

   - Reports LCP, TBT, CLS and total JS bytes. Lab Lighthouse cannot measure INP; TBT is its lab
     proxy. Real INP comes from RUM (audit-domain-05 Q7).
   - JS size is the summed `transferSize` of Script requests, i.e. the compressed (gzip/brotli) wire size.
   - Defaults: LCP 2500 ms, TBT 200 ms, CLS 0.1, JS 300 KB. A project overrides any of them with
     `"perfBudget": {"lcpMs":..,"tbtMs":..,"cls":..,"jsKb":..}` in `validation.config.json`.
   - Exit `1` (any metric over budget, a missing metric, or a Lighthouse `runtimeError` such as
     `NO_FCP`) is a red health signal. Save `lh.json` and the printed line under the run dir.
   - `lighthouse` is not preinstalled: `npx` fetches it on first use and it needs Chrome. Pin the
     version in the state file so Stage 4 compares like with like.
   - **Skip when the project has no web UI** (no URL, API-only/CLI/worker, or `validation.config.json`
     has no routes): do not run it, and record `perfBudget: skipped(no-web-ui)` in `state.json`
     and the report. A silent omission is a gate failure; a recorded skip is not.
7. Record the baseline result (the "before" column of the report), including the perf numbers.

## Stage 3 — Harden (quality-loop)

1. Seed `TRACKS.md` AUTO with **both** sets of findings:
   - audit findings from Stage 1, in quality-loop's fixed order (security → prod-readiness → deps →
     tests → dead-code → perf → a11y → ux → docs), and
   - the Stage-2 runtime findings (broken routes, authz leaks, responsive fails, IDOR, secrets).
   Anything needing a secret/rotation/deploy/design call goes to the GATED section, not AUTO.
2. "Use the quality-loop skill". It works one AUTO item at a time behind its build/test gate,
   commits to `loop/<project>`. Invoke it with `--staged --from-tracks` (both): `--from-tracks`
   only stops it from re-auditing; without `--staged` its default is to push green batches to main.
   Hand it the worktree path and the recorded source SHA as its worktree and base: it uses that tree
   and skips its own setup, so the fixes land on the tree that was audited and baselined.
3. Do **not** let it push to main yet — Stage 4 is the gate that authorizes the push.
4. Read what quality-loop produces: `quality-loop-state.json` at the worktree root (`status`, `fixed`,
   `gated`, `commitRange`, `gateStatus`, `pushedToMain`), `gated.json` next to `TRACKS.md`, and the
   final `[QUALITY-LOOP COMPLETE: fixed=N gated=M gate=green commits=<base>..<head> pushed=<bool>]`
   token. Stage 4 takes the candidate range from `commitRange`.

## Stage 4 — Re-verify (prove the fixes)

1. Record the candidate SHA/build/config hash. After each green batch (or at end of AUTO), re-run
   the entire Stage-2 exhaustive validation against that exact worktree build, including the
   multi-role, security-probe, and `visual-regression.js` (compare mode) checks vs the
   Stage-2 baseline.
2. A fix counts as proven only if both coverage and certification gates exit `0`, validation `session.status: completed`,
   `coverageComplete:true`, `unaccounted:[]`, every screenshot semantically reviewed, 0 new authorization
   leaks, 0 new responsive-high, no new visual regression on routes it shouldn't have touched, and
   no new security critical, and the Stage-2 perf budget re-run on the candidate build is within
   budget and no worse than the baseline (skipped only with a recorded `skipped(no-web-ui)`).
   Re-run the audit on the changed scope if a security/architecture finding was the target.
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

## UX mode (`--ux`)

Runs the stages in order with the variants below; whatever is not mentioned is as in the full stages.
Record `mode: ux` in `state.json`. Refuse `--push-main`, `--quick` and `--audit-only`. Without subagents,
run in line. Without `AskUserQuestion`, write the gate as GATED and stop; `--resume` continues from the
operator's answer.

### UX Stage 0 — Preflight

Steps 1-6 as in Stage 0, with these differences:
- Step 3: `verify-provider-parity.js` still runs; among the helpers only `visual-regression.js` and
  `run-smoke-playwright.js` must exist.
- Step 5: `validation.config.json` must list EVERY route in `routes[]` (with an empty list
  `visual-regression.js` covers only `/`), plus `roles[]`. The modal/CRUD/API inventory is not needed.
- Keep run artifacts out of git (they include live session state). In the worktree:

  ```bash
  EXCL=$(git rev-parse --git-path info/exclude)   # a linked worktree has no .git/info/exclude file; this file is shared with the main checkout
  for p in ux-findings.json test-manifest/ .battle-test/ TRACKS.md; do grep -qxF "$p" "$EXCL" || echo "$p" >> "$EXCL"; done
  ```

  Tracked files are unaffected. `quality-loop-state.json` and `gated.json` also sit at the root but are
  never staged, because Stage 3 commits only each item's `owns=` paths.

### UX Stage 1 — Diagnose (UX audit)

1. "Use the product-ux-audit skill" on the worktree and the running app, in place of
   `audit-orchestrator`. Do not run `/audit`; there is no `AUDIT VERDICT`, no token and no hard-stop gate.
   Run its stages 1-7 and stop at the `C01..Cn` table and compatible sets.
2. **The one human pause** (owned by this stage: when you run its export in step 3, tell it the choice is
   already made so it does not ask again). Ask the operator to choose a compatible set or a custom `Cnn` list
   (`AskUserQuestion`: options = the sets, custom, none; recommend one). What is not chosen goes to GATED.
   No question tool: write the decision as GATED and stop.
3. Run its stage 9 (export): chosen items become `[ux]` lines in `TRACKS.md` (worktree root) and entries
   in `ux-findings.json`; unchosen ones go to GATED with `needs` = operator decision. Formats:
   `product-ux-audit/references/templates.md`, template 7.
4. Findings that are not UX/UI: keep them in state for the report; they never enter `TRACKS.md`.

### UX Stage 2 — Baseline

Run `visual-regression.js --update --role <role>` per role (with `--storage-state`) using the full
`validation.config.json`: a baseline of ALL routes. No `validation --full`, no semantic review, no
multi-role, security or perf budget. Write the baseline manifest as in Stage 2 step 4.

### UX Stage 3 — Harden

"Use the quality-loop skill" with `--staged --from-tracks`, handing it the worktree path and the recorded
source SHA (it uses that tree). The queue is the `ux` items only. It commits only each item's `owns=`
paths; items with `ac=` stay `[~]` awaiting their criterion. Its build/test gate does not prove UX.
Read its outputs as in Stage 3 step 4.

### UX Stage 4 — Re-verify

Record the candidate SHA/build/config hash and restart the app from the worktree. The **touched set** =
the `routes=` of committed `ux` items (`[x]`, or `[~]` awaiting `ac`) plus every route their `ac` steps
visit. Stage 4 steps 1-3 do not apply (no partial re-baseline). Do, in order:

a. Re-run the full build/test gate of quality-loop section 3 on the candidate.
b. Visual compare of ALL routes: `visual-regression.js` without `--update`, per role with
   `--storage-state`, with the full config. Exit `1` is expected when an intended change differs, so read
   the JSON. Pass only if every regression is on a touched route and was reviewed as the intended change
   (current vs baseline, `bbox`, `sizeChanged`), there is none on any other route, and `missingBaselines:0`.
   A shared-component change that shows on an unlisted route is reviewed and added to `routes=`, or it
   fails.
c. Smoke on the touched routes, per role: copy the full config to `$RUN/ux-smoke.config.json` with only
   `routes[]` replaced by the touched set (roles, breakpoints and auth settings unchanged). Run
   `node "$VALIDATION_SKILL_ROOT/scripts/run-smoke-playwright.js" --mode smoke --url <url> --config
   $RUN/ux-smoke.config.json --role <id> --storage-state <file> --out $RUN/ux-smoke --max-routes <N>`
   (credentials from env vars instead of `--storage-state` also work). `--out` keeps the Stage-2 state
   and `test-manifest/baseline` intact. `<N>` = the number of distinct paths in the touched set plus the
   landing path: smoke selects the landing route first, then the config routes, then crawled links, so
   this cap cuts the links. A landing route that is not touched is reported as an extra, not hidden.
   Never pass this config to `visual-regression.js`: it resolves baselines from its config directory.
   Review every screenshot; require `smokeScopeComplete:true`, no failed selected route or element,
   console/network checked.
d. Replay every `ac` in a real browser as its role (steps, observable result, what is preserved), in the
   main session, never in the quality-loop executor. Record before (the audit's recorded "before", or
   the Stage-2 baseline image of the route) and after (capture in `$RUN/ux-ac/`). Put an evidence note on
   the item citing the `ac` id, role, route and capture, then mark it `[x]`; a failed criterion becomes
   `[!]` plus a GATED entry.
e. Update `DESIGN.md` only with what is implemented and verified; anything else stays "proposal pending
   implementation".
f. Only if a-e are green and the diff in (b) stayed on touched routes: re-baseline ALL routes with
   `visual-regression.js --update`, then compare once more and expect `regressions:0`.

Stop on the loop branch. No push, no deploy.

### UX Stage 5 — Report

Write the report per `references/report.md` ("UX mode"). Verdict: `UX SCOPE VERIFIED` or
`UX SCOPE FAILED`, never `BATTLE-TESTED`.
