# DOCS-MAP

One line per document: path — purpose — status. Audited 2026-11-04; updated 2026-11-11 for the battle-test family sync, the run prompts, the third-party skills and the audit agents, hooks, workflow and playbook.
Status: **vigente** (current) · **vigente\*** (current, but cites files/skills
not shipped in this repo) · **desfasado** (content drifted from what it names) ·
**legado** (kept for history; superseded). A trailing `*` on any status means it cites files/skills not shipped here.

## Root

- `README.md` — catalog, `--ux` mode, third-party skills and their origin, what is not included, layout, install, verification commands — vigente
- `DOCS-MAP.md` — this index — vigente

## Ship & verify

- `skills/battle-test/SKILL.md` — fail-closed e2e hardening cycle, incl. `--ux` mode (not yet run end to end) — vigente
- `skills/battle-test/references/stages.md` — stage execution detail, incl. "UX mode" — vigente
- `skills/battle-test/references/gates.md` — gates and pass signals, incl. "UX profile gate" — vigente
- `skills/battle-test/references/report.md` — unified report format, incl. UX verdicts — vigente
- `skills/battle-test/references/thermos-rubrics.md` — harsh code-quality review rubric layered on battle-test reviews (Cursor `thermos` plugin text, header kept) — vigente
- `skills/battle-test/agents/openai.yaml` — Codex display metadata for `battle-test` — vigente
- `skills/quality-loop/SKILL.md` — hardening loop in an isolated worktree (`--staged` under `battle-test`) — vigente
- `skills/auditar-ux-producto/SKILL.md` — task-centered UX audit (Spanish), feeds `battle-test --ux` — vigente
- `skills/auditar-ux-producto/agents/openai.yaml` — Codex display metadata for `auditar-ux-producto` — vigente
- `skills/auditar-ux-producto/references/metodo-auditoria.md` — audit method — vigente
- `skills/auditar-ux-producto/references/criterios-interaccion.md` — interaction criteria — vigente
- `skills/auditar-ux-producto/references/notificaciones-y-feedback.md` — notification and feedback policy — vigente
- `skills/auditar-ux-producto/references/comparacion-visual.md` — before/after visual comparison — vigente
- `skills/auditar-ux-producto/references/plantillas.md` — output templates, incl. export to `TRACKS.md` / `ux-findings.json` — vigente
- `skills/auditar-ux-producto/references/design-md-integraciones.md` — `DESIGN.md` governance and optional third-party tools — vigente\* (external tools it names beyond the shipped skills)
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
- `skills/vibe-to-prod/SKILL.md` — 13-layer production-readiness self-check — vigente
- `skills/deploy-verify/SKILL.md` — post-deploy verification — vigente
- `skills/security-review/SKILL.md` — security pass over pending changes — vigente
- `skills/security-review/references/full-checklist.md` — long security checklist — vigente

## Run prompts (`prompts/`)

- `prompts/README.md` — index: cases table, valid/rejected flag combinations with file:line, flag and verdict map, "No probado" (not yet run end to end) — vigente
- `prompts/01-todo.md` — prompt for `/battle-test` (full cycle, no integration to main) — vigente
- `prompts/02-todo-e-integrar.md` — prompt for `/battle-test --push-main` (the only case that integrates to main) — vigente
- `prompts/03-solo-ux-ui.md` — prompt for `/battle-test --ux` — vigente
- `prompts/04-solo-auditar.md` — prompt for `/battle-test --audit-only` — vigente
- `prompts/05-rapido.md` — prompt for `/battle-test --quick` — vigente
- `prompts/06-retomar.md` — prompts for `--resume` and `--ux --resume` — vigente
- `prompts/07-auditar-y-remediar-con-pr.md` — prompts for `/audit-remediate` and `/audit` — vigente
- `prompts/08-solo-validar-la-app.md` — prompts for `/validation` and its modes — vigente
- `prompts/09-auditoria-ux-sin-arreglos.md` — prompt for the `auditar-ux-producto` skill alone — vigente
- `prompts/10-solo-capturas.md` — prompt for `visual-route-sweep` without `--fix` — vigente
- `prompts/11-solo-arreglar-desde-lista.md` — prompt for `quality-loop --staged --from-tracks` — vigente

## Slash commands (`commands/`)

- `commands/audit.md` — `/audit` slash command, launches `audit-orchestrator` — vigente
- `commands/audit-remediate.md` — `/audit-remediate` slash command, audit → fix on a branch → re-audit → PR — vigente

