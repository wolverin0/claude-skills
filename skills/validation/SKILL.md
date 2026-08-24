---
name: validation
description: 'Run evidence-based browser validation for an implemented web app, UI feature, or workflow. Successor to ultimate-validation: inventories routes, elements, modals, flows, and APIs; executes browser checks; analyzes screenshots and responsiveness; checks console/network errors; persists resumable state; and emits an auditable HTML report. Use smoke for a bounded quick check, standard for the complete safe UI cycle, and exhaustive/full for release-depth CRUD, API, security, accessibility, and visual-regression coverage.'
---

# Validation

Evidence-based browser validation for web apps. The skill must prove what it tested with screenshots, snapshots, console/error output, and observed state changes. A click without an observed outcome is not a pass.

This is the maintained successor to the archived `ultimate-validation` family. It preserves the
deep route/element/modal/screenshot workflow while using resumable phases and deterministic gates.

## Start

Invocation examples:

```bash
/validate
/validate http://localhost:3000
/validate --backend agent-browser --mode standard http://localhost:5173
/validate --backend playwright-local --config validation.config.json --mode standard http://localhost:5173
/validate --full http://localhost:5173
/validate --interactive
/validate --fresh
/validate --resume
```

Plain `/validate` runs the complete `standard` cycle: discover -> test -> screenshot review ->
report. If no URL is provided, detect a running local server or start the repo's normal dev command
when it is unambiguous. If neither is safe, ask for the URL. A completed prior state is archived and
a fresh run starts; use `--resume` only to continue an incomplete run.

When the request is specifically to inventory visual routes, capture every route across themes and
viewports, inspect screenshots, and check browser errors without running CRUD/security/audit stages,
delegate to `$visual-route-sweep`. Its verdict is visual-only and never substitutes for full validation.

## Defaults

- Backend: `auto` (`select-backend.js`; prefer `agent-browser`, then project-local Playwright)
- Mode: `standard`
- Auth: required when protected routes are found. The skill must authenticate (per role) before testing protected surface and must never report the login screen as a passing route. See `references/auth.md`. If no credentials/state/manual login is available for a login-gated app, the run is **blocked**, not passed.
- Output: `{project}/test-manifest/`
- State: `{project}/test-manifest/validation-state.json`
- Report: `{project}/test-manifest/reports/validation-{timestamp}.html`

## Modes

| Mode | Use | Coverage |
| --- | --- | --- |
| `smoke` | Fast confidence after small changes | key/changed routes and flows, 2 breakpoints; sampling is allowed; verdict is `SMOKE VERIFIED`, never `FULLY VALIDATED` |
| `standard` | Complete safe UI cycle; default | every declared/reachable route, every non-destructive element, every reachable modal, 4 breakpoints, console/network checks, critical flows, safe `VAL_` create/delete checks, and a zero-gap coverage ledger |
| `exhaustive` / `full` / `human` | Release/regression depth | standard plus every code-only surface and backend method/path accounted for, forms, `VAL_`-scoped CRUD, role/security probes, accessibility/performance checks, and visual regression |

Coverage is a contract, not a sample: in `standard` and `exhaustive`/`human` modes the skill
enumerates the full surface and accounts for every route, modal, button, and required CRUD/API check (tested,
skipped-with-reason, or quarantined). See `references/coverage-contract.md`. Responsiveness is
**measured**, not eyeballed — see `references/responsive-and-quality.md`.

`--full` is an alias for `--mode exhaustive`. `--max-routes` or `--max-elements` is legal for a
bounded investigation, but any truncation forces `session.status: incomplete` and
`session.coverageComplete: false`.

## Interactive Startup

If `--interactive` is set, or if backend/mode/auth cannot be inferred safely, ask concise questions before discovery:

1. Browser backend: recommend `agent-browser`; offer `playwright-cli`, `playwright-mcp`, `chrome-mcp`, or `browser-harness`.
2. Coverage mode: recommend `standard`; offer `smoke` or `exhaustive`.
3. Auth mode: recommend `manual login`; offer `none`, `saved state`, or `headers/config`.

