# DOCS-MAP

One line per document: path — purpose — status. Audited 2026-11-04; updated 2026-11-11 for the battle-test family sync and the run prompts.
Status: **vigente** (current) · **vigente\*** (current, but cites files/skills
not shipped in this repo) · **desfasado** (content drifted from what it names) ·
**legado** (kept for history; superseded). A trailing `*` on any status means it cites files/skills not shipped here.

## Root

- `README.md` — catalog, `--ux` mode, optional third-party skills, what is not included, layout, install, verification commands — vigente
- `DOCS-MAP.md` — this index — vigente

## Ship & verify

- `skills/battle-test/SKILL.md` — fail-closed e2e hardening cycle, incl. `--ux` mode (not yet run end to end) — vigente\* (optional third-party design skills)
- `skills/battle-test/references/stages.md` — stage execution detail, incl. "UX mode" — vigente\* (`audit-runner` agent)
- `skills/battle-test/references/gates.md` — gates and pass signals, incl. "UX profile gate" — vigente
- `skills/battle-test/references/report.md` — unified report format, incl. UX verdicts — vigente
- `skills/battle-test/agents/openai.yaml` — Codex display metadata for `battle-test` — vigente
- `skills/quality-loop/SKILL.md` — hardening loop in an isolated worktree (`--staged` under `battle-test`) — vigente
- `skills/auditar-ux-producto/SKILL.md` — task-centered UX audit (Spanish), feeds `battle-test --ux` — vigente\* (optional third-party design skills)
- `skills/auditar-ux-producto/agents/openai.yaml` — Codex display metadata for `auditar-ux-producto` — vigente
- `skills/auditar-ux-producto/references/metodo-auditoria.md` — audit method — vigente
- `skills/auditar-ux-producto/references/criterios-interaccion.md` — interaction criteria — vigente
- `skills/auditar-ux-producto/references/notificaciones-y-feedback.md` — notification and feedback policy — vigente
- `skills/auditar-ux-producto/references/comparacion-visual.md` — before/after visual comparison — vigente
- `skills/auditar-ux-producto/references/plantillas.md` — output templates, incl. export to `TRACKS.md` / `ux-findings.json` — vigente
- `skills/auditar-ux-producto/references/design-md-integraciones.md` — `DESIGN.md` governance and optional third-party tools — vigente\* (third-party skills)
- `skills/auditar-ux-producto/references/fuentes.md` — sources — vigente
- `skills/validation/SKILL.md` — evidence-based browser validation entry point — vigente
- `skills/validation/phases/DISCOVER.md` — discover phase — vigente
- `skills/validation/phases/TEST.md` — test phase — vigente
- `skills/validation/phases/REPORT.md` — report phase — vigente
- `skills/validation/adapters/agent-browser.md` — agent-browser backend — vigente
- `skills/validation/adapters/browser-harness.md` — browser-harness backend — vigente\* (upstream `install.md`)
- `skills/validation/adapters/chrome-mcp.md` — Chrome MCP backend — vigente
- `skills/validation/adapters/playwright-cli.md` — playwright-cli backend — vigente
- `skills/validation/adapters/playwright-local.md` — project-local Playwright backend — vigente
- `skills/validation/adapters/playwright-mcp.md` — Playwright MCP backend — vigente
- `skills/validation/references/auth.md` — auth and multi-role coverage — vigente
- `skills/validation/references/config-schema.md` — `validation.config.json` schema — vigente
- `skills/validation/references/coverage-contract.md` — coverage contract — vigente
- `skills/validation/references/evidence-rules.md` — evidence rules — vigente
- `skills/validation/references/interactive-start.md` — interactive start flow — vigente
- `skills/validation/references/responsive-and-quality.md` — responsive/layout checks — vigente
- `skills/validation/references/security-probe.md` — security and ownership probe — vigente
- `skills/validation/references/state-schema.md` — resumable state schema — vigente
- `skills/validation/references/visual-regression.md` — visual regression — vigente
- `skills/visual-route-sweep/SKILL.md` — visual route screenshot sweep — vigente
- `skills/visual-route-sweep/references/coverage-contract.md` — sweep coverage contract — vigente
- `skills/vibe-to-prod/SKILL.md` — 13-layer production-readiness self-check — vigente\* (`production-readiness-playbook.md`)
- `skills/deploy-verify/SKILL.md` — post-deploy verification — vigente
- `skills/security-review/SKILL.md` — security pass over pending changes — vigente
- `skills/security-review/references/full-checklist.md` — long security checklist — vigente