## Audit bundle (`skills/audit/`)

- `audit-orchestrator/SKILL.md` — full due-diligence audit entry point (`/audit`) — vigente
- `audit-method/SKILL.md` — stack fingerprint and inventory setup — vigente
- `audit-hard-stops/SKILL.md` — H1-H11 hard-stop walk — vigente
- `audit-tambon-hunt/SKILL.md` — Tambon LLM-signature hunt — vigente
- `audit-blind-spots/SKILL.md` — B1-B19 blind-spot walk — vigente
- `audit-domain-01-security/SKILL.md` — domain audit: security — vigente
- `audit-domain-02-architecture/SKILL.md` — domain audit: architecture & code quality — vigente
- `audit-domain-03-database/SKILL.md` — domain audit: database/data layer — vigente
- `audit-domain-04-devops/SKILL.md` — domain audit: infra & DevOps — vigente
- `audit-domain-05-performance/SKILL.md` — domain audit: performance — vigente
- `audit-domain-06-ux-a11y/SKILL.md` — domain audit: UX & accessibility — vigente
- `audit-domain-07-reliability/SKILL.md` — domain audit: reliability — vigente
- `audit-domain-08-compliance/SKILL.md` — domain audit: legal/privacy/compliance — vigente
- `audit-domain-09-maintainability/SKILL.md` — domain audit: DX & maintainability — vigente
- `audit-domain-10-cost/SKILL.md` — domain audit: cost & billing risk — vigente
- `audit-domain-11-demo-vs-prod/SKILL.md` — domain audit: demo vs production gap — vigente
- `audit-domain-12-missing/SKILL.md` — domain audit: missing production features — vigente
- `audit-domain-13-code-integrity/SKILL.md` — domain audit: code integrity — vigente
- `audit-domain-05-performance/references/speed-31.md` — 31-item app-speed checklist — vigente
- `audit-domain-06-ux-a11y/references/feel-20.md` — 20-item UX "feel" checklist — vigente
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
- `references/production-readiness-playbook.md` — production-readiness playbook cited by `vibe-to-prod` and the domain audits (cited as `~/.codex/context/production-readiness-playbook.md`; the install lines copy it there) — vigente

## Third-party skills (copied as found; origin in `README.md`)

