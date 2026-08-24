---
name: project-doctor
description: Read-only audit for stale or broken project orchestration files, agent instructions, monitoring config, graphify output, and referenced skills.
---

# project-doctor

Run a health audit on the current project's orchestration scaffolding. Read-only.

## When to use

- Right after a `/monitoring-setup` rollout to confirm the generated `monitoring.md` references real files
- When inheriting a project from a peer pane and you want a sanity check
- Periodically (monthly) to catch drift - moved scripts, deleted skills, expired Telegram chat IDs
- When `omniclaude` complains it can't find a script the frontmatter promised existed

## How to invoke

The user types `/project-doctor` from any project root. You then:

1. Run the checker:

```bash
node "$HOME/.claude/skills/project-doctor/check.js"
```

(On Windows in bash: same command - `$HOME` resolves to `/c/Users/<you>`.)

2. The script prints a structured table to stdout: one row per check with verdict (`PASS`/`WARN`/`FAIL`/`SKIP`) and a remediation hint.

3. Read the output. Summarise to the user:
   - All `PASS`: "All checks green - project orchestration is healthy."
   - Any `FAIL`: list the failing checks + remediation. Offer to fix the ones you can fix in-session (e.g., update placeholder Telegram chat ID, regenerate stale graphify report, run `/monitoring-setup` if `monitoring.md` is missing).
   - `WARN` only: list them but don't insist - the user decides.

## Checks performed

| Check | Severity | What it validates |
|---|---|---|
| `monitoring.md` exists | FAIL if missing | File present in project root |
| `monitoring.md` parses | FAIL on bad YAML | Frontmatter is valid YAML |
| `watchdog:` reference | WARN if path-shaped and missing | If frontmatter `watchdog:` looks like a script path, file must exist |
| `roadmap_file:` resolves | WARN | Referenced file exists |
| `state_checkpoint:` resolves | WARN | Referenced path exists (file or dir) |
| Telegram chat ID is real | WARN | Not equal to `CHANGEME_CHAT_ID` placeholder |
| Skills referenced exist | WARN | Each entry in frontmatter `skills:` resolves to `~/.claude/skills/<name>/SKILL.md` |
| `AGENTS.md` exists | WARN | File present in project root |
| `CLAUDE.md` exists | WARN | File present in project root |
| `graphify-out/GRAPH_REPORT.md` fresh | WARN if older than 30d | Mtime check |
| `.claude/settings.json` parses | FAIL on parse error | Valid JSON if file exists |
| Worktree status | INFO | Counts uncommitted files (never fails) |

## Remediation hints (offer when found)

- Missing `monitoring.md` -> `/monitoring-setup`
- Stale graphify report (>30d) -> `/graphify` to regenerate
- Placeholder `CHANGEME_CHAT_ID` -> ask user for real Telegram chat ID, then Edit the frontmatter
- Missing referenced skill -> tell the user the skill name and ask if it should be removed from the list or installed

## Out of scope

Do not auto-fix anything that requires a decision (placeholder values, missing skills). Report and wait.
