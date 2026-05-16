# Validation Config

Optional file:

```text
validation.config.json
```

Use it when the app needs stable route expectations, custom breakpoints, extra redaction values, or permission-aware route classification.

## Example

```json
{
  "maxRoutes": 30,
  "maxElements": 12,
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
  ]
}
```

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `maxRoutes` | number | Route cap for discovery/configured route testing. |
| `maxElements` | number | Cap for safe non-destructive element checks in `standard`/`exhaustive`. |
| `breakpoints` | array | Viewports to capture for each route. |
| `ignoreConsolePatterns` | string[] | Case-insensitive regex strings ignored in console/network grouping. |
| `redactValues` | string[] | Extra values redacted before writing text artifacts. |
| `allowedAccessDeniedPaths` | string[] | Routes where an access-denied page is expected and not an app failure. |
| `routes` | object[] | Stable route definitions added before browser-discovered links. |

Never put real passwords, API keys, bearer tokens, or private cookies in the config. Use environment variables and the redaction script.
