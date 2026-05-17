---
name: project-curate
description: Curate a project's .claude directory with scoped rules, preserved user content, and grep-verified references. Use when project agent setup is bloated, stale, or missing stack-specific rules.
metadata:
  argument-hint: "[--dry-run] [--force] [--skip-verifier] [--no-graphify]"
  trigger: /project-curate
---

# Project Curate

Hand-tune a project's `.claude/` directory. This skill complements
`project-setup`: setup owns `AGENTS.md` and `CLAUDE.md`; curate owns selected
rules, curation logs, and reversible cleanup of noisy local agent assets.

## Non-Negotiables

- Preserve hand-authored files by default.
- Archive noisy `.claude/` content; do not delete it.
- Copy only rules that match the detected stack.
- Generate at most 3-4 project-specific rules in one pass.
- Grep-verify every file path, symbol, enum value, command, and backticked
  identifier before presenting generated rules as accurate.
- Ask before copying external skills or agents.
- Do not run multiple curations against the same repo simultaneously.

## Fast Flow

1. Inventory the repo: manifests, existing `.claude/`, `AGENTS.md`,
   `CLAUDE.md`, git status, and stack.
2. Query MemoryMaster for project decisions, constraints, and gotchas.
3. Check available intelligence layers: GitNexus, graphify, wiki, monitoring.
   Build or refresh only when the referenced tool is available and the action
   is safe for the repo.
4. Produce a proposal:
   - external rules to copy
   - project-specific rules to generate
   - noisy local assets to archive
   - files preserved untouched
5. Stop for approval unless `--dry-run` or an explicit force mode was requested.
6. Execute the approved proposal with backups and a curation log.
7. Verify generated references mechanically with `rg`, `Test-Path`, or the
   project equivalent.
8. Report branch, files changed, archive location, verifier findings, and any
   rule-driven improvement suggestions that were not applied.

## References

Load `references/full-process.md` only when the fast flow is not enough. It
contains the original pilot-derived details, verifier-pane fallback notes, and
example proposal formats.

## Output

```text
== Curation complete: <project> ==
Changed:
  - <paths>
Archived:
  - <paths or none>
Verified:
  - <checks>
Open decisions:
  - <items needing user approval>
```
