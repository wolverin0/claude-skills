---
name: feature-validation
description: Deprecated alias for validation. Use when older prompts ask for feature-validation; route the work to the validation skill instead of running the legacy transcript-heavy workflow.
---

# Feature Validation

This skill is deprecated. Use `validation` for evidence-based browser
validation of implemented web apps, UI features, and user workflows.

## Route

1. Load `../validation/SKILL.md`.
2. Run the validation workflow there.
3. Prefer `agent-browser` by default, with `playwright-local` as the first
   fallback when the target project already has Playwright installed.
4. Write evidence under the target project's `test-manifest/` directory, not
   this repo.

## Why

The legacy workflow required reading Claude transcript files from
`~/.claude/projects/*.jsonl` and bundled retrospective/auto-healing behavior
into normal validation. That made it provider-specific, fragile, and expensive
in context. The current `validation` skill is CLI-agnostic and keeps state,
evidence, adapters, and reporting explicit.

## Legacy Reference

The old body is kept only for archaeology:

- `references/legacy-feature-validation.md`

Do not copy its transcript-reading or auto-healing phases into new skills.