- `skills/impeccable/SKILL.md` — design operations entry point (critique, polish, harden, typeset, adapt, optimize...); the Windows engine binary is not shipped, the launchers download it — vigente
- `skills/impeccable/reference/adapt.md` — reference for the `adapt` design operation — vigente
- `skills/impeccable/reference/adapt.native.md` — native-platform variant of `adapt` — vigente
- `skills/impeccable/reference/android.md` — Android platform notes — vigente
- `skills/impeccable/reference/animate.md` — reference for the `animate` design operation — vigente
- `skills/impeccable/reference/audit.md` — reference for the `audit` design operation — vigente
- `skills/impeccable/reference/audit.native.md` — native-platform variant of `audit` — vigente
- `skills/impeccable/reference/bolder.md` — reference for the `bolder` design operation — vigente
- `skills/impeccable/reference/clarify.md` — reference for the `clarify` design operation — vigente
- `skills/impeccable/reference/colorize.md` — reference for the `colorize` design operation — vigente
- `skills/impeccable/reference/component-review.md` — plan and asset review checkpoint on comp-led builds, before any page code — vigente
- `skills/impeccable/reference/craft-floor.md` — craft floor: checklist loaded once the direction is settled — vigente
- `skills/impeccable/reference/craft.md` — craft: deprecated alias for an ordinary request to make new visual work — vigente
- `skills/impeccable/reference/critique.md` — reference for the `critique` design operation — vigente
- `skills/impeccable/reference/degraded/asset-producer.md` — inline fallback instructions for the asset producer role when the harness has no subagents — vigente
- `skills/impeccable/reference/degraded/documenter.md` — inline fallback instructions for the documenter role when the harness has no subagents — vigente
- `skills/impeccable/reference/degraded/finish-reviewer.md` — inline fallback instructions for the finish reviewer role when the harness has no subagents — vigente
- `skills/impeccable/reference/degraded/manual-edit-applier.md` — inline fallback instructions for the manual edit applier role when the harness has no subagents — vigente
- `skills/impeccable/reference/delight.md` — reference for the `delight` design operation — vigente
- `skills/impeccable/reference/distill.md` — reference for the `distill` design operation — vigente
- `skills/impeccable/reference/doctor.md` — doctor: report and repair drift between a project's Impeccable artifacts (PRODUCT.md, DESIGN.md, config) and the installed version — vigente
- `skills/impeccable/reference/document.md` — generate a DESIGN.md at the project root that captures the visual design system — vigente
- `skills/impeccable/reference/extract.md` — extract flow: find reusable patterns, components and tokens and consolidate them into the design system — vigente
- `skills/impeccable/reference/generate.md` — generate: fast lane into live mode for one named element — vigente
- `skills/impeccable/reference/harden.md` — reference for the `harden` design operation — vigente
- `skills/impeccable/reference/hooks.md` — `/impeccable hooks`: the per-edit detector hook, config and trust notes — vigente
- `skills/impeccable/reference/init.md` — init flow: captures durable product truth in PRODUCT.md — vigente
- `skills/impeccable/reference/ios.md` — iOS platform notes — vigente
- `skills/impeccable/reference/layout.md` — reference for the `layout` design operation — vigente
- `skills/impeccable/reference/live-setup.md` — one-time live-mode project setup, loaded from live.md — vigente
- `skills/impeccable/reference/live.md` — live variant mode: pick elements in the browser, get variants hot-swapped through the dev server — vigente
- `skills/impeccable/reference/mode-operate.md` — MODE RULES block printed for the Operate surface type — vigente
- `skills/impeccable/reference/mode-persuade.md` — MODE RULES block printed for the Persuade and Experience surface types — vigente
- `skills/impeccable/reference/mode-read.md` — MODE RULES block printed for the Read surface type — vigente
- `skills/impeccable/reference/new-work.md` — new visual work flow for a new surface or a replacement visual identity — vigente
- `skills/impeccable/reference/onboard.md` — reference for the `onboard` design operation — vigente
- `skills/impeccable/reference/operate.md` — Operate mode depth (and Read notes) — vigente
- `skills/impeccable/reference/optimize.md` — reference for the `optimize` design operation — vigente
- `skills/impeccable/reference/overdrive.md` — reference for the `overdrive` design operation — vigente
- `skills/impeccable/reference/polish.md` — reference for the `polish` design operation — vigente
- `skills/impeccable/reference/quieter.md` — reference for the `quieter` design operation — vigente
- `skills/impeccable/reference/region-map.md` — region map: names what is visible in the approved comp before asset production — vigente
- `skills/impeccable/reference/routing.md` — command guidance: workflow questions and the command menu — vigente
- `skills/impeccable/reference/shape.md` — reference for the `shape` design operation — vigente
- `skills/impeccable/reference/typeset.md` — reference for the `typeset` design operation — vigente
- `skills/impeccable/reference/visualize.md` — direction comps and asset production, loaded from new-work.md — vigente
- `skills/improve/SKILL.md` — read-only advisor that writes implementation plans for other agents — vigente
- `skills/improve/references/audit-playbook.md` — what to look for per audit category, plus the finding format — vigente
- `skills/improve/references/plan-template.md` — handoff plan template written for an executor with zero context — vigente
- `skills/improve/references/closing-the-loop.md` — execute, reconcile and issues: the follow-through flows after a plan is written — vigente
- `skills/taste-skill/SKILL.md` — strict UI engineering discipline — vigente
- `skills/ui-ux-pro-max/SKILL.md` — design lookup (styles, palettes, fonts, UX guidelines) with search scripts — vigente
- `skills/ui-ux-pro-max/CLAUDE.md` — upstream project guidance for the search toolkit, kept as found; names upstream `src/` paths that do not exist here — vigente\* (upstream layout)
- `skills/ui-ux-pro-max/templates/base/quick-reference.md` — template section: when to apply the guidelines — vigente
- `skills/ui-ux-pro-max/templates/base/skill-content.md` — template skeleton with title, description and quick-reference placeholders — vigente
- `skills/emil-design-eng/SKILL.md` — animation, transitions and micro-interaction craft — vigente
- `skills/autoqa/SKILL.md` — self-QA against a running app (origin not verified) — vigente\* (`references/discovery.md`, `references/report-template.md`)
- `skills/desloppify/SKILL.md` — multi-language codebase health scanner — vigente

## Audit agents (`agents/`)

- `agents/audit-runner.md` — subagent that runs the whole audit in its own context (spawned by `audit-orchestrator`) — vigente
- `agents/audit-domain-runner.md` — subagent that audits one domain (spawned once per domain) — vigente

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
