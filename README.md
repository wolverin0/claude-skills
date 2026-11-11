# Claude Skills

Reusable agent skills, references, scripts, and assets for Claude Code, Codex,
and related CLI-based development workflows.

This repo is the canonical source for the maintained skill set. Install copies
into the active skill root for each provider, or symlink them while iterating.

**Last sync: 2026-11-11** — added `quality-loop`, `auditar-ux-producto` and the
`commands/` folder (`/audit`, `/audit-remediate`); `battle-test` gained the
`--ux` mode; the audit reference catalogs now cover H1-H11 and B1-B19; the
`validation` invocation name is `/validation`. Previous sync: 2026-08-24.

## Catalog

### Ship & verify — prove it works before calling it done

| Skill | What it does |
|---|---|
| `battle-test` | Fail-closed end-to-end hardening cycle: static audit → exhaustive real-browser validation → semantic screenshot review → multi-role/security/visual-regression probes → isolated remediation → re-verification. `--quick` exists but can never emit a battle-tested verdict. `--ux` curates only UX/UI with its own verdict (see [battle-test `--ux` mode](#battle-test---ux-mode)). |
| `quality-loop` | Self-verifying hardening and quality-sweep loop in an isolated git worktree: works an AUTO list in a fixed order (security → prod-readiness → deps/CVEs → tests/coverage → dead-code → perf → a11y → ux → docs), gates every commit on lint/types/tests/build, and queues operator-only items as GATED. Standalone it pushes verified batches to `main`; `--staged` commits only and leaves the push to the parent (this is how `battle-test` uses it). |
| `auditar-ux-producto` | Task-centered UX audit (Spanish-language skill): user journeys, duplicated actions, avoidable steps, container choice (modal, side panel, dedicated page), forms, error handling and notification policy for operational products (ERP, CRM, dashboards). Prepares before/after visual comparisons with selectable recommendations and keeps interaction decisions in `DESIGN.md`. |
| `validation` | Evidence-based browser validation: route/element/flow/API inventory, screenshots, console+network checks, resumable state, redaction, auditable HTML report. Modes: smoke / standard / exhaustive. |
| `visual-route-sweep` | Authenticated light/dark × desktop/tablet/mobile screenshots of every safe route, responsive+runtime failure detection, semantic review of every image — the visual slice of battle-test, standalone. |
| `vibe-to-prod` | Guided 13-layer production-readiness self-check for an AI-generated MVP: per-layer PASS/GAP scorecard (security, errors, logging, deploy, compliance…). Lighter than the audit bundle. |
| `deploy-verify` | Post-deploy verification workflow. |
| `security-review` | Focused security pass over pending changes. |

### Audit bundle — technical due diligence

Location: `skills/audit/` (21 skills) plus two slash commands in `commands/`.
Full-repository due diligence: the orchestrator, method setup, hard-stop
checks (H1-H11), Tambon LLM-signature hunt, blind-spot walk (B1-B19), 13 domain
audits, decision handling, fix-prompt generation, and the
audit→remediate→rerun loop. Domains follow enumeration-before-verdict. The
seven shared catalogs in `skills/audit/references/` are `audit-rules.md`,
`audit-hard-stops.md` (H1-H11), `audit-blind-spots.md` (B1-B19),
`audit-tambon-signatures.md`, `audit-report-format.md`,
`audit-triage-rubric.md` and `domain-audit-contract.md`.

The 21 children of `skills/audit/`:

- Pipeline: `audit-orchestrator`, `audit-method`, `audit-hard-stops`,
  `audit-tambon-hunt`, `audit-blind-spots`, `audit-decisions`,
  `audit-fix-generator`, `audit-loop`.
- Domains: `audit-domain-01-security`, `audit-domain-02-architecture`,
  `audit-domain-03-database`, `audit-domain-04-devops`,
  `audit-domain-05-performance`, `audit-domain-06-ux-a11y`,
  `audit-domain-07-reliability`, `audit-domain-08-compliance`,
  `audit-domain-09-maintainability`, `audit-domain-10-cost`,
  `audit-domain-11-demo-vs-prod`, `audit-domain-12-missing`,
  `audit-domain-13-code-integrity`.

Primary entry points:

- `audit-orchestrator`: full dual-layer audit (founder view + technical evidence).
- `audit-loop`: audit → roadmap → remediation → rerun → missed-finding patch loop.
- `audit-fix-generator`: remediation prompts for individual findings.

Slash commands (`commands/`):

| Command | What it does |
|---|---|
| `/audit` | Runs the `audit-orchestrator` skill and writes one `audit-report.md`. Read-only: it never modifies source. Args: `--scope=<path>`, `--priority-domains=<csv of 1-13>`, `--resume-from=<N>`. |
| `/audit-remediate` | Launches the `audit-remediate` workflow: audit, fix on a dedicated branch with per-fix verification, re-audit until green or out of budget, then open a PR. Never merges and never touches `main`. Args: `--scope=<path>`, `--max-rounds=<N>` (default 4). Needs the workflow script listed under [What this repo does not include](#what-this-repo-does-not-include). |

Install the 21 `audit-*` children of `skills/audit/` into the provider skill
root, and the shared catalogs in `skills/audit/references/` into the context
directory the skills read from (`@.claude/context/` in the project, or
`~/.codex/context/` for Codex):

```bash
cp -r skills/audit/audit-* ~/.claude/skills/
cp -r skills/audit/audit-* ~/.codex/skills/
mkdir -p .claude/context ~/.codex/context
cp skills/audit/references/*.md .claude/context/
cp skills/audit/references/*.md ~/.codex/context/
```

`production-readiness-playbook.md`, cited by the domain skills and
`vibe-to-prod`, is not shipped in this repo; those citations are optional depth.
Install the two commands with `cp commands/*.md ~/.claude/commands/`.

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

## battle-test `--ux` mode

`/battle-test --ux` curates only the UX/UI of a project and ends with its own
verdict, never `BATTLE-TESTED`. What it does, per `skills/battle-test/SKILL.md`
and its `references/`:

- **Scope:** UX/UI only. Findings that are not UX/UI are listed at the end of the
  report, not fixed. Security, database, dependencies, performance and dead code
  are not reviewed in this mode.
- **UX audit:** `auditar-ux-producto` runs in place of `audit-orchestrator`
  (no `/audit`), producing a table of changes `C01..Cn`.
- **One pause:** the operator chooses which changes go; the rest is queued as
  GATED.
- **Fixes in one worktree:** `quality-loop --staged --from-tracks` works the
  chosen `ux` items in the same worktree as the baseline, committing to the loop
  branch. It never integrates to `main`, and it refuses `--push-main`, `--quick`
  and `--audit-only`; combine it only with `--resume`.
- **Browser verification:** full build/test gate, full visual compare, a
  `validation --mode smoke` on the touched routes, and each acceptance criterion
  replayed in a real browser by the main session (not by the executor that made
  the fix), plus `DESIGN.md` reflecting only what was verified.
- **Verdict:** `UX SCOPE VERIFIED` when every gate row holds, otherwise
  `UX SCOPE FAILED`; missing, stale or blocked evidence counts as a failure. The
  gate is in `skills/battle-test/references/gates.md` ("UX profile gate").

**Status: written and reviewed as text only. `--ux` has not yet been run end to
end on a project.**

## Optional third-party skills

`battle-test`, `auditar-ux-producto` and some audit domain skills name these
design skills as optional helpers. They are not stages, they are not copied into
this repo, and an item may use one only if it is installed in the environment.

| Skill | Where the tree names it | What the tree says it is for |
|---|---|---|
| `impeccable` ([pbakaus/impeccable](https://github.com/pbakaus/impeccable)) | `battle-test`, `auditar-ux-producto`, `audit-domain-05-performance`, `audit-domain-06-ux-a11y` | Design operations such as `critique`, `distill`, `shape`, `harden`, `typeset`, `adapt`, `optimize`. |
| `ui-ux-pro-max` ([nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)) | `battle-test`, `auditar-ux-producto` | Lookup library for form, table, accessibility and component-state patterns. |
| `emil-design-eng` ([emilkowalski/skills](https://github.com/emilkowalski/skills)) | `battle-test`, `auditar-ux-producto`, `audit-domain-06-ux-a11y` | Touch feedback, micro-interactions and transitions. |
| `taste-skill` ([Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)) | `battle-test`, `auditar-ux-producto` | Aesthetic direction, typography and composition. |

The links point to the repositories cited in
`skills/auditar-ux-producto/references/fuentes.md`; this README makes no claim
about their licenses.

## What this repo does not include

Pieces that the audit skills and commands name but that live outside this
repository. Install them from elsewhere, or treat the features that depend on
them as unavailable.

| Missing piece | Named in | Role according to that file |
|---|---|---|
| Agents `audit-runner` and `audit-domain-runner` | `commands/audit.md`, `skills/audit/audit-orchestrator/SKILL.md`, `skills/battle-test/references/stages.md` | Subagents the orchestrator spawns for the audit and for each domain. |
| Hook `pre-audit-evidence-check.py` | `commands/audit.md` | PreToolUse check on writing `audit-report*.md`: blocks a report whose findings lack `path:line`, cite a missing path, or skip section markers. |
| Hook `post-audit-format-check.py` | `commands/audit.md` | PostToolUse check: warns when the verdict does not match the severity census, domain sections are missing, or the seven-rules attestation is incomplete. |
| Workflow `audit-remediate.mjs` | `commands/audit-remediate.md` | Script the `/audit-remediate` command launches (it points to `~/.claude/workflows/audit-remediate.mjs`). |
| `production-readiness-playbook.md` | `skills/vibe-to-prod/SKILL.md`, the domain audit skills | Reference playbook; citations to it are optional depth. |

## Repository Layout

```text
skills/
  audit/                      21-skill due diligence bundle + references/ (see above)
  auditar-ux-producto/        Task-centered UX audit (Spanish)
  battle-test/                Fail-closed e2e hardening cycle (+ --ux mode)
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
  quality-loop/               Hardening loop in an isolated worktree
  security-review/            Security pass over pending changes
  skill-creator/              Skill creation and validation tools
  skillify/                   Workflow → reusable skill
  supabase-debug/             Supabase diagnosis
  tdd-workflow/               Red-first TDD flow
  validation/                 Evidence-based browser validation
  vibe-to-prod/               13-layer production-readiness self-check
  visual-route-sweep/         Visual route sweep with semantic review
commands/                     /audit and /audit-remediate slash commands
tools/                        Supporting docs and legacy helpers
tests/                        Shell tests for the debate helper functions
```

Reference docs at `skills/` root: `backend-patterns.md`, `frontend-patterns.md`,
`coding-standards.md`, `clickhouse-io.md`, `project-guidelines-example.md`,
`AUTO-HEALING-INTEGRATION-GUIDE.md`.

## Quick starts

Trigger phrases (the skill picks them up from its description; the skill names
are `battle-test`, `validation`, `vibe-to-prod`, `audit-orchestrator`, `debate`;
`/audit` and `/audit-remediate` are commands from `commands/`):

```text
# full hardening cycle on the current project
/battle-test

# UX/UI-only curation with its own verdict (not yet run end to end)
/battle-test --ux

# browser validation
/validation http://localhost:3000
/validation --backend playwright-local --mode standard http://localhost:5173
/validation --resume

# production-readiness self-check
/vibe-to-prod

# full due diligence audit (read-only report)
/audit

# audit, fix on a branch, re-audit, open a PR (needs the workflow script)
/audit-remediate --scope=. --max-rounds=4

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
# ship & verify set (battle-test conducts audit, validation, visual-route-sweep and quality-loop)
cp -r skills/battle-test skills/validation skills/visual-route-sweep skills/vibe-to-prod skills/quality-loop skills/auditar-ux-producto ~/.claude/skills/

# audit bundle (installs as 21 sibling skills + shared catalogs)
cp -r skills/audit/audit-* ~/.claude/skills/
mkdir -p .claude/context && cp skills/audit/references/*.md .claude/context/

# slash commands (/audit, /audit-remediate)
mkdir -p ~/.claude/commands && cp commands/*.md ~/.claude/commands/

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

Requirements: Python 3 with PyYAML (`pip install pyyaml`, used by
`quick_validate.py`), Node.js 18+ and bash.

Run focused validation after edits:

```bash
python skills/skill-creator/scripts/quick_validate.py skills/validation
git diff --check
```

Run the repo tests:

```bash
for t in tests/*.sh; do bash "$t"; done
node --test skills/validation/scripts/validation-contract.test.js
```

As of 2026-11-04 `tests/test-atomic-state-writes.sh` fails 2 of 4 cases
(leftover `.lock` files, lock-timeout case); the other suites pass.

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
