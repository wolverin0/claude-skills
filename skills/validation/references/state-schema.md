# State Schema

State file:

```text
test-manifest/validation-state.json
```

## Schema

```json
{
  "version": "3.0",
  "session": {
    "id": "val-YYYYMMDD-HHMMSS",
    "projectRoot": "absolute checkout path used to resolve relative evidence paths",
    "appUrl": "http://localhost:3000",
    "backend": "agent-browser",
    "mode": "standard",
    "sourceSha": "exact source revision",
    "buildId": "exact running build identifier",
    "implementationBy": "implementer identifier when designGate is requested",
    "role": "admin|public|...",
    "theme": "light|dark|default",
    "authMode": "none|manual|saved-state|config",
    "backendDetail": "playwright-project",
    "configPath": "validation.config.json",
    "status": "in_progress|incomplete|completed|failed|blocked",
    "currentPhase": "discover|test|visual-review|certify|report",
    "coverageComplete": false,
    "smokeScopeComplete": false,
    "startedAt": "ISO",
    "lastUpdatedAt": "ISO",
    "completedAt": null,
    "contextResets": 0
  },
  "auth": {
    "required": false,
    "blocked": false,
    "method": "none|env|storage-state|manual",
    "roles": [
      {"id": "admin", "authenticated": false, "stateFile": "test-manifest/auth/admin-state.json", "verifiedBy": "role-identifying element"}
    ]
  },
  "config": {
    "breakpoints": [
      {"name": "mobile", "width": 375, "height": 812},
      {"name": "tablet", "width": 768, "height": 1024},
      {"name": "laptop", "width": 1024, "height": 768},
      {"name": "desktop", "width": 1440, "height": 900}
    ],
    "roles": ["admin"],
    "themes": ["light", "dark"],
    "designGate": false,
    "ignoreConsolePatterns": ["ResizeObserver loop", "favicon.ico"],
    "destructiveActions": "skip|val-only|allow",
    "maxRoutes": null,
    "maxElements": null,
    "allowedAccessDeniedPaths": []
  },
  "preflight": {
    "passed": false,
    "serverStatus": "unknown|responding|failed",
    "loadTimeMs": null,
    "authRequired": false,
    "console": [],
    "errors": [],
    "blockers": []
  },
  "discovery": {
    "completedAt": null,
    "routes": [],
    "elements": [],
    "modals": [],
    "flows": [],
    "crudModules": [],
    "apiEndpoints": [],
    "truncation": {"routes": false, "elements": false}
  },
  "queues": {
    "routes": [],
    "elements": [],
    "modals": [],
    "flows": [],
    "crud": [],
    "api": [],
    "visualReviews": []
  },
  "results": {
    "routes": {},
    "elements": {},
    "modals": {},
    "flows": {},
    "crud": {},
    "api": {},
    "visualReviews": {
      "admin:light:customers:mobile": {
        "status": "pass|fail",
        "role": "admin", "theme": "light", "route": "customers", "breakpoint": "mobile",
        "sourceSha": "exact source revision", "buildId": "exact running build identifier",
        "implementationBy": "implementer identifier", "reviewedBy": "distinct reviewer identifier",
        "screenshot": "test-manifest/evidence/routes/admin-light-customers-mobile.png",
        "sha256": "64 hex digits of the inspected image",
        "analysis": {
          "hierarchy": "specific observation", "density": "specific observation",
          "alignment": "specific observation", "proportion": "specific observation",
          "states": "specific observation"
        }
      }
    }
  },
  "coverage": {
    "mode": "standard",
    "requestedScopeComplete": false,
    "coverageComplete": false,
    "smokeScopeComplete": false,
    "inventoryDeclared": false,
    "truncated": false,
    "unaccounted": [],
    "healthPassed": false,
    "healthFailures": [],
    "identityFailures": [],
    "certifiable": false,
    "counts": {}
  },
  "cleanup": {
    "attempted": false,
    "itemsFound": 0,
    "itemsDeleted": 0,
    "itemsFailed": 0,
    "failures": []
  },
  "summary": {
    "routesTested": 0,
    "routesPassed": 0,
    "routesFailed": 0,
    "routesSkipped": 0,
    "elementsTested": 0,
    "elementsPassed": 0,
    "elementsFailed": 0,
    "elementsSkipped": 0,
    "flowsTested": 0,
    "flowsPassed": 0,
    "flowsFailed": 0,
    "flowsSkipped": 0,
    "issues": 0,
    "consoleErrors": 0,
    "groupedConsoleIssues": 0,
    "networkFailures": 0,
    "rootCauseGroups": {
      "db-schema": 0,
      "db-rpc-missing": 0,
      "client-or-permission-error": 0,
      "server-error": 0,
      "runtime-exception": 0
    }
  },
  "report": {
    "path": null,
    "generatedAt": null,
    "partial": true
  }
}
```

## Atomic Update Pattern

`assert-coverage.js` marks result accounting and may exit `0` while recorded FAIL results remain.
Only `certify-validation.js` sets `session.status: "completed"`; it also generates the final HTML
with images, semantic review, and expected/observed element results. A hash mismatch, missing image,
unreviewed role/theme cell, failed check, or runner failure keeps certification incomplete.
The expected source/build target comes from `validation.config.json` or explicit certification CLI
arguments, never only from the state being certified. `designGate:true` requires implementer and
reviewer identifiers to differ; recording names is not proof of genuine visual inspection.

After every route, element, or flow:

1. Read current state from disk.
2. Add or replace the result.
3. Remove the item id from the matching queue.
4. Recompute summary counts from result objects.
5. Update `session.lastUpdatedAt`.
6. Write valid formatted JSON.

If safe atomic writes are available, write to `validation-state.json.tmp` and move/rename over the original. If not, still save immediately; stale context is worse than a slightly imperfect write.

## Queue IDs

Use stable IDs:

- route: route id or path slug
- element: `{routeId}-{type}-{labelSlug}-{index}`
- flow: short descriptive slug
- API endpoint: `{METHOD}-{path}` such as `GET-/api/customers`

Do not use backend refs as stable IDs. Browser refs are session-specific and go stale.
