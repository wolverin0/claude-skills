---
name: skillify
description: Turn a just-proven repeated workflow into a concise reusable skill after explicit user approval. Use when the user asks to save, codify, or reuse a completed workflow.
---

# Skillify

Codify a workflow only after it has worked. This is an explicit, approval-gated
skill authoring flow, not autonomous transcript mining.

## Use When

- A multi-step task finished green and the user says "skillify this", "save
  this as a skill", or similar.
- The same stable workflow has repeated enough times that a skill would reduce
  future mistakes.
- The user has approved creating or updating a specific skill.

## Do Not Use When

- The workflow is still experimental or unresolved.
- The result depended on luck, private context, or unrepeatable local state.
- A helper script or README section would be simpler than a skill.
- A similar skill already exists; propose updating it instead.

## Flow

1. Read the local `skill-creator` guidance before drafting.
2. Reconstruct the workflow spine:
   - user intent
   - required inputs
   - tool/file sequence
   - verification that proved it worked
   - failure modes discovered
3. Propose the slug, trigger description, scope, and whether the work updates
   an existing skill or creates a new one.
4. Show the full `SKILL.md` draft in chat and ask for explicit approval before
   writing.
5. Keep the skill concise:
   - frontmatter `name` and `description`
   - body under about 200 lines
   - long material in `references/`
   - deterministic repeated work in `scripts/`
   - reusable output files in `assets/`
6. Validate with:

```bash
python skills/skill-creator/scripts/quick_validate.py <skill-dir>
```

7. Report the created/changed paths and the validation result.

## Frontmatter Template

```yaml
---
name: <slug>
description: <when to use this skill, in one clear sentence>
---
```

Avoid nonportable frontmatter fields unless the target provider explicitly
supports them.

## Approval Rule

Each skill write needs its own explicit user approval immediately before the
write. A broad "keep going" does not approve future skills, because skills
auto-activate and can shape behavior across projects.

## Failure Modes

- No stable workflow: stop and ask the user to describe the target workflow.
- Existing skill collision: propose an update instead of overwriting.
- Draft exceeds 200 lines: move details into references before asking approval.
- Validation fails: fix the skill package before reporting it as ready.
