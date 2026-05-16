# Adapter: agent-browser

Use this adapter for the default validation backend.

## Availability

Check:

```bash
agent-browser --version
agent-browser doctor --offline --quick
```

If missing, tell the user:

```bash
npm install -g agent-browser
agent-browser install
```

## Session

Use a project-specific session name:

```bash
agent-browser --session validation open {appUrl}
```

Prefer JSON for machine-readable commands:

```bash
agent-browser --session validation snapshot -i --json
agent-browser --session validation console --json
agent-browser --session validation errors --json
```

## Command Map

| Operation | Command |
| --- | --- |
| Navigate/open | `agent-browser --session validation open {url}` |
| Wait load | `agent-browser --session validation wait --load networkidle` |
| Snapshot interactive | `agent-browser --session validation snapshot -i --json` |
| Snapshot full | `agent-browser --session validation snapshot --json` |
| Click | `agent-browser --session validation click @eN` |
| Fill | `agent-browser --session validation fill @eN "{value}"` |
| Type slowly | `agent-browser --session validation type @eN "{value}"` |
| Key | `agent-browser --session validation press Enter` |
| Viewport | `agent-browser --session validation set viewport {w} {h}` |
| Screenshot | `agent-browser --session validation screenshot {path}` |
| Annotated screenshot | `agent-browser --session validation screenshot --annotate {path}` |
| Console | `agent-browser --session validation console --json` |
| Page errors | `agent-browser --session validation errors --json` |
| Network requests | `agent-browser --session validation network requests --json` |
| Save auth state | `agent-browser --session validation state save {path}` |
| Load auth state | `agent-browser --session validation --state {path} open {url}` |
| Video start | `agent-browser --session validation record start {path}` |
| Video stop | `agent-browser --session validation record stop` |

Refs are stale after page changes. Always re-run `snapshot -i --json` after navigation, click, submit, modal open/close, or dynamic rerender.

## Recommended Patterns

Use `snapshot -i --json` to discover refs and `snapshot --json` when page text/content is the evidence.

Use `errors --json` and `console --json`; console messages alone can miss uncaught page errors.

Use `screenshot --annotate` when the report needs a visible map of clicked elements.

For React apps, optional:

```bash
agent-browser --session validation open --enable react-devtools {appUrl}
agent-browser --session validation vitals {appUrl} --json
```

## Pass Evidence

For each route/element/flow result, state should include:

```json
{
  "backend": "agent-browser",
  "snapshot": "test-manifest/evidence/...",
  "screenshots": ["test-manifest/evidence/..."],
  "console": [],
  "errors": [],
  "observed": "specific observed result"
}
```
