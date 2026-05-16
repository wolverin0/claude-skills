# Phase: Test

Goal: execute browser validation and store evidence after every unit of work.

Before this phase, read `references/evidence-rules.md`, `references/state-schema.md`, and the selected backend adapter.

## Resume

Read `test-manifest/validation-state.json`.

If resuming, increment `session.contextResets`, update `session.lastUpdatedAt`, save state, and continue from pending queues. Do not rediscover unless state is invalid or `--fresh` was requested.

## Test Order

1. Route visual/runtime checks.
2. Element interaction checks.
3. Critical flow checks.
4. Safe cleanup of `VAL_` artifacts.

For long runs, pause after a saved checkpoint when context or time is getting high. Never pause in the middle of a route/element/flow without saving a partial failure or retry marker.

## 1. Route Checks

For each pending route:

1. Navigate to `appUrl + route.path`.
2. Wait for stable content.
3. For each configured breakpoint:
   - set viewport
   - capture screenshot to `test-manifest/evidence/routes/{routeId}-{breakpoint}.png`
   - analyze the image/visible page
   - record specific layout findings
4. Capture a snapshot to `test-manifest/evidence/routes/{routeId}-snapshot.{txt|json|yml}` when backend supports it.
5. Check console/errors and record actual messages.
6. Check failed network responses and group by HTTP status/resource.
7. Determine verdict.
8. Save state.

Route pass requires no blocking console/page errors, no blocking failed network responses, nonblank content, and usable layout at required breakpoints.

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

## 4. Cleanup

Clean only data that this validation created and can identify by `VAL_`.

1. Search/list pages for `VAL_` records created during this run.
2. Delete them through normal UI flows.
3. Verify each deletion.
4. Record cleanup results in state.

Do not delete non-`VAL_` data.

## 5. Suspicion Checks

Before moving to report, inspect the result set:

- If many routes were tested and every issue array is empty, re-check at least the most complex route.
- If all interactions passed but no post-action state changed, mark those tests invalid and rerun or fail them.
- If console/errors were not actually collected, do not mark the item pass.
- If screenshots exist but no analysis text exists, do not mark the item pass.

## 6. Save Final Test State

When queues are empty or the run is intentionally partial:

- update summary counts
- set `session.currentPhase: "report"`
- save state
- proceed to `phases/REPORT.md`
