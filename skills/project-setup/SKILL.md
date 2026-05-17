---
name: project-setup
description: Generate or refresh project AGENTS.md, CLAUDE.md, and optional GEMINI.md from real codebase evidence. Use when agent instructions are missing, stale, or need provider alignment.
metadata:
  argument-hint: "[--force] [--dry-run] [--rollback] [--codex] [--no-memorymaster]"
---

# Project Setup

Create or refresh project instruction files from verified repository facts.
This skill curates existing content; it does not blindly replace hand-authored
instructions.

## Safety Rules

- Read existing `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.claude/rules/`
  before writing.
- Preserve unmanaged content and GitNexus-managed blocks.
- Do not run destructive commands, migrations, seeders, live tests, or network
  calls as discovery.
- Use safe probes only: manifest reads, `--help`, `--version`,
  `pytest --co`, `cargo test --no-run`, `go test -list`, or equivalent
  non-mutating checks.
- Create physical backups before writing.
- Never run this skill concurrently from multiple agents against the same repo.
- Treat rollback as an explicit user-requested operation.

## Modes

| Mode | Behavior |
| --- | --- |
| default | Merge with existing content and refresh stale managed sections. |
| `--dry-run` | Explore and show proposed diffs; write nothing. |
| `--force` | Regenerate managed sections while preserving unmanaged content. |
| `--codex` | Include Codex-compatible project instructions where appropriate. |
| `--no-memorymaster` | Skip MemoryMaster context. |
| `--rollback` | Restore from setup-created backups only after user confirmation. |

## Fast Flow

1. Detect whether a `<!-- project-setup:YYYY-MM-DD -->` marker already exists.
2. Back up existing instruction files into `docs/backups/`.
3. Read existing instructions fully and classify content:
   - stack, commands, tests, and verification as managed
   - architecture, boundaries, deployment, security, and team notes as
     preserved unmanaged content unless clearly stale
4. Explore manifests, top-level structure, test/lint/build config, CI, and
   safe command availability.
5. Query MemoryMaster unless update mode or `--no-memorymaster` is active.
6. Derive project scope once, then preserve it on later reruns.
7. Write or preview:
   - `AGENTS.md` as canonical cross-provider instructions
   - `CLAUDE.md` as Claude-specific pointer to `AGENTS.md`
   - optional `GEMINI.md` / `.gemini/settings.json`
   - optional scoped `.claude/rules/` only when evidence supports them
8. Verify generated files exist, managed markers are present, and no preserved
   content was silently dropped.

## References

Load `references/full-process.md` when you need the full legacy template,
section mapping table, example generated blocks, or intelligence-layer details.

## Output

```text
PROJECT SETUP SUMMARY
Mode: <default|dry-run|force|rollback>
Files changed: <paths>
Backups: <paths>
Verified facts:
  - <commands/manifests checked>
Skipped:
  - <unsafe or unavailable checks>
Open questions:
  - <none or questions>
```
