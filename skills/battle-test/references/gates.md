# Battle Test - Gates and Signals

Read machine evidence directly. A wrapper exit code, old artifact, or empty issue list is never
enough by itself.

## Machine-checkable signals

| Source | Required green signal | Failure / block |
| --- | --- | --- |
| audit | Current `audit-report.md` has an acceptable `AUDIT VERDICT` block (one of the five exact strings) and the runner emitted the `[AUDIT COMPLETE: ...]` token | Hard-stop verdict or `[AUDIT TRUNCATED: <reason>]` |
| validation coverage | `assert-coverage.js` exits `0`; mode `exhaustive`, `coverageComplete:true`, `inventoryDeclared:true`, `truncated:false`, and `unaccounted:[]` | Any missing inventory/result/review, pending queue, explicit cap, or nonzero accounting exit; an accounted FAIL is still red health |
| validation health | `certify-validation.js` exits `0`, state is `completed`, and zero failed routes, elements, modals, flows, CRUD/API checks, responsive-high findings, and failed semantic reviews | Any app/runner failure blocks certification even if coverage accounting passed |
| semantic screenshots | One inspected image per expected route x role x supported theme x breakpoint, bound to source/build and SHA-256, with hierarchy/density/alignment/proportion/state observations | Missing/stale/conflicting image/review, generic analysis, or visible defect |
| validate-multirole.js | Exit `0`; `authorizationLeaks:0`, `accessFailures:0`, `responsiveHighIssues:0`, `authFailures:0`, `smokeFailures:0` | Exit `1` or any nonzero failure count; exit `2` means invalid invocation |
| security-probe.js | Exit `0` per role and no critical/high finding | Exit `1`; exit `2` means missing/invalid config |
| visual-regression.js | Compare mode exits `0`, `regressions:0`, `missingBaselines:0`; manifest contains every expected route x role x breakpoint key | Unexpected regression, missing baseline/key, or invalid config |
| perf budget | Stage-2 Lighthouse mobile step exits `0`: LCP, TBT, CLS and JS wire size within the defaults (2500 ms / 200 ms / 0.1 / 300 KB) or the project's `perfBudget`; Stage 4 is within budget and no worse than baseline; or `perfBudget: skipped(no-web-ui)` is recorded | Any metric over budget or missing, Lighthouse `runtimeError`, regression vs baseline, or a skip with no recorded reason |
| evidence identity | Validation target source SHA/build ID is supplied independently through config or certification CLI and matches state/reviews; baseline and candidate manifests match config hash, role set, URL, and test-data identity | Stale or cross-build evidence; any identity field missing/mismatched |
| quality-loop | AUTO queue drained and its build/test gate is green on the recorded candidate SHA; read `quality-loop-state.json` (`gateStatus`, `commitRange`), `gated.json` and the `[QUALITY-LOOP COMPLETE: ...]` token | Red gate or unresolved AUTO item |

`blocked` means a prerequisite such as authentication or a runnable app is unavailable. `incomplete`
means the requested validation scope was not fully accounted. Neither is an app pass.

## Full Stage-4 release gate

The result is eligible for `BATTLE-TESTED` only when every signal above is green on the exact
candidate build. Coverage may be complete while product findings are red, so check both coverage
and health. A skipped destructive endpoint can be accounted only with a concrete safety reason; it
does not prove that mutation works and must be disclosed in the report.

## Quick profile gate

`--quick` requires a fresh smoke run with `smokeScopeComplete:true`, no failed selected route or
element, and a semantic review for each captured screenshot. Its verdict is `QUICK CHECK PASSED` or
`QUICK CHECK FAILED`. It never authorizes `BATTLE-TESTED`, integration, release, or deployment.

## Human decision points

Only these conditions pause autonomous work:

1. Hard stops: choose fix-first, proceed with the hard stop gated, or stop.
2. Missing runnable app, role credentials, or target revision: provide the prerequisite or accept an
   explicitly partial result.
3. Main integration, deployment, migrations, secret rotation, or external platform changes: require
   separate explicit authority. `--push-main` authorizes only gated main integration, never deploy.

## Main integration gate

Without `--push-main`, leave proven commits on the isolated loop branch. With it, fetch the target,
prove it still descends from the recorded base, re-run build/test and the full Stage-4 gate on the
exact integration candidate, then integrate only that proven range. A failed or stale signal blocks
the push. Deployment always remains gated.

## Stop rule

Stop when AUTO is drained and Stage 4 is green, or when the declared budget is reached. Report the
proven SHA/range, GATED queue, skipped safety-sensitive checks, and every unresolved finding. Never
translate `incomplete`, `blocked`, a quick check, or stale evidence into a green full verdict.