For non-interactive runs, use flags or `validation.config.json`. Do not block on questions unless continuing would produce misleading results.

## Backend Selection

Load exactly one adapter from `adapters/` before browser work:

| Backend | Adapter | When to choose |
| --- | --- | --- |
| `agent-browser` | `adapters/agent-browser.md` | Default. Fast CLI, JSON output, sessions, screenshots, console/errors, network, Web Vitals. |
| `playwright-local` | `adapters/playwright-local.md` | Best fallback when the target project has Playwright installed; deterministic scripts write state/report directly. |
| `playwright-cli` | `adapters/playwright-cli.md` | Official Playwright CLI path, cross-browser needs, projects already invested in Playwright. |
| `playwright-mcp` | `adapters/playwright-mcp.md` | Host already exposes Playwright MCP and rich iterative introspection is more valuable than token cost. |
| `chrome-mcp` | `adapters/chrome-mcp.md` | Claude-in-Chrome, Codex-in-Chrome, or another host browser MCP is the only available browser. |
| `browser-harness` | `adapters/browser-harness.md` | Advanced real-Chrome/CDP fallback for unusual apps, iframe-heavy sites, or custom helper work. |

Use `agent-browser` unless the user chose another backend, the command is unavailable, or the environment clearly requires another adapter. If `agent-browser` is unavailable and the target project has `playwright` installed, prefer `playwright-local` before `playwright-cli`.

## Bundled Scripts

Use scripts when their assumptions match the task; they are more repeatable than hand-driving the browser.

| Script | Purpose |
| --- | --- |
| `scripts/select-backend.js` | Detect available validation backend from the target project and print a JSON recommendation. |
| `scripts/run-smoke-playwright.js` | Project-local Playwright validation with config support, text redaction, route screenshots, network/console grouping, safe standard-mode element checks, state, and HTML report. |
| `scripts/responsive-audit.js` | Measure responsiveness/layout quality at each breakpoint: horizontal scroll, element overflow, clipped text, overlap, tap-target size, font floor, viewport meta. Runs standalone (playwright-local) or via `AUDIT_SOURCE` injection on any backend. |
| `scripts/validate-multirole.js` | Multi-role orchestrator for apps with `roles[]`. Per role: UI-login with env creds (or saved storage-state) → verify off the login screen → per-role smoke → access-control matrix (canAccess renders, denied blocked, leaks=critical) → responsive per accessible route → per-role ledger + redacted report. Exit 0 only if 0 leaks / 0 access failures / 0 responsive-high / 0 auth failures. |
| `scripts/security-probe.js` | Active security/ownership probe (right-sized, not a pentest): service-role-JWT/secret-in-bundle scan, IDOR / object-level auth ("change the id in the URL"), non-destructive input fuzz (reflected XSS / 500s), security headers. Run authenticated per role. Exit 1 on any critical/high. See `references/security-probe.md`. |
| `scripts/visual-regression.js` | Baseline + pixel-diff screenshots per route × breakpoint (canvas-based, no native deps). `--update` writes baselines; later runs flag layouts that changed beyond a threshold ("the fix broke the page"). Run per role. Exit 1 on any regression. See `references/visual-regression.md`. |
| `scripts/redact-artifacts.js` | Redact provided secrets from generated text artifacts, including `test-manifest*` folders, and fail if leaks remain. |
| `scripts/record-visual-review.js` | Append one semantic screenshot review after the agent has actually inspected the image. |
| `scripts/assert-coverage.js` | Fail closed unless inventory, result accounting, screenshot reviews, and required mode gates are complete. This is the final certification gate. |
| `scripts/verify-provider-parity.js` | Verify that `.agents`, `.claude`, and `.codex` ship identical validation content and that both provider battle-test copies match. |

Prefer the script for `playwright-local`:

