# Evidence Rules

Validation is only credible when each verdict has observable proof.

## Hard Gates

Do not mark `pass` unless all relevant gates are satisfied:

- Route was opened in a real browser.
- Page was not blank or stuck in an unexpected loading state.
- Screenshot or live visual state was analyzed.
- Snapshot/page state was captured when backend supports it.
- Console/errors were checked.
- Failed network responses were checked when backend supports it.
- For interactions, an expected outcome was observed after the action.
- Evidence was written to state.

## Invalid Evidence

These are not enough:

- "Clicked successfully"
- "Screenshot taken"
- "Looks good"
- "No errors" without actual console/error collection
- "Should work" based on source code
- "Similar route tested" unless the mode explicitly allows sampling

## Result Shape

Each route/element/flow result should include:

```json
{
  "id": "string",
  "type": "route|element|flow",
  "status": "pass|fail|skip",
  "severity": "critical|high|medium|low|info",
  "expected": "what should happen",
  "observed": "what actually happened",
  "evidence": {
    "screenshots": [],
    "snapshots": [],
    "console": [],
    "errors": [],
    "network": [],
    "notes": []
  },
  "rationale": "specific reason for verdict"
}
```

## Severity

| Severity | Meaning |
| --- | --- |
| critical | Blocks core use: app crash, auth broken, data loss, payment/checkout impossible |
| high | Major workflow broken or unhandled runtime error |
| medium | Important UI/functionality issue with workaround |
| low | Cosmetic or minor usability issue |
| info | Observation, limitation, or skipped capability |

## Failure Source

Classify failures before reporting:

| Source | Use when |
| --- | --- |
| `app` | The user-facing product failed with reliable evidence. |
| `runner` | The validation backend, locator strategy, or script failed before product behavior was verified. |
| `environment` | Server, auth, browser install, network, or permissions blocked validation. |

Runner failures should be `skip` or `runner-fail`, not app failures. They still count as skill improvement opportunities.

## Root Cause Groups

When console or network failures exist, group them before reporting:

| Group | Examples |
| --- | --- |
| `db-schema` | Supabase/PostgREST schema cache, relationship, or foreign-key lookup failures |
| `db-rpc-missing` | Missing RPC/function errors such as `PGRST202` |
| `client-or-permission-error` | HTTP 4xx, access denied, missing resource, auth/permission failures |
| `server-error` | HTTP 5xx |
| `runtime-exception` | browser page errors / uncaught exceptions |
| `browser-warning` | non-blocking warnings |

## Suspicion Triggers

Investigate before reporting completion:

- all routes passed with no warnings in a nontrivial app
- every interaction has identical evidence text
- no console/error command output exists
- screenshots exist but no visual analysis exists
- expected behavior is unknown for most elements
- result counts do not match pending queue removals
