# Phase: Test

Goal: execute browser validation and store evidence after every unit of work.

Before this phase, read `references/evidence-rules.md`, `references/state-schema.md`, `references/responsive-and-quality.md`, `references/auth.md`, and the selected backend adapter. In `standard`/`exhaustive` modes also read `references/coverage-contract.md`.

## Per-Role Execution

If `auth.roles` has more than one role, run sections 1–3 once per role: establish that role's
auth (load `test-manifest/auth/{role}-state.json` or log in), confirm the role is active, then
run the passes with role-scoped evidence paths (`.../routes/{role}/...`). Single-role apps run
once. Never test protected surface before auth is established for the current role — a protected
route that renders the login form is a `fail` (auth not established), source `environment`, not a
pass. See `references/auth.md`.

After each role's route/element passes, run that role's **access-control checks**: every declared
`canAccess` route must render real content (`pass`); every declared `denied` route must be blocked
(`pass` = correctly denied). A `denied` route that renders real content is a `fail`, severity
critical — an authorization leak, the highest-value finding here.

`validate-multirole.js` is supplementary auth/access evidence. Its exit `0` never replaces the main
route/element/modal/flow coverage ledger or semantic screenshot review.

## Resume

Read `test-manifest/validation-state.json`.

If resuming, increment `session.contextResets`, update `session.lastUpdatedAt`, save state, and continue from pending queues. Do not rediscover unless state is invalid or `--fresh` was requested.

## Test Order

1. Route visual/runtime checks.
2. Element interaction checks.
3. Semantic review of every route × breakpoint screenshot.
4. Modal, critical-flow, requested CRUD, and exhaustive API checks.
5. Safe cleanup of `VAL_` artifacts.

For long runs, pause after a saved checkpoint when context or time is getting high. Never pause in the middle of a route/element/flow without saving a partial failure or retry marker.

## 1. Route Checks

For each pending route:

1. Navigate to `appUrl + route.path`.
2. Wait for stable content.
3. For each configured breakpoint:
   - set viewport
   - capture screenshot to `test-manifest/evidence/routes/{routeId}-{breakpoint}.png`
   - **run the responsive auditor** (`scripts/responsive-audit.js`) at this viewport per
     `references/responsive-and-quality.md`. Do not eyeball the screenshot — measure it.
   - save the auditor JSON to `test-manifest/evidence/routes/{routeId}-responsive-{breakpoint}.json`
   - record each finding (type, severity, selector, measured numbers) as layout evidence
4. Capture a snapshot to `test-manifest/evidence/routes/{routeId}-snapshot.{txt|json|yml}` when backend supports it.
5. Run the best-practices / a11y checklist from `references/responsive-and-quality.md` using the
   snapshot plus targeted checks; record each item pass/fail with offending selectors.
6. Check console/errors and record actual messages.
7. Check failed network responses and group by HTTP status/resource.
8. Determine verdict.
9. Save state.

Route pass requires: no blocking console/page errors, no blocking failed network responses,
nonblank content, **zero high-severity responsive findings at every required breakpoint**, and
no failed structural a11y checklist items. A high-severity responsive finding (horizontal
scroll, element overflow, missing viewport meta) is a route `fail`, not a cosmetic note. Medium
findings make the route a `warning` unless config exempts them. Always cross-check one
high-severity finding against its screenshot before reporting, so a measurement bug is
classified as `runner`, not `app`.

If route rendering visually succeeds but the backend captures real console errors, failed API calls, or page errors, mark the route `fail` or `warning` according to severity. Do not leave the route as `pass` with a separate issue count unless the errors are explicitly ignored by config.

If a protected route renders an access-denied page:

- mark it `fail` when the route was visible in navigation and not configured as allowed
- mark it `pass` or `skip` only when `validation.config.json` explicitly declares `allowAccessDenied` or includes the route in `allowedAccessDeniedPaths`

## 2. Element Checks

For each pending element:

1. Navigate to the element route.
2. Capture pre-action snapshot and screenshot.
3. Resolve a fresh ref/selector. Refs from discovery may be stale.
4. Check console/errors baseline.
5. Perform the safest meaningful action:
   - buttons/links: click
   - inputs: fill `VAL_Test_{timestamp}` or field-specific safe data
   - selects: choose first non-empty safe option
   - checkboxes/toggles: toggle and verify state
6. Wait for the expected signal.
7. Capture post-action snapshot and screenshot.
8. Check console/errors delta.
9. Check failed network responses delta.
10. Verify expected behavior using observable evidence.
11. Save state.

Verification examples:

| Expected behavior | Verification |
| --- | --- |
| opens-dialog | dialog/modal visible in snapshot/screenshot |
| closes-dialog | dialog no longer visible |
| navigates | URL or page heading changed as expected |
| submits-form | success message, validation message, redirect, or persisted data appears |
| filters-data | result count/content/query state changed |
| toggles-state | visible state or accessible state changed |
| downloads | download event/file evidence exists |

