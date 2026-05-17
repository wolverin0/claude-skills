# Claude Skills

Reusable agent skills, references, scripts, and assets for Claude Code, Codex,
and related CLI-based development workflows.

This repo is the canonical source for the user's maintained skills. Install
copies into the active skill root for each provider, or symlink them while
iterating.

## Repository Layout

```text
skills/
  audit/                     Multi-skill technical due diligence bundle
  debate/                    Multi-provider debate workflow
  handoff/                   Structured session handoffs
  mercadopago-integration/   MercadoPago OAuth/payment integration
  project-curate/            Project .claude/ curation workflow
  project-doctor/            Read-only orchestration health check
  project-setup/             AGENTS.md / CLAUDE.md setup workflow
  skill-creator/             Local skill creation and validation tools
  skillify/                  Turn a proven workflow into a reusable skill
  validation/                Evidence-based browser validation
tools/                       Supporting docs and legacy helpers
tests/                       Tests for repo tooling
```

## Core Skills

### Validation

Location: `skills/validation/`

Evidence-based browser validation for implemented web apps and UI workflows.
It supports route discovery, screenshots, console/error checks, critical-flow
testing, resumable state, redaction, and HTML reports.

```bash
/validate http://localhost:3000
/validate --backend agent-browser --mode standard http://localhost:5173
/validate --backend playwright-local --config validation.config.json --mode standard http://localhost:5173
/validate --fresh
/validate --resume
```

### Audit Bundle

Location: `skills/audit/`

Technical due diligence pipeline for full repository audits. The bundle
includes the orchestrator, method setup, hard-stop checks, Tambon-signature
hunt, blind-spot walk, 13 domain audits, decision handling, fix-prompt
generation, and the audit-loop skill.

Install the children of `skills/audit/` into the provider skill root:

```bash
cp -r skills/audit/* ~/.codex/skills/
cp -r skills/audit/* ~/.claude/skills/
```

Primary entry points:

- `audit-orchestrator`: full due diligence audit.
- `audit-loop`: audit, roadmap, remediation, rerun, and missed-finding skill
  patch loop.
- `audit-fix-generator`: create remediation prompts for individual findings.

### Project Workflow Skills

Location: `skills/project-setup/`, `skills/project-curate/`,
`skills/project-doctor/`, `skills/handoff/`, `skills/skillify/`

- `project-setup`: generate or refresh project agent instructions from the
  real codebase.
- `project-curate`: hand-tune a project's `.claude/` directory using existing
  project intelligence and selected rules.
- `project-doctor`: read-only audit of orchestration scaffolding.
- `handoff`: write a structured handoff for clean session transfer.
- `skillify`: convert a successful repeated workflow into a reusable skill.

### MercadoPago Integration

Location: `skills/mercadopago-integration/`

Guidance and reusable assets for MercadoPago OAuth and checkout integration in
Supabase/React-style SaaS apps. Includes:

- `assets/supabase-edge-function.ts`
- `assets/use-mercadopago.tsx`
- `assets/migration.sql`
- `references/troubleshooting.md`

### Debate

Location: `skills/debate/`

Three-way debate workflow between Claude, Gemini CLI, and OpenAI Codex CLI,
with session persistence, multiple debate styles, synthesis, and a web viewer.

```bash
/debate Should we use Redis or in-memory cache for sessions?
/debate -r 3 -d thorough Review our authentication implementation
```

## Skill Development

Use `skills/skill-creator/` before creating or changing skills. The local
guidance follows progressive disclosure:

1. Keep `SKILL.md` concise.
2. Move long reference material into `references/`.
3. Put deterministic repeated operations in `scripts/`.
4. Put reusable output files in `assets/`.

Validate changed skills with:

```bash
python skills/skill-creator/scripts/quick_validate.py skills/<skill-name>
```

Package a distributable skill with:

```bash
python skills/skill-creator/scripts/package_skill.py skills/<skill-name>
```

## Installation

Install only the skills you actually want active. Copy or symlink from this
repo into each provider's skill root.

Claude Code:

```bash
cp -r skills/validation ~/.claude/skills/
cp -r skills/handoff skills/skillify ~/.claude/skills/
cp -r skills/project-setup skills/project-curate skills/project-doctor ~/.claude/skills/
cp -r skills/mercadopago-integration ~/.claude/skills/
cp -r skills/audit/* ~/.claude/skills/
```

Codex:

```bash
cp -r skills/validation ~/.codex/skills/
cp -r skills/handoff skills/skillify ~/.codex/skills/
cp -r skills/project-setup skills/project-curate skills/project-doctor ~/.codex/skills/
cp -r skills/mercadopago-integration ~/.codex/skills/
cp -r skills/audit/* ~/.codex/skills/
```

Symlink while iterating:

```bash
ln -s "$(pwd)/skills/validation" ~/.claude/skills/validation
ln -s "$(pwd)/skills/validation" ~/.codex/skills/validation
```

## Verification

Run focused validation after edits:

```bash
python skills/skill-creator/scripts/quick_validate.py skills/validation
python skills/skill-creator/scripts/quick_validate.py skills/mercadopago-integration
git diff --check
```

Compare repo skills against installed provider copies:

```bash
python skills/skill-creator/scripts/compare_installed_skills.py --target all
python skills/skill-creator/scripts/compare_installed_skills.py --target claude --skill validation
```

To overlay repo copies into a provider skill root, use `--sync`. Existing
installed copies are backed up under `_backup_sync/` first.

This repo is mostly Markdown plus small helper scripts, so there is no single
global build command.

## Notes

- Do not commit secrets, `.env` files, session transcripts, or private
  provider state.
- Prefer small skill patches over rewrites.
- Keep provider-specific behavioral notes in the relevant skill rather than in
  global instructions.