## Run prompts (`prompts/`)

- `prompts/README.md` — index: cases table, valid/rejected flag combinations with file:line, flag and verdict map, "No probado" (not yet run end to end) — vigente
- `prompts/01-todo.md` — prompt for `/battle-test` (full cycle, no integration to main) — vigente
- `prompts/02-todo-e-integrar.md` — prompt for `/battle-test --push-main` (the only case that integrates to main) — vigente
- `prompts/03-solo-ux-ui.md` — prompt for `/battle-test --ux` — vigente
- `prompts/04-solo-auditar.md` — prompt for `/battle-test --audit-only` — vigente
- `prompts/05-rapido.md` — prompt for `/battle-test --quick` — vigente* (`production-readiness-playbook.md`, via `vibe-to-prod`)
- `prompts/06-retomar.md` — prompts for `--resume` and `--ux --resume` — vigente
- `prompts/07-auditar-y-remediar-con-pr.md` — prompts for `/audit-remediate` and `/audit` — vigente* (`audit-remediate.mjs` workflow, `audit-runner` agent)
- `prompts/08-solo-validar-la-app.md` — prompts for `/validation` and its modes — vigente
- `prompts/09-auditoria-ux-sin-arreglos.md` — prompt for the `auditar-ux-producto` skill alone — vigente
- `prompts/10-solo-capturas.md` — prompt for `visual-route-sweep` without `--fix` — vigente
- `prompts/11-solo-arreglar-desde-lista.md` — prompt for `quality-loop --staged --from-tracks` — vigente

## Slash commands (`commands/`)

- `commands/audit.md` — `/audit` slash command, launches `audit-orchestrator` — vigente\* (`audit-runner` agent, `pre-audit-evidence-check.py` and `post-audit-format-check.py` hooks)
- `commands/audit-remediate.md` — `/audit-remediate` slash command, audit → fix on a branch → re-audit → PR — vigente\* (`audit-remediate.mjs` workflow)

## Audit bundle (`skills/audit/`)

- `audit-orchestrator/SKILL.md` — full due-diligence audit entry point (`/audit`) — vigente\* (`audit-domain-runner` agent)
- `audit-method/SKILL.md` — stack fingerprint and inventory setup — vigente
- `audit-hard-stops/SKILL.md` — H1-H11 hard-stop walk — vigente
- `audit-tambon-hunt/SKILL.md` — Tambon LLM-signature hunt — vigente
- `audit-blind-spots/SKILL.md` — B1-B19 blind-spot walk — vigente
- `audit-domain-01-security/SKILL.md` — domain audit: security — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-02-architecture/SKILL.md` — domain audit: architecture & code quality — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-03-database/SKILL.md` — domain audit: database/data layer — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-04-devops/SKILL.md` — domain audit: infra & DevOps — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-05-performance/SKILL.md` — domain audit: performance — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-06-ux-a11y/SKILL.md` — domain audit: UX & accessibility — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-07-reliability/SKILL.md` — domain audit: reliability — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-08-compliance/SKILL.md` — domain audit: legal/privacy/compliance — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-09-maintainability/SKILL.md` — domain audit: DX & maintainability — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-10-cost/SKILL.md` — domain audit: cost & billing risk — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-11-demo-vs-prod/SKILL.md` — domain audit: demo vs production gap — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-12-missing/SKILL.md` — domain audit: missing production features — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-13-code-integrity/SKILL.md` — domain audit: code integrity — vigente\* (`production-readiness-playbook.md`)
- `audit-domain-05-performance/references/speed-31.md` — 31-item app-speed checklist — vigente\* (`production-readiness-playbook.md`, optional `impeccable`)
- `audit-domain-06-ux-a11y/references/feel-20.md` — 20-item UX "feel" checklist — vigente\* (`production-readiness-playbook.md`, optional `impeccable`, `emil-design-eng`)
- `audit-decisions/SKILL.md` — remediation decision / baseline-policy templates — vigente
- `audit-fix-generator/SKILL.md` — per-finding fix prompt (`/audit-fix`) — vigente
- `audit-loop/SKILL.md` — audit → remediate → rerun loop — vigente
- `references/audit-rules.md` — rules R1-R7 — vigente
- `references/audit-hard-stops.md` — hard-stops catalog (H1-H11) — vigente
- `references/audit-blind-spots.md` — blind-spots catalog (B1-B19) — vigente
- `references/audit-tambon-signatures.md` — Tambon signatures — vigente
- `references/audit-report-format.md` — report format — vigente
- `references/audit-triage-rubric.md` — triage rubric — vigente
- `references/domain-audit-contract.md` — contract every domain audit follows — vigente