If expected behavior is unknown, document the observed outcome and mark `pass` only if the behavior is clearly valid for the UI. Otherwise use `skip` with a reason or `fail` if it appears broken.

If an interaction cannot be executed because the validation runner used an ambiguous selector or stale backend ref, mark the element `skip` with an adapter/test-runner note. Only mark the app `fail` after verifying the same issue with a reliable locator, coordinate click, or user-visible evidence.

For deterministic `playwright-local` standard mode, execute only safe non-destructive candidates unless the user approved deeper flows. Safe default candidates include navigation links and buttons whose labels suggest open/view/configure/filter/search/menu behavior. Skip labels that imply data mutation such as save, submit, pay, charge, approve, reject, delete, or sign out.

## 3. Critical Flows

For each pending flow:

1. Start at the flow route.
2. Execute each step with fresh snapshots between actions.
3. Use `VAL_` test data for creates/updates.
4. Capture evidence at meaningful points.
5. Verify the final user-visible outcome.
6. If a step fails, stop that flow, record the failing step, save state, and continue to the next safe item.

Interactive bugs require step evidence. If supported, record video for complex reproductions; otherwise use before/action/after screenshots.

## 3b. Security & Ownership Probe (exhaustive mode, or when auth/user-data exists)

After the authenticated passes, run `scripts/security-probe.js` per role (pass each role's
storage-state) per `references/security-probe.md`. It checks secrets-in-bundle, IDOR / object-level
auth ("change the id in the URL"), non-destructive input fuzz, and security headers. Any
critical/high finding (service-role key shipped, confirmed IDOR, executed XSS) is a route/app
`fail`, severity critical — record it with evidence. Provide `security.idorTargets` /
`autoIdorPaths` in `validation.config.json` for real object-level coverage. This probe never
mutates data or submits destructive forms.

## 3c. Visual Regression (when a baseline exists)

If `test-manifest/baseline/` exists from a prior run, run `scripts/visual-regression.js` per role
to pixel-diff each route × breakpoint against its baseline and flag layouts that changed beyond the
threshold (see `references/visual-regression.md`). A regression is a `warning` to review against the
before/after screenshots; `sizeChanged` (page grew/shrank) is the strongest signal of a real break.
After an intended UI change, refresh baselines with `--update`. This is the natural re-check after
fixes (e.g. the `/battle-test` re-validate stage).

## 3d. API Contract Checks (exhaustive)

For each queued API endpoint, verify the declared method/path, authentication boundary, expected
status class, and response shape without using production credentials or uncontrolled mutations.
Use read-only requests directly. Exercise mutation endpoints only with isolated `VAL_` data and
clean it through the normal contract; otherwise record `skip` with `destructive-unapproved`.
Record console-observed API failures separately from direct endpoint coverage. Save one explicit
`pass`, `fail`, or `skip` result per endpoint ID in `results.api` and remove it from `queues.api`.

## 4. Cleanup

Clean only data that this validation created and can identify by `VAL_`.

1. Search/list pages for `VAL_` records created during this run.
2. Delete them through normal UI flows.
3. Verify each deletion.
4. Record cleanup results in state.

Do not delete non-`VAL_` data.

## 4b. Semantic Screenshot Review

Open every screenshot in `queues.visualReviews` with an image-capable tool. Inspect layout,
clipping, overlap, hierarchy, legibility, empty/error states, mobile navigation, and obvious visual
inconsistency. Pixel diff and DOM measurements are supporting evidence, not this review.

After viewing each image, call `record-visual-review.js` with route, breakpoint, pass/fail, the
screenshot path, concrete analysis, and issue lines. Never bulk-fill generic analysis text. A review
shorter than 20 characters is rejected, and `assert-coverage.js` requires one record per image.

## 5. Suspicion Checks

Before moving to report, inspect the result set:

- If many routes were tested and every issue array is empty, re-check at least the most complex route.
- If all interactions passed but no post-action state changed, mark those tests invalid and rerun or fail them.
- If console/errors were not actually collected, do not mark the item pass.
- If screenshots exist but no analysis text exists, do not mark the item pass.

## 6. Save Final Test State

When queues are empty or the run is intentionally partial:

- update summary counts
- in `standard`/`exhaustive` modes, compute the coverage ledger from `references/coverage-contract.md`
  (routes/modals/elements/CRUD/API: tested vs skipped-with-reason vs untested) and save it to state
- if any reachable, non-destructive item is neither tested nor skipped-with-reason, set
  `session.coverageComplete: false`; the run is `incomplete`, not `complete`
- run `scripts/assert-coverage.js --state test-manifest/validation-state.json --config validation.config.json`
- only exit `0` from that gate authorizes `session.status: "completed"`; otherwise keep
  `session.status: "incomplete"` and report the exact `unaccounted[]` entries
- set `session.currentPhase: "report"`
- save state
- proceed to `phases/REPORT.md`
