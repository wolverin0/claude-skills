# Validation Config

Optional file:

```text
validation.config.json
```

Use it when the app needs stable route expectations, custom breakpoints, extra redaction values, or permission-aware route classification.

## Example

```json
{
  "inventoryComplete": true,
  "breakpoints": [
    { "name": "mobile", "width": 375, "height": 812 },
    { "name": "tablet", "width": 768, "height": 1024 },
    { "name": "desktop", "width": 1440, "height": 900 }
  ],
  "ignoreConsolePatterns": ["ResizeObserver loop", "favicon.ico"],
  "redactValues": ["extra-secret-or-test-user"],
  "allowedAccessDeniedPaths": ["/admin"],
  "routes": [
    {
      "id": "dashboard",
      "path": "/",
      "label": "Dashboard",
      "priority": "critical",
      "access": "protected",
      "expected": "Dashboard should render for authenticated users."
    },
    {
      "id": "admin",
      "path": "/admin",
      "label": "Admin",
      "allowAccessDenied": true,
      "expected": "Non-admin users may see Access Denied."
    }
  ],
  "modals": [
    { "id": "create-customer", "route": "/customers", "triggerLabel": "Add customer", "reachable": true }
  ],
  "flows": [
    { "id": "customer-search", "route": "/customers", "description": "Search and clear the customer list filter" }
  ],
  "crudModules": [
    { "id": "customers", "route": "/customers", "dataPrefix": "VAL_" }
  ],
  "apiEndpoints": [
    { "id": "GET-/api/customers", "method": "GET", "path": "/api/customers", "access": "protected", "destructive": false },
    { "id": "POST-/api/customers", "method": "POST", "path": "/api/customers", "access": "protected", "destructive": true }
  ]
}
```

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `inventoryComplete` | boolean | Set true only after reconciling code scan and runtime crawl. Required for standard/exhaustive certification. |
| `maxRoutes` | number | Optional bounded-run cap. Any truncation makes standard/exhaustive incomplete. |
| `maxElements` | number | Optional bounded-run cap. Any truncation makes standard/exhaustive incomplete. |
| `breakpoints` | array | Viewports to capture for each route. |
| `ignoreConsolePatterns` | string[] | Case-insensitive regex strings ignored in console/network grouping. |
| `redactValues` | string[] | Extra values redacted before writing text artifacts. |
| `allowedAccessDeniedPaths` | string[] | Routes where an access-denied page is expected and not an app failure. |
| `routes` | object[] | Stable route definitions added before browser-discovered links. |
| `modals` | object[] | Code-scan modal/dialog inventory with route, trigger, and reachability. |
| `flows` | object[] | Critical workflow inventory and expected behavior. |
| `crudModules` | object[] | Data modules requiring `VAL_`-scoped CRUD coverage in exhaustive mode. |
| `apiEndpoints` | object[] | Code-derived backend endpoint inventory. Exhaustive mode accounts for every method/path with a safe probe or explicit skip reason. |
| `roles` | object[] | Roles to validate. Each role drives a full pass. See `references/auth.md`. |

## Roles (multi-role apps)

Declare every role that sees different access or features. Each role names the **env var keys**
for its credentials (not the values) or a saved storage-state file, plus its expected
access-control surface:

```json
{
  "roles": [
    {
      "id": "admin",
      "label": "Administrator",
      "credentialsEnv": { "email": "VALIDATION_EMAIL_ADMIN", "password": "VALIDATION_PASSWORD_ADMIN" },
      "storageState": "test-manifest/auth/admin-state.json",
      "canAccess": ["/usuarios", "/configuracion"],
      "denied": []
    },
    {
      "id": "operator",
      "label": "Operator",
      "credentialsEnv": { "email": "VALIDATION_EMAIL_OP", "password": "VALIDATION_PASSWORD_OP" },
      "canAccess": ["/monitoreo", "/puesto"],
      "denied": ["/usuarios", "/configuracion"]
    }
  ]
}
```

`denied` routes are positive tests: a `denied` route that renders real content is a critical
authorization leak. If `roles` is omitted but the app is login-gated, a single default role is
used from `VALIDATION_EMAIL` / `VALIDATION_PASSWORD`, and other roles are flagged untested.

Never put real passwords, API keys, bearer tokens, or private cookies in the config. Use environment variables and the redaction script.
