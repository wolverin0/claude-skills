# Battle Test - Unified Report

Write one self-contained HTML file to `<repo>/artifacts/YYYY-MM-DD-battle-test.html`. Open it at the
end and verify that it renders. It must let a non-engineer distinguish complete proof, a quick
check, incomplete evidence, and an actual app failure.

## Verdicts

Use exactly one honest verdict class:

- `BATTLE-TESTED`: every full Stage-4 gate passed on the recorded candidate build and no critical
  security/authz issue remains.
- `READY WITH GATED ITEMS`: full runtime proof passed, but separately authorized operator actions
  remain. Never use this when an app, coverage, or evidence-identity gate failed.
- `NOT READY`: a product/security/regression gate failed.
- `INCOMPLETE`: inventory, auth, runtime, screenshot review, baseline, or evidence identity is
  missing, truncated, blocked, or stale.
- `QUICK CHECK PASSED` / `QUICK CHECK FAILED`: only for `--quick`; never call it battle-tested.

## Sections

1. **Verdict banner.** Plain language plus the exact reason and candidate SHA/build.
2. **Evidence identity.** Source/base/candidate SHA, worktree, URL, build identifier, config hash,
   roles, test-data identity, baseline manifest hash, timestamps, and fresh/stale status.
3. **Coverage scorecard.** Inventory completeness, truncation, assertion exit, routes, elements,
   modals, flows, CRUD modules, API endpoints, semantic reviews, pending queues, and unaccounted
   IDs. Show tested, failed, and skipped-with-reason counts separately.
4. **Runtime health.** Console/network errors, authorization leaks, responsive-high findings,
   security critical/high findings, visual regressions, and missing baseline keys.
5. **Before to after.** Stage-2 baseline versus Stage-4 candidate using the same metrics and role set.
6. **What changed.** Proven commit range, grouped by domain, with one factual line per change. State
   whether it stayed on the loop branch or was integrated under `--push-main`.
7. **Operator queue.** Exact action for every GATED item, including credentials, secrets, migrations,
   deploy approval, design decisions, and any destructive validation skipped for safety.
8. **Evidence appendix.** Paths to the audit, validation state/report, coverage assertion output,
   per-role ledger, screenshot reviews, responsive JSON, security probe, visual baseline/diffs, and
   identity manifests.

## Rendering and truth rules

Use standalone HTML5 with embedded CSS and no external CDN. Keep it dense and scannable. Verify the
rendered artifact, not only the source file. Never show zero for an unexecuted metric; show
`NOT RUN`, `BLOCKED`, or `INCOMPLETE`. Never list a commit as pushed, released, deployed, or accepted
without direct evidence of that separate action.
