# Phase: Discover

Goal: build a complete enough test manifest to drive real browser validation without guessing.

Before this phase, the orchestrator must load one backend adapter, `references/state-schema.md`, and `references/auth.md`. If `validation.config.json` exists, also load `references/config-schema.md`. In `standard` and `exhaustive`/`human` modes also load `references/coverage-contract.md` — discovery must enumerate the full surface (every route, modal, button, CRUD module, and in exhaustive mode every backend API endpoint), not a sample.

If using the `playwright-local` adapter, prefer `scripts/run-smoke-playwright.js` for deterministic
evidence collection. It does not certify the run: the agent must still inspect every queued
screenshot, exercise configured modal/flow/CRUD work, and run `assert-coverage.js`.

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

## 1b. Auth Gate (mandatory before testing protected surface)

Apply `references/auth.md`:

1. If the landing route or any expected route sits behind a login form/redirect, set
   `preflight.authRequired: true`.
2. Determine the available auth method: per-role env credentials, saved storage-state files, or
   (interactive only) approved manual login.
3. **If `authRequired` and no auth method is available, STOP** with the credentials-required
   message from `references/auth.md`. Do not enumerate or test protected routes as if anonymous.
   Public routes may still be tested as a partial run. Write `auth.blocked: true` to state.
4. Enumerate roles from `validation.config.json` → `roles`. If none declared but the app clearly
   has multiple access levels, ask (interactive) or document the assumption that one role is being
   covered and flag the others as untested in the ledger.
5. For each role, establish auth, verify the role is actually logged in (a role-identifying
   element, not merely "left the login screen"), and save storage-state to
   `test-manifest/auth/{role}-state.json` for reuse.

## 2. Route Discovery

Use both code and browser evidence when available.

For `standard`/`exhaustive`, reconcile code scan and runtime crawl, then write the complete inventory
to `validation.config.json` with `inventoryComplete: true`. Do not set that flag when a framework,
router, API handler/RPC surface, permission surface, or dynamic-route source remains unexamined. The deterministic runner
fails closed without this declaration.

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

## 4b. Modal / Dialog Code Scan (standard + exhaustive)

Runtime crawl misses overlays behind permissions or unlinked triggers. Code-scan so each modal
is inventoried even if no obvious button opens it:

- Glob: `**/*Dialog.*`, `**/*Modal.*`, `**/*Sheet.*`, `**/*Drawer.*`, `**/*Popover.*`.
- Grep: `DialogContent`, `AlertDialog`, `Modal`, `role="dialog"`, `aria-modal`.

For each, record type (`create|edit|view|confirmation` from its name), the route/component that
imports it, its trigger button when findable, and `reachable: true|false`. Add an element row
with `type: "dialog-trigger"` for each reachable modal. Modals with no findable trigger stay in
the inventory as `reachable: false` so the gap is visible in the report, not silently dropped.

## 4c. CRUD Module Enumeration (standard + exhaustive)

List every data module that has a list view plus create/edit/delete (Customers, Products,
Invoices, ...). Each becomes a CRUD flow candidate (§5). In `exhaustive`/`human` mode the full
create→read→update→delete cycle per module is required, using `VAL_`-prefixed data.

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

## 5b. API Endpoint Inventory (exhaustive)

Enumerate backend method/path pairs from the server router, framework handlers, RPC declarations,
edge/serverless functions, and OpenAPI or generated route manifests. Reconcile them with browser
network traffic, but do not treat traffic as the complete inventory. Record `id`, `method`, `path`,
`access`, owning source file, `destructive`, and expected safe status/shape. Queue every endpoint
for the exhaustive pass; destructive endpoints require isolated `VAL_` data or an explicit skip
reason.

## 6. Save State

Write `test-manifest/validation-state.json` with:

- `session.currentPhase: "test"`
- selected backend and mode
- preflight results
- discovered routes, elements, flows
- discovered modals, CRUD modules, and API endpoints
- pending queues for route, element, modal, flow, CRUD, API, and semantic screenshot-review tests
- evidence path references

In `standard`/`exhaustive` modes, also print and save the coverage inventory gap report from
`references/coverage-contract.md`:

```text
=== COVERAGE INVENTORY ===
Routes:   {found} found ({code} code, {crawl} crawl, {both} both) | reachable: {n} unreachable: {n}
Modals:   {found} found (code scan)                               | trigger known: {n} unreachable: {n}
Elements: {n} discovered across reachable routes
CRUD modules: {n} ({list})
API endpoints: {n} ({readOnly} read-only, {mutation} mutation)
```

Output a short discovery summary and proceed to `phases/TEST.md`.