## Build

- `skills/frontendgame/SKILL.md` — premium mobile-first UI build — vigente
- `skills/frontendgame/references/design-system.md` — design system — vigente
- `skills/frontendgame/references/interaction-patterns.md` — interaction patterns — vigente
- `skills/frontendgame/references/motion-engineering.md` — motion — vigente
- `skills/frontendgame/references/reverse-engineering.md` — screenshot-to-code — vigente
- `skills/frontendgame/references/stack-recipes.md` — stack recipes — vigente
- `skills/mcp-builder/SKILL.md` — build MCP servers — vigente
- `skills/mcp-builder/references/mcp_best_practices.md` — MCP best practices — vigente
- `skills/mcp-builder/references/node_mcp_server.md` — Node/TS server guide — vigente
- `skills/mcp-builder/references/python_mcp_server.md` — Python server guide — vigente
- `skills/mcp-builder/references/evaluation.md` — MCP evaluation guide — vigente
- `skills/tdd-workflow/SKILL.md` — red-first TDD — vigente
- `skills/tdd-workflow/references/full-process.md` — long TDD process — vigente
- `skills/debug-resolve/SKILL.md` — systematic debugging — vigente
- `skills/supabase-debug/SKILL.md` — Supabase diagnosis — vigente
- `skills/mercadopago-integration/SKILL.md` — MercadoPago OAuth/checkout/webhooks — vigente
- `skills/mercadopago-integration/references/troubleshooting.md` — MercadoPago troubleshooting — vigente
- `skills/checklist-design-app-audit/SKILL.md` — Checklist Design audit — vigente
- `skills/checklist-design-app-audit/references/README.md` — dataset reference — vigente
- `skills/feature-validation/SKILL.md` — deprecated alias routing to `validation` — vigente (alias)
- `skills/feature-validation/references/legacy-feature-validation.md` — old feature-validation workflow — legado
- `skills/feature-validation/references/AUTO-HEALING-INTEGRATION-GUIDE.md` — auto-healing integration — legado\* (`skill-test.md` not in repo)
- `skills/feature-validation/references/skill-auto-healing.md` — auto-healing module — legado\* (`skill-test.md`)
- `skills/feature-validation/references/handoff.md` — recursive-learning notes — legado

## Session & project workflow

- `skills/handoff/SKILL.md` — structured session handoff v2 — vigente
- `skills/skillify/SKILL.md` — workflow → reusable skill — vigente
- `skills/skill-creator/SKILL.md` — create/validate skills (example paths are illustrative) — vigente
- `skills/project-setup/SKILL.md` — generate AGENTS.md / CLAUDE.md — vigente
- `skills/project-setup/references/full-process.md` — long setup process — vigente\* (`/monitoring-setup` not in repo)
- `skills/project-curate/SKILL.md` — curate a project's `.claude/` — vigente
- `skills/project-curate/references/full-process.md` — long curation process — vigente\* (`skills/architecture-decision-records/` not in repo)
- `skills/project-doctor/SKILL.md` — read-only orchestration health check — vigente\* (`/monitoring-setup`)

## Collaboration

- `skills/debate/SKILL.md` — three-way Claude/Gemini/Codex debate — vigente
- `skills/debate/README.md` — debate hub user guide — vigente
- `skills/debate/helpers.md` — debate helper functions (tested by `tests/`) — vigente

## Loose references (`skills/` root)

- `skills/backend-patterns.md` — backend/API patterns — vigente
- `skills/frontend-patterns.md` — React/Next.js patterns — vigente
- `skills/coding-standards.md` — TS/JS coding standards — vigente
- `skills/clickhouse-io.md` — ClickHouse patterns — vigente
- `skills/project-guidelines-example.md` — example project-guidelines skill — vigente (example)
- `skills/AUTO-HEALING-INTEGRATION-GUIDE.md` — older copy of the auto-healing guide — legado\* (`skill-test.md`)

## Tools

- `tools/retrospective-learning.md` — skill retrospective learning module — legado\* (`skill-test.md`, `learning.md`)
- `tools/RETROSPECTIVE-LEARNING-INTEGRATION-GUIDE.md` — retrospective learning integration — legado\* (`skill-test.md`, `learning.md`)
- `tools/sample/feature-validation-SKILL.md` — sample of the old feature-validation skill — legado
