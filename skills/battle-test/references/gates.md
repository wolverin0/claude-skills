# Battle Test - Gates and Signals

Read machine evidence directly. A wrapper exit code, old artifact, or empty issue list is never
enough by itself.

## Machine-checkable signals

| Source | Required green signal | Failure / block |
| --- | --- | --- |
| audit | Current `audit-report.md` has an acceptable VERDICT and runner emitted `[AUDIT COMPLETE]` | Hard-stop verdict or `[AUDIT TRUNCATED]` |
| validation coverage | `assert-coverage.js` exits `0`; state is `completed`, mode `exhaustive`, `coverageComplete:true`, `inventoryDeclared:true`, `truncated:false`, and `unaccounted:[]` | Any missing inventory/result/review, pending queue, explicit cap, or nonzero assertion exit |
| validation health | Candidate state has zero failed routes, elements, modals, flows, CRUD/API checks, responsive-high findings, and failed semantic reviews | Any app failure; runner failures are reported separately and also block certification |
| semantic screenshots | One concrete review per expected route x role x breakpoint, all required screenshots exist, and failed review count is zero | Missing image/review, generic or too-short analysis, or visible defect |
| validate-multirole.js | Exit `0`; `authorizationLeaks:0`, `accessFailures:0`, `responsiveHighIssues:0`, `authFailures:0`, `smokeFailures:0` | Exit `1` or any nonzero failure count; exit `2` means invalid invocation |
| security-probe.js | Exit `0` per role and no critical/high finding | Exit `1`; exit `2` means missing/invalid config |
| visual-regression.js | Compare mode exits `0`, `regressions:0`, `missingBaselines:0`; manifest contains every expected route x role x breakpoint key | Unexpected regression, missing baseline/key, or invalid config |
| evidence identity | Baseline and candidate manifests match the recorded source/candidate SHA, build identifier, config hash, role set, URL, and test-data identity | Stale or cross-build evidence; any identity field missing/mismatched |
| quality-loop | AUTO queue drained and its build/test gate is green on the recorded candidate SHA | Red gate or unresolved AUTO item |

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
