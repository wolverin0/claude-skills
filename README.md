# Claude Skills

Reusable agent skills, references, scripts, and assets for Claude Code, Codex,
and related CLI-based development workflows.

This repo is the canonical source for the maintained skill set. Install copies
into the active skill root for each provider, or symlink them while iterating.

**Last sync: 2026-08-24** — added `battle-test`, `visual-route-sweep`,
`vibe-to-prod`, `frontendgame`; refreshed `handoff` (v2), `validation`, and the
full `audit` bundle (21 skills).

## Catalog

### Ship & verify — prove it works before calling it done

| Skill | What it does |
|---|---|
| `battle-test` | Fail-closed end-to-end hardening cycle: static audit → exhaustive real-browser validation → semantic screenshot review → multi-role/security/visual-regression probes → isolated remediation → re-verification. `--quick` exists but can never emit a battle-tested verdict. |
| `validation` | Evidence-based browser validation: route/element/flow/API inventory, screenshots, console+network checks, resumable state, redaction, auditable HTML report. Modes: smoke / standard / exhaustive. |
| `visual-route-sweep` | Authenticated light/dark × desktop/tablet/mobile screenshots of every safe route, responsive+runtime failure detection, semantic review of every image — the visual slice of battle-test, standalone. |
| `vibe-to-prod` | Guided 13-layer production-readiness self-check for an AI-generated MVP: per-layer PASS/GAP scorecard (security, errors, logging, deploy, compliance…). Lighter than the audit bundle. |
| `deploy-verify` | Post-deploy verification workflow. |
| `security-review` | Focused security pass over pending changes. |

### Audit bundle — technical due diligence

Location: `skills/audit/` (21 skills). Full-repository due diligence: the
orchestrator, method setup, hard-stop checks, Tambon LLM-signature hunt,
blind-spot walk (B1-B19), 13 domain audits, decision handling, fix-prompt
generation, and the audit→remediate→rerun loop. Domains follow
enumeration-before-verdict.

Primary entry points:

- `audit-orchestrator`: full dual-layer audit (founder view + technical evidence).
- `audit-loop`: audit → roadmap → remediation → rerun → missed-finding patch loop.
- `audit-fix-generator`: remediation prompts for individual findings.

Install the children of `skills/audit/` into the provider skill root:

```bash
cp -r skills/audit/* ~/.claude/skills/
cp -r skills/audit/* ~/.codex/skills/
```

### Build — opinionated implementation skills

| Skill | What it does |
|---|---|
| `frontendgame` | Premium mobile-first product UI: design-system discipline, advanced UX patterns, motion engineering, screenshot-to-code, anti-generic-AI-look guardrails. References for interaction patterns, motion, stack recipes. |
| `mcp-builder` | Build MCP servers correctly. |
| `tdd-workflow` | Red-first test-driven flow. |
| `debug-resolve` | Systematic debugging to resolution. |
| `supabase-debug` | Supabase-specific diagnosis. |
| `feature-validation` | Validate a feature against its spec. |
| `mercadopago-integration` | MercadoPago OAuth/checkout/webhooks for Supabase/React SaaS, with production pitfalls from 7+ real Argentine projects. Assets: edge function, hook, migration SQL. |
| `checklist-design-app-audit` | Audits against a validated Checklist Design snapshot: 703 auditable items, evidence-aware scoring, deterministic search scripts. |

### Session & project workflow

| Skill | What it does |
|---|---|
| `handoff` | Structured session handoff (v2: pre-degradation contract — write BEFORE compaction, greppable header, corr id). The next session starts from the file, not from vibes. |
| `skillify` | Turn a proven repeated workflow into a reusable skill. |
| `skill-creator` | Create and validate skills locally (progressive disclosure). |
| `project-setup` | Generate/refresh AGENTS.md / CLAUDE.md from the real codebase. |
| `project-curate` | Hand-tune a project's `.claude/` directory. |
| `project-doctor` | Read-only orchestration health check. |

### Collaboration

| Skill | What it does |
|---|---|
| `debate` | Three-way Claude / Gemini / Codex debate with rounds, synthesis, session persistence and a web viewer. |

## Repository Layout

```text
skills/
  audit/                      21-skill due diligence bundle (see above)
  battle-test/                Fail-closed e2e hardening cycle
  checklist-design-app-audit/ Checklist Design evidence audits
  debate/                     Multi-provider debate workflow
  debug-resolve/              Systematic debugging
  deploy-verify/              Post-deploy verification
  feature-validation/         Feature-vs-spec validation
  frontendgame/               Premium mobile-first UI engineering
  handoff/                    Structured session handoffs (v2)
  mcp-builder/                MCP server construction
  mercadopago-integration/    MercadoPago OAuth/payment integration
  project-curate/             .claude/ curation workflow
  project-doctor/             Read-only orchestration health check
  project-setup/              AGENTS.md / CLAUDE.md setup workflow
  security-review/            Security pass over pending changes
  skill-creator/              Skill creation and validation tools
  skillify/                   Workflow → reusable skill
  supabase-debug/             Supabase diagnosis
  tdd-workflow/               Red-first TDD flow
  validation/                 Evidence-based browser validation
  vibe-to-prod/               13-layer production-readiness self-check
  visual-route-sweep/         Visual route sweep with semantic review
tools/                        Supporting docs and legacy helpers
tests/                        Tests for repo tooling
```

Reference docs at `skills/` root: `backend-patterns.md`, `frontend-patterns.md`,
`coding-standards.md`, `clickhouse-io.md`, `project-guidelines-example.md`,
`AUTO-HEALING-INTEGRATION-GUIDE.md`.

## Quick starts

```bash
# full hardening cycle on the current project
/battle-test

# browser validation
/validate http://localhost:3000
/validate --backend playwright-local --mode standard http://localhost:5173
/validate --resume

# production-readiness self-check
/vibe-to-prod

# full due diligence audit
/audit

# three-way debate
/debate Should we use Redis or in-memory cache for sessions?
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
repo into each provider's skill root (`~/.claude/skills/`, `~/.codex/skills/`).

```bash
# ship & verify set
cp -r skills/battle-test skills/validation skills/visual-route-sweep skills/vibe-to-prod ~/.claude/skills/

# audit bundle (installs as 21 sibling skills)
cp -r skills/audit/* ~/.claude/skills/

# workflow set
cp -r skills/handoff skills/skillify skills/project-setup skills/project-curate skills/project-doctor ~/.claude/skills/

# build set
cp -r skills/frontendgame skills/mercadopago-integration ~/.claude/skills/
```

Symlink while iterating:

```bash
ln -s "$(pwd)/skills/validation" ~/.claude/skills/validation
```

## Verification

Run focused validation after edits:

```bash
python skills/skill-creator/scripts/quick_validate.py skills/validation
git diff --check
```

Compare repo skills against installed provider copies:

```bash
python skills/skill-creator/scripts/compare_installed_skills.py --target all
python skills/skill-creator/scripts/compare_installed_skills.py --target claude --skill validation
```

To overlay repo copies into a provider skill root, use `--sync`. Existing
installed copies are backed up under `_backup_sync/` first.

## Notes

- Do not commit secrets, `.env` files, session transcripts, or private
  provider state. Personal paths are genericized (`~`, `<projects-root>`)
  before every sync.
- Prefer small skill patches over rewrites.
- Keep provider-specific behavioral notes in the relevant skill rather than in
  global instructions.
