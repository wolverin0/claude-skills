# Phase: Report

Goal: generate an evidence-based HTML report from saved state and artifacts.

Before this phase, read `references/state-schema.md`. Use `templates/report.html` if useful, but keep the report generation pragmatic.

## 1. Load State

Read `test-manifest/validation-state.json`.

Validate that summary counts match actual result objects. If they do not match, recompute from results before generating the report.

## 2. Determine Completeness

Complete only when `scripts/assert-coverage.js` exits `0`. At minimum this requires:

- `queues.routes`
- `queues.elements`
- `queues.flows`
- `queues.modals`
- `queues.crud`
- `queues.visualReviews`
- `session.coverageComplete: true` for standard/exhaustive, or
  `session.smokeScopeComplete: true` for smoke
- `coverage.unaccounted` is empty and no inventory truncation is hidden

If any requirement is missing, generate a partial report and keep `session.status: "incomplete"`.
Do not infer completeness merely because the queues created by a capped discovery pass are empty.

## 3. Report Contents

The HTML report must include:

- app URL, backend, mode, timestamps
- completion status and resume command if partial
- summary cards
- coverage inventory and ledger, including skips by reason and unaccounted items
- semantic screenshot-review findings beside the corresponding images
- top issues sorted by severity
- route results with screenshot links and analysis
- element results with expected vs observed outcomes
- flow results with step evidence
- console/errors grouped by route/action
- failed network responses grouped by route/action
- root-cause groups such as `db-schema`, `db-rpc-missing`, `client-or-permission-error`, `server-error`, and `runtime-exception`
- cleanup results
- raw state file link/path

Every failure must include:

- where it happened
- source: `app`, `runner`, or `environment`
- what was expected
- what was observed
- evidence path(s)
- reproduction steps when interactive

Group repeated console/API/network messages by normalized text, status, URL, and count. Do not inflate the issue list with 20 identical resource failures; report both grouped count and total observed count.

## 4. Evidence Paths

Use relative links from the report file to evidence under `test-manifest/evidence/`.

If a backend writes screenshots elsewhere, copy or reference them consistently in state before report generation. Do not emit broken image links.

## 5. Write Report

Write:

```text
test-manifest/reports/validation-{YYYYMMDD-HHMMSS}.html
```

Then update state:

```json
{
  "session": {
    "currentPhase": "report",
    "status": "completed|in_progress",
    "completedAt": "ISO if complete"
  },
  "report": {
    "path": "test-manifest/reports/validation-....html",
    "generatedAt": "ISO",
    "partial": false
  }
}
```

## 6. Final Output

Return a concise summary:

```text
=== VALIDATION REPORT GENERATED ===
Status: COMPLETE|PARTIAL
Backend: {backend}
Mode: {mode}
Routes: {passed}/{tested} passed
Elements: {passed}/{tested} passed
Flows: {passed}/{tested} passed
Issues: {count}
Report: test-manifest/reports/validation-{timestamp}.html
State: test-manifest/validation-state.json
```

List only the top 3-5 issues in chat. The report carries the details.
