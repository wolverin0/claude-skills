# Adapter: Chrome MCP

Use this adapter for Claude-in-Chrome, Codex-in-Chrome, or similar host browser MCP tools.

## Command Map

Tool names vary by host. Map the available tools to this interface:

| Operation | Common Chrome MCP operation |
| --- | --- |
| Navigate | `navigate url={url}` |
| Snapshot/page state | `read_page` or accessibility snapshot |
| Click | `click ref={ref}` |
| Fill | `form_input ref={ref} value={value}` |
| Viewport | `resize_window width={w} height={h}` |
| Screenshot | `computer action="screenshot"` or screenshot tool |
| Console | `read_console_messages` |

## Rules

- MCP screenshots may be visible to the agent but not automatically saved. Record analysis in state and save/copy a file when the host supports it.
- Re-read the page after every action before using refs again.
- Treat browser-visible screenshots as evidence only if the state records specific visual findings.
- If the host tool cannot save artifacts, record textual evidence and note the limitation in the report.
