---
name: validation
description: Use when an implemented web app, UI feature, workflow, or frontend change needs evidence-based validation in a real browser. Runs interactive discovery, browser execution, screenshot analysis, console/error checks, critical-flow testing, stateful resume, and HTML reporting. Supports CLI-agnostic adapters including agent-browser, playwright-cli, Playwright MCP, Claude/Codex Chrome MCP tools, and browser-harness.
---

# Validation

Evidence-based browser validation for web apps. The skill must prove what it tested with screenshots, snapshots, console/error output, and observed state changes. A click without an observed outcome is not a pass.

## Start

Invocation examples:

```bash
/validate http://localhost:3000
/validate --backend agent-browser --mode standard http://localhost:5173
/validate --backend playwright-local --config validation.config.json --mode standard http://localhost:5173
/validate --interactive
/validate --fresh
/validate --resume
```

If no URL is provided, look for a running local server. If none is obvious, ask for the URL.

## Defaults

- Backend: `agent-browser`
- Mode: `standard`
- Auth: `manual` when protected routes are found, otherwise `none`
- Output: `{project}/test-manifest/`
- State: `{project}/test-manifest/validation-state.json`
- Report: `{project}/test-manifest/reports/validation-{timestamp}.html`

## Modes

| Mode | Use | Coverage |
| --- | --- | --- |
| `smoke` | Fast confidence after small changes | preflight, key routes, key flows, 2 breakpoints |
| `standard` | Default PR validation | all discovered routes, interactive elements, 4 breakpoints, critical flows |
| `exhaustive` | Release/regression validation | standard plus deeper forms, CRUD-like flows, network/perf/a11y where backend supports it |

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
| `scripts/redact-artifacts.js` | Redact provided secrets from generated text artifacts, including `test-manifest*` folders, and fail if leaks remain. |

Prefer the script for `playwright-local`:

```bash
node path/to/scripts/select-backend.js
node path/to/scripts/run-smoke-playwright.js --url http://localhost:5173 --mode standard --config validation.config.json
node path/to/scripts/redact-artifacts.js .
```

## Required References

Read these when needed:

- `references/evidence-rules.md` before marking any route, element, or flow pass.
- `references/state-schema.md` before creating or modifying `validation-state.json`.
- `references/interactive-start.md` when running in interactive mode.
- `references/config-schema.md` when the app has expected protected routes, custom breakpoints, or route-specific access rules.

## Phase Router

1. Check `test-manifest/validation-state.json`.
2. If `--fresh`, archive or replace old state and start at discovery.
3. If state exists with `status: in_progress`, resume from `session.currentPhase`.
4. If state exists with `status: completed` and no `--fresh`, show the last summary and report path, then ask whether to rerun.
5. Load only the current phase file:

| Phase | File |
| --- | --- |
| `discover` | `phases/DISCOVER.md` |
| `test` | `phases/TEST.md` |
| `report` | `phases/REPORT.md` |

## State Rules

- Write state after every route, element, flow, and report step.
- Never keep progress only in conversation context.
- Use append-only evidence where practical: screenshots, snapshots, console logs, and issue records.
- On context pressure or long runs, pause cleanly after saving state and tell the user to run `/validate --resume`.

## Pass/Fail Standard

Pass requires evidence:

- Page loaded and was not blank.
- Screenshot or visual observation was analyzed.
- Console/errors were checked.
- Expected UI outcome was observed after interaction.
- State file contains the result and evidence paths.

Fail when a real user-facing break is observed: route crash, broken navigation, unhandled error, missing required interaction, unusable layout, failed form submission, broken modal/dialog, or verification mismatch.

Skip only when a route/element cannot be tested for a documented reason, such as missing auth, unsupported browser capability, or destructive action not approved.

## Output

At completion, report:

```text
=== VALIDATION COMPLETE ===
Backend: {backend}
Mode: {mode}
Routes: {passed}/{tested} passed
Elements: {passed}/{tested} passed
Flows: {passed}/{tested} passed
Issues: {count}
Report: test-manifest/reports/validation-{timestamp}.html
State: test-manifest/validation-state.json
Top issues:
1. ...
```

Keep the final user-facing summary brief. The HTML report contains the detail.
