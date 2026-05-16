# Adapter: browser-harness

Use this adapter only when a thin CDP connection to the user's real Chrome is preferred, or when normal CLI/MCP backends cannot handle the target app.

## Availability

Check:

```bash
browser-harness <<'PY'
print("ok")
PY
```

For setup issues, read the upstream `install.md`.

## Pattern

Always use heredoc form:

```bash
browser-harness <<'PY'
new_tab("{url}")
wait_for_load()
print(page_info())
PY
```

## Command Map

Browser Harness exposes Python helpers rather than fixed subcommands. Use:

| Operation | Helper pattern |
| --- | --- |
| New tab | `new_tab(url)` |
| Wait | `wait_for_load()` |
| Page info | `page_info()` |
| Screenshot | `capture_screenshot(path)` if available, otherwise helper-specific screenshot |
| Click | `click_at_xy(x, y)` or custom helper |
| JS | `js("...")` |
| CDP | `cdp("Domain.method", params)` |

## Rules

- Use screenshots first to understand and verify state.
- Prefer visible coordinate clicks for cross-origin iframe/shadow DOM problems.
- Add task-specific helpers only when the interaction is not handled by existing helpers.
- Do not store site-specific secrets or brittle pixel coordinates in reusable references.
- This adapter is less deterministic than `agent-browser` or `playwright-cli`; document backend limitations in state.
