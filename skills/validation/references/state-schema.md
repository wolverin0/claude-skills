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
    "appUrl": "http://localhost:3000",
    "backend": "agent-browser",
    "mode": "standard",
    "authMode": "none|manual|saved-state|config",
    "backendDetail": "playwright-project",
    "configPath": "validation.config.json",
    "status": "in_progress|completed|failed",
    "currentPhase": "discover|test|report",
    "startedAt": "ISO",
    "lastUpdatedAt": "ISO",
    "completedAt": null,
    "contextResets": 0
  },
  "config": {
    "breakpoints": [
      {"name": "mobile", "width": 375, "height": 812},
      {"name": "tablet", "width": 768, "height": 1024},
      {"name": "laptop", "width": 1024, "height": 768},
      {"name": "desktop", "width": 1440, "height": 900}
    ],
    "ignoreConsolePatterns": ["ResizeObserver loop", "favicon.ico"],
    "destructiveActions": "skip|val-only|allow",
    "maxRoutes": 30,
    "maxElements": 12,
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
    "flows": []
  },
  "queues": {
    "routes": [],
    "elements": [],
    "flows": []
  },
  "results": {
    "routes": {},
    "elements": {},
    "flows": {}
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

Do not use backend refs as stable IDs. Browser refs are session-specific and go stale.
