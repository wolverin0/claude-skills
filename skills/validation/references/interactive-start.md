# Interactive Start

Use this when backend, coverage, or auth cannot be inferred safely.

Ask at most three concise questions.

## Backend Question

Recommended: `agent-browser`

Options:

- `agent-browser`: fastest CLI default, JSON output, sessions, screenshots, console/errors.
- `playwright-cli`: official Playwright CLI, good for Playwright-heavy or cross-browser projects.
- `host MCP`: use available Claude/Codex/Playwright browser MCP tools.

Free-form is allowed for `browser-harness` or project-specific constraints.

## Coverage Question

Recommended: `standard`

Options:

- `smoke`: quick key route/flow validation.
- `standard`: all discovered routes/elements with 4 breakpoints.
- `exhaustive`: deeper forms, flows, CRUD-like operations, optional network/perf/a11y.

## Auth Question

Recommended depends on app:

- `none`: public app.
- `manual`: open browser and ask user to log in.
- `saved state`: load auth state/cookies from a file.
- `config`: use `validation.config.json` for headers, state file path, or test account instructions.

Never ask the user to paste secrets into the report or state file.