```bash
node path/to/scripts/select-backend.js
node path/to/scripts/run-smoke-playwright.js --url http://localhost:5173 --mode standard --config validation.config.json
node path/to/scripts/assert-coverage.js --state test-manifest/validation-state.json --config validation.config.json
node path/to/scripts/redact-artifacts.js .
```

## Required References

Read these when needed:

- `references/evidence-rules.md` before marking any route, element, or flow pass.
- `references/auth.md` whenever the app has a login — authenticate per role before testing protected surface; never pass the login screen.
- `references/responsive-and-quality.md` before judging any breakpoint or layout — responsiveness is measured, not eyeballed.
- `references/coverage-contract.md` in standard/exhaustive modes — enumerate and account for every route, modal, button, and required CRUD/API check.
- `references/state-schema.md` before creating or modifying `validation-state.json`.
- `references/interactive-start.md` when running in interactive mode.
- `references/config-schema.md` when the app has expected protected routes, custom breakpoints, or route-specific access rules.

## Phase Router

1. Check `test-manifest/validation-state.json`.
2. If `--fresh`, archive or replace old state and start at discovery.
3. If `--resume` and state is `in_progress`/`incomplete`, resume from `session.currentPhase`.
4. Otherwise archive a completed prior state under `test-manifest/history/` and start fresh. Plain
   `/validate` never silently reuses a green result from an older build.
5. Load only the current phase file:

| Phase | File |
| --- | --- |
| `discover` | `phases/DISCOVER.md` |
| `test` | `phases/TEST.md` |
| `report` | `phases/REPORT.md` |

## State Rules

- Write state after every route, element, flow, and report step.
- Write a semantic review after actually viewing every required screenshot. Capturing a PNG or
  computing a pixel diff is not screenshot analysis.
- Never keep progress only in conversation context.
- Use append-only evidence where practical: screenshots, snapshots, console logs, and issue records.
- On context pressure or long runs, pause cleanly after saving state and tell the user to run `/validate --resume`.

## Pass/Fail Standard

Pass requires evidence and zero failed required checks:

- Page loaded and was not blank.
- Screenshot or visual observation was analyzed.
- Responsive audit ran at every required breakpoint with zero high-severity findings (routes).
- Console/errors were checked.
- Expected UI outcome was observed after interaction.
- State file contains the result and evidence paths.
- In `standard`/`exhaustive`, `session.coverageComplete` is `true`, the coverage ledger has zero
  unaccounted items, and `assert-coverage.js` exits `0`. In `smoke`, require
  `session.smokeScopeComplete:true`; never label that result fully validated.

For LAUNCH validations (a release the public will touch), additionally recommend
one real-device pass to the operator: walk the core flow on a physical phone.
Emulated breakpoints catch layout; a real phone catches what they can't — touch
targets, keyboard-over-input, OS autofill, real network. Report it as an
operator checklist line, not a bot step.

Fail when a real user-facing break is observed: route crash, broken navigation, unhandled error, missing required interaction, unusable layout, failed form submission, broken modal/dialog, or verification mismatch.

Skip only when a route/element cannot be tested for a documented reason, such as missing auth, unsupported browser capability, an equivalent repeated control already exercised, or a destructive action not approved. Every skip remains in the ledger.

`incomplete` is not `failed`: it means the runner, inventory, auth, screenshot review, or approved
test-data scope could not support the requested coverage. Never translate it to a clean verdict.

## Output

At completion, report:

```text
=== VALIDATION COMPLETE ===
Backend: {backend}
Mode: {mode}
Coverage: complete=true, unaccounted=0
Routes: {passed}/{tested} passed
Elements: {passed}/{tested} passed
Flows: {passed}/{tested} passed
CRUD/API: {accounted}/{declared} accounted
Semantic screenshots: {reviewed}/{expected} reviewed
Issues: {count}
Report: test-manifest/reports/validation-{timestamp}.html
State: test-manifest/validation-state.json
Top issues:
1. ...
```

Keep the final user-facing summary brief. The HTML report contains the detail.
