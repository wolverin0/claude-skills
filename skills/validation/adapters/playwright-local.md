# Adapter: project-local Playwright

Use this adapter when `agent-browser` is unavailable but the target project has `playwright` or `@playwright/test` installed. This is the most reliable fallback because it runs deterministic Node scripts from the project root and can write structured state, evidence, and reports directly.

## Availability

Check in the target project:

```bash
npx --no-install playwright --version
node -e "require.resolve('playwright')"
```

If either command works, this adapter can run.

## Runner

Preferred smoke command from the target project root:

```bash
node {skillDir}/scripts/run-smoke-playwright.js --url {appUrl}
```

For authenticated apps, pass credentials through environment variables, not command-line arguments:

```bash
VALIDATION_EMAIL="user@example.com" VALIDATION_PASSWORD="..." node {skillDir}/scripts/run-smoke-playwright.js --url {appUrl}
```

Never write credentials into state, report, snapshots, or logs. Run `scripts/redact-artifacts.js` after validation when credentials or other secrets were used.

## Capabilities

- Creates `test-manifest/` directories.
- Captures login/pre-auth evidence.
- Logs in when `VALIDATION_EMAIL` and `VALIDATION_PASSWORD` are present.
- Tests smoke routes discovered from visible navigation links.
- Captures desktop and mobile screenshots.
- Records snapshots as JSON.
- Groups and classifies console/API errors.
- Distinguishes app failures from runner/selector failures.
- Generates `validation-state.json` and an HTML report.

## Result Categories

| Status | Meaning |
| --- | --- |
| `pass` | App behavior was verified with evidence. |
| `fail` | Verified app/user-facing failure. |
| `warning` | Non-blocking issue or ignored/low-severity browser noise. |
| `skip` | Not tested for a documented reason. |
| `runner-fail` | The validation runner failed to execute a check; do not count as app failure. |

## Notes

This adapter is currently best for `smoke` mode. Use it to establish a reliable baseline, then expand to standard/exhaustive coverage after app-level console/API failures are fixed.
