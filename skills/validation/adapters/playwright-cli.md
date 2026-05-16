# Adapter: playwright-cli

Use this adapter when the user wants the official Playwright CLI path, cross-browser coverage, or the project already uses Playwright heavily.

## Availability

Check:

```bash
playwright-cli --help
```

If missing, try local first:

```bash
npx --no-install playwright-cli --help
```

If unavailable:

```bash
npm install -g @playwright/cli@latest
```

## Session

Use a named session:

```bash
playwright-cli -s=validation open {appUrl}
```

Use `--raw` when writing output to files.

Create output directories before any `--filename` command. `playwright-cli` does not create missing nested folders:

```bash
mkdir -p test-manifest/evidence/routes test-manifest/evidence/elements test-manifest/evidence/flows test-manifest/reports
```

Run commands for the same `-s=validation` session sequentially. Do not execute viewport, screenshot, navigation, or interaction commands in parallel against one session; they race and can attach the wrong viewport/state to the wrong artifact.

## Command Map

| Operation | Command |
| --- | --- |
| Open | `playwright-cli -s=validation open {url}` |
| Navigate | `playwright-cli -s=validation goto {url}` |
| Snapshot | `playwright-cli -s=validation snapshot --filename={path}` |
| Snapshot depth | `playwright-cli -s=validation snapshot --depth=4 --filename={path}` |
| Click | `playwright-cli -s=validation click eN` |
| Fill | `playwright-cli -s=validation fill eN "{value}"` |
| Type | `playwright-cli -s=validation type "{value}"` |
| Key | `playwright-cli -s=validation press Enter` |
| Viewport | `playwright-cli -s=validation resize {w} {h}` |
| Screenshot | `playwright-cli -s=validation screenshot --filename={path}` |
| Console | `playwright-cli -s=validation console` |
| Network | `playwright-cli -s=validation requests` |
| Eval | `playwright-cli -s=validation --raw eval "{js}"` |
| Save auth | `playwright-cli -s=validation state-save {path}` |
| Load auth | `playwright-cli -s=validation state-load {path}` |
| Trace start | `playwright-cli -s=validation tracing-start` |
| Trace stop | `playwright-cli -s=validation tracing-stop` |

Refs use `eN` from the latest snapshot. They become stale after page changes.

If a ref resolves to the wrong node or a repeated label is ambiguous, switch to `run-code` with role/label locators or a small local Playwright runner. Record that as an adapter limitation, not as an app failure, unless the same behavior is verified through a user-visible interaction.

## Notes

Playwright CLI is token-efficient because the agent can write snapshots to files and read only what it needs. Prefer it over Playwright MCP when context pressure is the main risk.

Use browser selection when needed:

```bash
playwright-cli -s=validation open --browser=firefox {url}
playwright-cli -s=validation open --browser=webkit {url}
playwright-cli -s=validation open --browser=chrome {url}
```
