# Phase: Discover

Goal: build a complete enough test manifest to drive real browser validation without guessing.

Before this phase, the orchestrator must load one backend adapter and `references/state-schema.md`. If `validation.config.json` exists, also load `references/config-schema.md`.

If using the `playwright-local` adapter, prefer `scripts/run-smoke-playwright.js`; it performs discovery, testing, state writing, redacted text artifacts, and report generation in one deterministic pass.

## 1. Preflight

1. Resolve `appUrl`.
2. Create directories:
   - `test-manifest/`
   - `test-manifest/evidence/routes/`
   - `test-manifest/evidence/elements/`
   - `test-manifest/evidence/flows/`
   - `test-manifest/reports/`
3. Open the app with the selected backend.
4. Verify:
   - page responds
   - page is not blank
   - title or body content is visible
   - console/errors were checked
   - auth wall is detected and documented

If preflight fails, write state with `session.currentPhase: "discover"` and `preflight.passed: false`, then stop with concrete blockers.

## 2. Route Discovery

Use both code and browser evidence when available.

Discovery source order:

1. Explicit routes in `validation.config.json`.
2. Existing app router files when obvious and cheap to inspect.
3. Browser links/buttons from the loaded app.
4. Sitemap, nav menus, or route manifests.
5. User-supplied route list.

Code scan candidates:

```text
React: BrowserRouter, Routes, Route, createBrowserRouter
Next.js: app/**/page.*, pages/**/*.*
Vue/Nuxt: createRouter, routes: [], pages/**/*.vue
Links: href values from browser snapshots
```

Record each route:

```json
{
  "id": "customers",
  "path": "/customers",
  "source": "config|code|crawl|manual",
  "file": "src/pages/Customers.tsx",
  "access": "public|protected|admin|unknown",
  "priority": "critical|normal|low",
  "expected": "Dashboard should render for authenticated users.",
  "allowAccessDenied": false,
  "status": "pending"
}
```

In `smoke` mode, prioritize landing, login/auth, dashboard/home, recently changed routes, and routes with create/edit/delete actions.

## 3. Browser Route Pass

For every selected route:

1. Navigate to the route.
2. Wait for load or a specific stable UI signal.
3. Capture a snapshot.
4. Capture screenshots for mode breakpoints.
5. Analyze visible layout:
   - blank/loading state
   - overflow or clipping
   - overlapping UI
   - hidden or inaccessible navigation
   - modal/overlay blockers
6. Check console/errors.
7. Discover interactive elements from snapshot and visible UI.

Standard/exhaustive breakpoints:

| Name | Width | Height |
| --- | ---: | ---: |
| mobile | 375 | 812 |
| tablet | 768 | 1024 |
| laptop | 1024 | 768 |
| desktop | 1440 | 900 |

Smoke breakpoints:

| Name | Width | Height |
| --- | ---: | ---: |
| mobile | 375 | 812 |
| desktop | 1440 | 900 |

## 4. Element Inventory

Record every meaningful interactive element:

```json
{
  "id": "customers-add-button",
  "route": "/customers",
  "type": "button|link|input|select|checkbox|dialog-trigger|form|other",
  "label": "Add Customer",
  "selectorHint": "@e4 or css/role locator",
  "expectedBehavior": "opens-dialog|navigates|submits-form|filters-data|downloads|toggles-state|unknown",
  "destructive": false,
  "status": "pending"
}
```

Inference guide:

| Label pattern | Expected behavior |
| --- | --- |
| Add, Create, New, + | opens form/dialog or navigates to create page |
| Edit, Update | opens edit form or enables editing |
| Delete, Remove, Trash | asks confirmation, then removes item |
| Save, Submit, Confirm | persists form or shows validation |
| Cancel, Close, X | closes without persisting |
| Search, Filter | changes result set or query state |
| Export, Download | triggers download or file response |
| View, Details, Open | navigates or opens detail view |

Mark destructive actions and do not execute them in testing unless they target `VAL_` data or the user approved destructive validation.

## 5. Critical Flows

Identify flows users would expect to work:

```json
{
  "id": "create-customer",
  "route": "/customers",
  "description": "Create a customer and see it in the list",
  "steps": [
    {"action": "click", "target": "customers-add-button"},
    {"action": "fill-form", "dataPrefix": "VAL_"},
    {"action": "submit"},
    {"verify": "created item appears"}
  ],
  "status": "pending"
}
```

Minimum flow candidates:

- auth/login if auth exists
- main navigation
- one create-like flow per major module where safe
- one delete cleanup flow for `VAL_` data
- primary search/filter workflow if present

## 6. Save State

Write `test-manifest/validation-state.json` with:

- `session.currentPhase: "test"`
- selected backend and mode
- preflight results
- discovered routes, elements, flows
- pending queues for route, element, and flow tests
- evidence path references

Output a short discovery summary and proceed to `phases/TEST.md`.
