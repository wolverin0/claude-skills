# Adapter: Playwright MCP

Use this adapter when Playwright MCP tools are already available and rich browser introspection is more useful than CLI token efficiency.

## Command Map

Tool names vary by host. Map the available tools to this interface:

| Operation | Typical MCP tool |
| --- | --- |
| Navigate | `browser_navigate` |
| Wait | `browser_wait_for` |
| Snapshot | `browser_snapshot` |
| Click | `browser_click` |
| Fill/type | `browser_type` or form input tool |
| Key | `browser_press_key` |
| Viewport | `browser_resize` |
| Screenshot | `browser_take_screenshot` |
| Console | `browser_console_messages` |

## Rules

- Save screenshots under `test-manifest/evidence/` when the tool allows filenames.
- If the MCP writes screenshots to an internal folder, copy/reference the actual path in state.
- Read/analyze screenshots; do not treat successful capture as validation.
- Snapshots can be large. Use scoped snapshots or route-by-route state writes to control context.
