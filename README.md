# Claude Skills

Reusable agent skills, references, scripts, and assets for Claude Code, Codex,
and related CLI-based development workflows.

This repo is the canonical source for the maintained skill set. Install copies
into the active skill root for each provider, or symlink them while iterating.

**Last sync: 2026-11-23** — audit hardening: the audit bundle installs as three
entry points (`audit-orchestrator`, `audit-loop`, `audit-fix-generator`) with
modules and catalogs inside them; `tools/install_skills.py` installs by profile
and finds orphaned old skills; CI, root `AGENTS.md`, negative triggers,
explicit-only heavy skills, a fixed debate lock, batched screenshot review,
MercadoPago webhook signing, a handoff PreCompact guard and
`eval_routing.py`. See `DOCS-MAP.md` for every path.

**Sync 2026-11-11** — added `quality-loop`, `product-ux-audit` and the
`commands/` folder (`/audit`, `/audit-remediate`); `battle-test` gained the
`--ux` mode; the audit reference catalogs now cover H1-H11 and B1-B19; the
`validation` invocation name is `/validation`. Previous sync: 2026-08-24.

**Added later the same day:** seven third-party design and QA skills
(`impeccable`, `improve`, `taste-skill`, `ui-ux-pro-max`, `emil-design-eng`,
`autoqa`, `desloppify`), `battle-test/references/thermos-rubrics.md`, and the
audit pieces that had been left out: `agents/`, `hooks/`, `workflows/` and
`production-readiness-playbook.md`. The third-party copies keep the license and
author lines they arrived with; see [Third-party skills](#third-party-skills).

Copy-paste prompts for each `battle-test` mode and its sibling skills (derived from the skill text, not yet run end to end): [`prompts/README.md`](prompts/README.md).

## Catalog

### Ship & verify — prove it works before calling it done

| Skill | What it does |
|---|---|
| `battle-test` | Fail-closed end-to-end hardening cycle: static audit → exhaustive real-browser validation → semantic screenshot review → multi-role/security/visual-regression probes → isolated remediation → re-verification. `--quick` exists but can never emit a battle-tested verdict. `--ux` curates only UX/UI with its own verdict (see [battle-test `--ux` mode](#battle-test---ux-mode)). |
| `quality-loop` | Self-verifying hardening and quality-sweep loop in an isolated git worktree: works an AUTO list in a fixed order (security → prod-readiness → deps/CVEs → tests/coverage → dead-code → perf → a11y → ux → docs), gates every commit on lint/types/tests/build, and queues operator-only items as GATED. Standalone it pushes verified batches to `main`; `--staged` commits only and leaves the push to the parent (this is how `battle-test` uses it). |
| `product-ux-audit` | Task-centered UX audit: user journeys, duplicated actions, avoidable steps, container choice (modal, side panel, dedicated page), forms, error handling and notification policy for operational products (ERP, CRM, dashboards). Prepares before/after visual comparisons with selectable recommendations and keeps interaction decisions in `DESIGN.md`. |
| `validation` | Evidence-based browser validation: route/element/flow/API inventory, screenshots, console+network checks, resumable state, redaction, auditable HTML report. Modes: smoke / standard / exhaustive. |
| `visual-route-sweep` | Authenticated light/dark × desktop/tablet/mobile screenshots of every safe route, responsive+runtime failure detection, semantic review of every image — the visual slice of battle-test, standalone. |
| `vibe-to-prod` | Guided 13-layer production-readiness self-check for an AI-generated MVP: per-layer PASS/GAP scorecard (security, errors, logging, deploy, compliance…). Lighter than the audit bundle. |
| `deploy-verify` | Post-deploy verification workflow. |
| `security-review` | Focused security pass over pending changes. |

### Audit bundle — technical due diligence

Location: `skills/audit/` (3 installable skills) plus two slash commands in
`commands/`. Full-repository due diligence: the orchestrator, method setup,
hard-stop checks (H1-H11), Tambon LLM-signature hunt, blind-spot walk (B1-B19),
13 domain audits, decision handling, fix-prompt generation, and the
audit→remediate→rerun loop. Domains follow enumeration-before-verdict.

Only the three entry points install as skills, so a provider carries three
metadata blocks instead of 21:

```text
skills/audit/
  audit-orchestrator/   SKILL.md + modules/ + references/
  audit-loop/           SKILL.md + modules/audit-decisions.md + references/
  audit-fix-generator/  SKILL.md + references/
```

- `audit-orchestrator/modules/`: the phase modules it reads or hands to
  subagents on demand (`audit-method`, `audit-hard-stops`, `audit-tambon-hunt`,
  `audit-blind-spots`, `audit-domain-01-security` … `audit-domain-13-code-integrity`,
  plus the `speed-31.md` and `feel-20.md` checklists). They have no `SKILL.md`,
  so no provider lists them.
- `references/`: the seven shared catalogs (`audit-rules.md`,
  `audit-hard-stops.md` H1-H11, `audit-blind-spots.md` B1-B19,
  `audit-tambon-signatures.md`, `audit-report-format.md`,
  `audit-triage-rubric.md`, `domain-audit-contract.md`) and
  `production-readiness-playbook.md`. Each entry point ships an identical copy
  (canonical: `audit-orchestrator/references/`), so every skill works from its
  own folder; `tests/test-repo-hygiene.sh` fails if a copy drifts.
  `vibe-to-prod` ships the same playbook.

Primary entry points:

- `audit-orchestrator`: full dual-layer audit (founder view + technical evidence).
- `audit-loop`: audit → roadmap → remediation → rerun → missed-finding patch loop.
- `audit-fix-generator`: remediation prompts for individual findings.

Slash commands (`commands/`):

| Command | What it does |
|---|---|
| `/audit` | Runs the `audit-orchestrator` skill and writes one `audit-report.md`. Read-only: it never modifies source. Args: `--scope=<path>`, `--priority-domains=<csv of 1-13>`, `--resume-from=<N>`. |
| `/audit-remediate` | Launches the `audit-remediate` workflow: audit, fix on a dedicated branch with per-fix verification, re-audit until green or out of budget, then open a PR. Never merges and never touches `main`. Args: `--scope=<path>`, `--max-rounds=<N>` (default 4). Needs `workflows/audit-remediate.mjs` installed (see the install block below). |

Install the three entry points into the provider skill root; the catalogs
travel inside them, so there is no separate context directory to fill:

```bash
python tools/install_skills.py --profile audit --target all --dry-run
python tools/install_skills.py --profile audit --target all
```

An older install left 18 retired `audit-*` skill folders (`audit-method`,
`audit-hard-stops`, `audit-domain-01-security` …) in the provider roots; see
Installation (`--prune-orphans --dry-run`) for how to find them. The `/audit-remediate` workflow reads the
modules from `~/.claude/skills/audit-orchestrator/` (override with the
`auditSkillDir` argument).
The Claude target also installs the two commands, the two agents and the
workflow script.

The audit pieces outside `skills/`:

| Path | Role |
|---|---|
| `agents/audit-runner.md` | Subagent the orchestrator spawns for the whole audit (copy to `~/.claude/agents/`). |
| `agents/audit-domain-runner.md` | Subagent spawned once per domain (copy to `~/.claude/agents/`). |
| `hooks/pre-audit-evidence-check.py` | PreToolUse check on writing `audit-report*.md`: blocks a report whose findings lack `path:line`, cite a missing path, or skip section markers. |
| `hooks/post-audit-format-check.py` | PostToolUse check: warns when the verdict does not match the severity census, domain sections are missing, or the seven-rules attestation is incomplete. |
| `workflows/audit-remediate.mjs` | Script `/audit-remediate` launches (the command points to `~/.claude/workflows/audit-remediate.mjs`). A workflow-runtime script, not a standalone Node program: it uses a top-level `return`, so a plain `node --check` rejects it. |

The hooks do nothing until you wire them into the project's Claude Code
settings; each file's docstring shows the entry it expects, and that entry runs
them from the project's `.claude/hooks/` (copy them there, not to `~/.claude/`).

### Build — opinionated implementation skills

| Skill | What it does |
|---|---|
| `frontendgame` | Premium mobile-first product UI: design-system discipline, advanced UX patterns, motion engineering, screenshot-to-code, anti-generic-AI-look guardrails. References for interaction patterns, motion, stack recipes. |
| `mcp-builder` | Build MCP servers correctly. |
| `tdd-workflow` | Red-first test-driven flow. |
| `debug-resolve` | Systematic debugging to resolution. |
| `supabase-debug` | Supabase-specific diagnosis. |
| `feature-validation` | Deprecated alias: routes old `feature-validation` prompts to `validation`. |
| `mercadopago-integration` | MercadoPago OAuth/checkout/webhooks for Supabase/React SaaS, with production pitfalls from 7+ real Argentine projects. Assets: OAuth edge function, hook, migration SQL, and a webhook Edge Function with x-signature verification, legacy-IPN handling and idempotent updates; `scripts/mp_webhook_tool.py` signs test notifications and checks `verify_jwt = false`. |
| `checklist-design-app-audit` | Audits against a validated Checklist Design snapshot: 703 auditable items, evidence-aware scoring, deterministic search scripts. |
| `designmotion-ui` | 89 canonical UI/UX rules distilled strictly from 147 `@designmotionhq` posts across layout, type, color, motion, micro-interactions, forms, navigation, a11y, data-viz, onboarding, pricing, and anti-dark-patterns. |

### Session & project workflow

| Skill | What it does |
|---|---|
| `handoff` | Verified, identity-bound session checkpoint (v3: required sections, session/generation/corr identity, checksummed exclusive publication via the bundled `publish-handoff.cjs`; Node.js required). The next session starts from the file, not from vibes. v3.1 adds an optional PreCompact guard (`assets/settings-hooks.json` + `scripts/handoff-guard.cjs`) that blocks a manual compaction without a fresh verified handoff and carries the handoff's path and corr into the compaction summary. |
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
- **UX audit:** `product-ux-audit` runs in place of `audit-orchestrator`
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

## Third-party skills

These skills were written by other people. They are copied here as they were
found, with the license and author lines they already carried; this README adds
no license text of its own, so read each upstream repository for its terms.
`battle-test`, `product-ux-audit` and some audit domain skills name the design
skills below as optional helpers (not stages). "Repo verified" means the
repository exists on GitHub (checked with `gh repo view`) and is named by the
skill itself or by `skills/product-ux-audit/references/sources.md`; the copy
was not compared against it.

| Skill | Origin | What it is for |
|---|---|---|
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (repo verified) | Design operations such as `critique`, `distill`, `shape`, `harden`, `typeset`, `adapt`, `optimize`. The prebuilt Windows engine binary (about 20 MB) is not included: the launchers in `scripts/` download it on first run and check it against `scripts/engine-checksums.txt`. |
| `improve` | [shadcn/improve](https://github.com/shadcn/improve) (repo exists and its description matches the skill; the skill itself names only the author `shadcn`, so treat the link as a best match) | Read-only advisor: surveys a codebase and writes prioritized implementation plans for other agents to execute. |
| `taste-skill` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (repo verified) | Strict UI engineering discipline: component architecture, spacing and type scales, CSS performance rules. |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (repo verified) | Design lookup data (styles, palettes, font pairings, product types, UX guidelines for 10 stacks) plus Python search scripts. |
| `emil-design-eng` | [emilkowalski/skills](https://github.com/emilkowalski/skills) (repo verified) | Touch feedback, micro-interactions and transitions. |
| `desloppify` | [peteromallet/desloppify](https://github.com/peteromallet/desloppify) (repo verified; linked from its `SKILL.md`) | Multi-language codebase health scanner: scan, plan, execute, rescan. |
| `autoqa` | origen no verificado | Self-QA of a repo's running application: feature-by-modality plan, run against a live instance, witnessed pass/fail report. Its `SKILL.md` links `references/discovery.md` and `references/report-template.md`, which were not in the source copy and are therefore not shipped. |

Also included: `skills/battle-test/references/thermos-rubrics.md`, a harsh
code-quality review rubric; its own header names the Cursor `thermos` plugin as
its source, and that header is kept as found.

## What this repo does not include

Pieces that the shipped skills name but that this repository does not carry.
Install them from elsewhere, or treat the features that depend on them as
unavailable.

| Missing piece | Named in | Role |
|---|---|---|
| `impeccable` engine binary (Windows, about 20 MB; other platforms are downloaded the same way) | `skills/impeccable/scripts/impeccable`, `impeccable.cmd` | Fetched and checksum-verified by the launcher on first use. Not committed: it is a downloadable release artifact and would bloat a public repo permanently. |
| `autoqa` `references/discovery.md` and `references/report-template.md` | `skills/autoqa/SKILL.md` | Not present in the copy this repo was synced from; the skill's phase 1 and phase 4 point to them. |
| Hook wiring | `hooks/*.py` | The hook scripts ship; the settings entry that activates them is yours to add. |
| `skill-test.md`, `learning.md`, `/monitoring-setup`, `skills/architecture-decision-records/` | the legacy docs and two `project-*` skills (see `DOCS-MAP.md`) | Cited, never shipped. |

## Repository Layout

```text
skills/
  audit/                      due diligence bundle: 3 entry-point skills (see above)
  autoqa/                     Third-party: self-QA against a running app
  battle-test/                Fail-closed e2e hardening cycle (+ --ux mode)
  checklist-design-app-audit/ Checklist Design evidence audits
  debate/                     Multi-provider debate workflow
  debug-resolve/              Systematic debugging
  deploy-verify/              Post-deploy verification
  designmotion-ui/            89 UI/UX rules distilled from @designmotionhq
  desloppify/                 Third-party: codebase health scanner
  emil-design-eng/            Third-party: animation and micro-interaction craft
  feature-validation/         Deprecated alias routing to validation
  frontendgame/               Premium mobile-first UI engineering
  handoff/                    Verified session checkpoints (v3) + publisher scripts
  impeccable/                 Third-party: design operations (no engine binary)
  improve/                    Third-party: read-only advisor that writes plans
  mcp-builder/                MCP server construction
  mercadopago-integration/    MercadoPago OAuth/payment integration
  product-ux-audit/           Task-centered UX audit
  project-curate/             .claude/ curation workflow
  project-doctor/             Read-only orchestration health check
  project-setup/              AGENTS.md / CLAUDE.md setup workflow
  quality-loop/               Hardening loop in an isolated worktree
  security-review/            Security pass over pending changes
  skill-creator/              Skill creation and validation tools
  skillify/                   Workflow → reusable skill
  supabase-debug/             Supabase diagnosis
  taste-skill/                Third-party: UI engineering discipline
  tdd-workflow/               Red-first TDD flow
  ui-ux-pro-max/              Third-party: design lookup data and search scripts
  validation/                 Evidence-based browser validation
  vibe-to-prod/               13-layer production-readiness self-check
  visual-route-sweep/         Visual route sweep with semantic review
agents/                       audit-runner and audit-domain-runner subagents
commands/                     /audit and /audit-remediate slash commands
hooks/                        pre/post audit report check hooks (Python)
workflows/                    audit-remediate.mjs (workflow-runtime script)
tools/                        install_skills.py + skill-profiles.json + retired-skills.txt, references/ (backend, ClickHouse), legacy docs
tests/                        Shell tests (debate lock, hygiene, frontmatter, installer, routing, MercadoPago, handoff guard)
```

`skills/` holds only skill folders. The former root reference docs now live with
the skill that loads them (`frontendgame/references/frontend-patterns.md`,
`project-setup/references/coding-standards.md`,
`project-setup/assets/project-guidelines-example.md`) or, when no shipped skill
fits, in `tools/references/` (`backend-patterns.md`, `clickhouse-io.md`).

## Quick starts

Trigger phrases (the skill picks them up from its description; the skill names
are `battle-test`, `validation`, `vibe-to-prod`, `audit-orchestrator`, `debate`;
`/audit` and `/audit-remediate` are commands from `commands/`). In Claude Code a
skill's slash command is its `name` or folder name; in Codex mention it as
`$name`. `battle-test`, `debate` and `handoff` are explicit-only: Claude Code
never starts them on its own (`disable-model-invocation: true`) and Codex keeps
them out of the model context (`agents/openai.yaml`
`policy.allow_implicit_invocation: false`), so type `/battle-test` or
`$battle-test`. `audit-orchestrator`, `audit-loop` and `vibe-to-prod` stay
model-invocable because `battle-test`, `/audit` and `audit-orchestrator` load
them; their descriptions forbid starting them unasked.

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

# audit, fix on a branch, re-audit, open a PR (needs workflows/audit-remediate.mjs installed)
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
python skills/skill-creator/scripts/eval_routing.py   # trigger collisions across all skills (38 prompts)
```

Package a distributable skill with:

```bash
python skills/skill-creator/scripts/package_skill.py skills/<skill-name>
```

## Installation

Install only the skills you actually want active, with `tools/install_skills.py`.
Always look at the `--dry-run` output first:

```bash
python tools/install_skills.py --profile ship --target all --dry-run   # plan only, writes nothing
python tools/install_skills.py --profile ship --target all             # copy
python tools/install_skills.py --profile audit --target claude --symlink  # link to the repo while iterating
```

| Flag | Meaning |
|---|---|
| `--profile` | `ship` (battle-test family incl. the audit entry points), `audit` (the three audit entry points), `build`, `workflow`, `all` (every skill, third-party included). Lists live in `tools/skill-profiles.json`. |
| `--target` | `claude` (`~/.claude/skills/`), `codex` (`~/.codex/skills/`), `all` (default). |
| `--symlink` | link the installed folder to the repo instead of copying (Windows needs Developer Mode). |
| `--dry-run` | report `install` / `update (backup)` / `same` per item and name files that exist only in the installed copy (an update moves them to backup with the old folder); write nothing. |
| `--prune-orphans` | find retired skills (`tools/retired-skills.txt`, e.g. the 18 old `audit-*` folders) and `_backup_sync/` or `_archive/` folders hiding `SKILL.md` files inside `~/.claude/skills`, `~/.codex/skills` or `~/.agents/skills`. Codex loads such nested copies as live skills. |
| `--yes` | required to move orphans; without `--dry-run` and `--yes` the prune refuses. |

Copy mode backs up a changed installed copy to
`<provider-home>/_backup_sync/<timestamp>/` (for example
`~/.claude/_backup_sync/`), outside the skill root. A pruned orphan is moved to
`<provider-home>/_backup_sync/<timestamp>/pruned/`; nothing is deleted.
Installing `audit-orchestrator` for Claude also installs its extras into
`~/.claude/`: `commands/audit.md`, `commands/audit-remediate.md`,
`agents/audit-runner.md`, `agents/audit-domain-runner.md`,
`workflows/audit-remediate.mjs`.

Hooks are per project and stay manual:

```bash
mkdir -p .claude/hooks && cp hooks/*.py .claude/hooks/   # still needs a settings entry, see the audit section
```

## Verification

Requirements: Python 3.11+ with PyYAML (`pip install pyyaml`, used by
`quick_validate.py` and `eval_routing.py`), Node.js 18+, bash, `jq` and `openssl`
(debate lock and MercadoPago tests).

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

The debate lock tests (`tests/test-atomic-state-writes.sh`,
`tests/test-state-lock-recovery.sh`) exercise the shipped
`skills/debate/tools/state-lock.sh`; run them on Linux or macOS with `jq`
installed, or the JSON-validation case is skipped.

`tests/test-skill-frontmatter.sh` runs `quick_validate.py` on every skill (the
third-party `impeccable` keeps its upstream `version` key and is the one listed
exception). `tests/test-repo-hygiene.sh` fails on loose files at `skills/` root,
a drifted playbook copy, tracked `.bak`/`.lock` files or personal absolute
paths. `.github/workflows/ci.yml` runs all of the above on every push and pull
request (Ubuntu, Python 3.12 + PyYAML, Node 20), plus `git diff --check` on
the changed range.

Compare repo skills against installed provider copies:

```bash
python skills/skill-creator/scripts/compare_installed_skills.py --target all
python skills/skill-creator/scripts/compare_installed_skills.py --target claude --skill validation
```

The comparison is read-only. To install or update copies use
`tools/install_skills.py` (see Installation).

## Notes

- Do not commit secrets, `.env` files, session transcripts, or private
  provider state. Personal paths are genericized (`~`, `<projects-root>`)
  before every sync.
- Prefer small skill patches over rewrites.
- Keep provider-specific behavioral notes in the relevant skill rather than in
  global instructions.
