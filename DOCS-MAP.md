# DOCS-MAP

One line per document: path — purpose — status. Audited 2026-11-04; updated 2026-11-11 for the battle-test family sync, the run prompts, the third-party skills and the audit agents, hooks, workflow and playbook.
Status: **current** · **current\*** (current, but cites files/skills
not shipped in this repo) · **drifted** (content drifted from what it names) ·
**legacy** (kept for history; superseded). A trailing `*` on any status means it cites files/skills not shipped here.

## Root

- `README.md` — catalog, `--ux` mode, third-party skills and their origin, what is not included, layout, install, verification commands — current
- `DOCS-MAP.md` — this index — current

## Ship & verify

- `skills/battle-test/SKILL.md` — fail-closed e2e hardening cycle, incl. `--ux` mode (not yet run end to end) — current
- `skills/battle-test/references/stages.md` — stage execution detail, incl. "UX mode" — current
- `skills/battle-test/references/gates.md` — gates and pass signals, incl. "UX profile gate" — current
- `skills/battle-test/references/report.md` — unified report format, incl. UX verdicts — current
- `skills/battle-test/references/thermos-rubrics.md` — harsh code-quality review rubric layered on battle-test reviews (Cursor `thermos` plugin text, header kept) — current
- `skills/battle-test/agents/openai.yaml` — Codex display metadata for `battle-test` — current
- `skills/quality-loop/SKILL.md` — hardening loop in an isolated worktree (`--staged` under `battle-test`) — current
- `skills/product-ux-audit/SKILL.md` — task-centered UX audit, feeds `battle-test --ux` — current
- `skills/product-ux-audit/agents/openai.yaml` — Codex display metadata for `product-ux-audit` — current
- `skills/product-ux-audit/references/audit-method.md` — audit method — current
- `skills/product-ux-audit/references/interaction-criteria.md` — interaction criteria — current
- `skills/product-ux-audit/references/notifications-and-feedback.md` — notification and feedback policy — current
- `skills/product-ux-audit/references/visual-comparison.md` — before/after visual comparison — current
- `skills/product-ux-audit/references/templates.md` — output templates, incl. export to `TRACKS.md` / `ux-findings.json` — current
- `skills/product-ux-audit/references/design-md-integrations.md` — `DESIGN.md` governance and optional third-party tools — current\* (external tools it names beyond the shipped skills)
- `skills/product-ux-audit/references/sources.md` — sources — current
- `skills/validation/SKILL.md` — evidence-based browser validation entry point — current
- `skills/validation/phases/DISCOVER.md` — discover phase — current
- `skills/validation/phases/TEST.md` — test phase — current
- `skills/validation/phases/REPORT.md` — report phase — current
- `skills/validation/adapters/agent-browser.md` — agent-browser backend — current
- `skills/validation/adapters/browser-harness.md` — browser-harness backend — current\* (upstream `install.md`)
- `skills/validation/adapters/chrome-mcp.md` — Chrome MCP backend — current
- `skills/validation/adapters/playwright-cli.md` — playwright-cli backend — current
- `skills/validation/adapters/playwright-local.md` — project-local Playwright backend — current
- `skills/validation/adapters/playwright-mcp.md` — Playwright MCP backend — current
- `skills/validation/references/auth.md` — auth and multi-role coverage — current
- `skills/validation/references/config-schema.md` — `validation.config.json` schema — current
- `skills/validation/references/coverage-contract.md` — coverage contract — current
- `skills/validation/references/evidence-rules.md` — evidence rules — current
- `skills/validation/references/interactive-start.md` — interactive start flow — current
- `skills/validation/references/responsive-and-quality.md` — responsive/layout checks — current
- `skills/validation/references/security-probe.md` — security and ownership probe — current
- `skills/validation/references/state-schema.md` — resumable state schema — current
- `skills/validation/references/visual-regression.md` — visual regression — current
- `skills/visual-route-sweep/SKILL.md` — visual route screenshot sweep — current
- `skills/visual-route-sweep/references/coverage-contract.md` — sweep coverage contract — current
- `skills/vibe-to-prod/SKILL.md` — 13-layer production-readiness self-check — current
- `skills/deploy-verify/SKILL.md` — post-deploy verification — current
- `skills/security-review/SKILL.md` — security pass over pending changes — current
- `skills/security-review/references/full-checklist.md` — long security checklist — current

## Run prompts (`prompts/`)

- `prompts/README.md` — index: cases table, valid/rejected flag combinations with file:line, flag and verdict map, "Not tested" (not yet run end to end) — current
- `prompts/01-full.md` — prompt for `/battle-test` (full cycle, no integration to main) — current
- `prompts/02-full-and-integrate.md` — prompt for `/battle-test --push-main` (the only case that integrates to main) — current
- `prompts/03-ux-ui-only.md` — prompt for `/battle-test --ux` — current
- `prompts/04-audit-only.md` — prompt for `/battle-test --audit-only` — current
- `prompts/05-quick.md` — prompt for `/battle-test --quick` — current
- `prompts/06-resume.md` — prompts for `--resume` and `--ux --resume` — current
- `prompts/07-audit-and-remediate-with-pr.md` — prompts for `/audit-remediate` and `/audit` — current
- `prompts/08-validate-the-app-only.md` — prompts for `/validation` and its modes — current
- `prompts/09-ux-audit-without-fixes.md` — prompt for the `product-ux-audit` skill alone — current
- `prompts/10-screenshots-only.md` — prompt for `visual-route-sweep` without `--fix` — current
- `prompts/11-fix-from-a-list.md` — prompt for `quality-loop --staged --from-tracks` — current

## Slash commands (`commands/`)

- `commands/audit.md` — `/audit` slash command, launches `audit-orchestrator` — current
- `commands/audit-remediate.md` — `/audit-remediate` slash command, audit → fix on a branch → re-audit → PR — current

## Audit bundle (`skills/audit/`)

- `audit-orchestrator/SKILL.md` — full due-diligence audit entry point (`/audit`) — current
- `audit-method/SKILL.md` — stack fingerprint and inventory setup — current
- `audit-hard-stops/SKILL.md` — H1-H11 hard-stop walk — current
- `audit-tambon-hunt/SKILL.md` — Tambon LLM-signature hunt — current
- `audit-blind-spots/SKILL.md` — B1-B19 blind-spot walk — current
- `audit-domain-01-security/SKILL.md` — domain audit: security — current
- `audit-domain-02-architecture/SKILL.md` — domain audit: architecture & code quality — current
- `audit-domain-03-database/SKILL.md` — domain audit: database/data layer — current
- `audit-domain-04-devops/SKILL.md` — domain audit: infra & DevOps — current
- `audit-domain-05-performance/SKILL.md` — domain audit: performance — current
- `audit-domain-06-ux-a11y/SKILL.md` — domain audit: UX & accessibility — current
- `audit-domain-07-reliability/SKILL.md` — domain audit: reliability — current
- `audit-domain-08-compliance/SKILL.md` — domain audit: legal/privacy/compliance — current
- `audit-domain-09-maintainability/SKILL.md` — domain audit: DX & maintainability — current
- `audit-domain-10-cost/SKILL.md` — domain audit: cost & billing risk — current
- `audit-domain-11-demo-vs-prod/SKILL.md` — domain audit: demo vs production gap — current
- `audit-domain-12-missing/SKILL.md` — domain audit: missing production features — current
- `audit-domain-13-code-integrity/SKILL.md` — domain audit: code integrity — current
- `audit-domain-05-performance/references/speed-31.md` — 31-item app-speed checklist — current
- `audit-domain-06-ux-a11y/references/feel-20.md` — 20-item UX "feel" checklist — current
- `audit-decisions/SKILL.md` — remediation decision / baseline-policy templates — current
- `audit-fix-generator/SKILL.md` — per-finding fix prompt (`/audit-fix`) — current
- `audit-loop/SKILL.md` — audit → remediate → rerun loop — current
- `references/audit-rules.md` — rules R1-R7 — current
- `references/audit-hard-stops.md` — hard-stops catalog (H1-H11) — current
- `references/audit-blind-spots.md` — blind-spots catalog (B1-B19) — current
- `references/audit-tambon-signatures.md` — Tambon signatures — current
- `references/audit-report-format.md` — report format — current
- `references/audit-triage-rubric.md` — triage rubric — current
- `references/domain-audit-contract.md` — contract every domain audit follows — current
- `references/production-readiness-playbook.md` — production-readiness playbook cited by `vibe-to-prod` and the domain audits (cited as `~/.codex/context/production-readiness-playbook.md`; the install lines copy it there) — current

## Third-party skills (copied as found; origin in `README.md`)

- `skills/impeccable/SKILL.md` — design operations entry point (critique, polish, harden, typeset, adapt, optimize...); the Windows engine binary is not shipped, the launchers download it — current
- `skills/impeccable/reference/adapt.md` — reference for the `adapt` design operation — current
- `skills/impeccable/reference/adapt.native.md` — native-platform variant of `adapt` — current
- `skills/impeccable/reference/android.md` — Android platform notes — current
- `skills/impeccable/reference/animate.md` — reference for the `animate` design operation — current
- `skills/impeccable/reference/audit.md` — reference for the `audit` design operation — current
- `skills/impeccable/reference/audit.native.md` — native-platform variant of `audit` — current
- `skills/impeccable/reference/bolder.md` — reference for the `bolder` design operation — current
- `skills/impeccable/reference/clarify.md` — reference for the `clarify` design operation — current
- `skills/impeccable/reference/colorize.md` — reference for the `colorize` design operation — current
- `skills/impeccable/reference/component-review.md` — plan and asset review checkpoint on comp-led builds, before any page code — current
- `skills/impeccable/reference/craft-floor.md` — craft floor: checklist loaded once the direction is settled — current
- `skills/impeccable/reference/craft.md` — craft: deprecated alias for an ordinary request to make new visual work — current
- `skills/impeccable/reference/critique.md` — reference for the `critique` design operation — current
- `skills/impeccable/reference/degraded/asset-producer.md` — inline fallback instructions for the asset producer role when the harness has no subagents — current
- `skills/impeccable/reference/degraded/documenter.md` — inline fallback instructions for the documenter role when the harness has no subagents — current
- `skills/impeccable/reference/degraded/finish-reviewer.md` — inline fallback instructions for the finish reviewer role when the harness has no subagents — current
- `skills/impeccable/reference/degraded/manual-edit-applier.md` — inline fallback instructions for the manual edit applier role when the harness has no subagents — current
- `skills/impeccable/reference/delight.md` — reference for the `delight` design operation — current
- `skills/impeccable/reference/distill.md` — reference for the `distill` design operation — current
- `skills/impeccable/reference/doctor.md` — doctor: report and repair drift between a project's Impeccable artifacts (PRODUCT.md, DESIGN.md, config) and the installed version — current
- `skills/impeccable/reference/document.md` — generate a DESIGN.md at the project root that captures the visual design system — current
- `skills/impeccable/reference/extract.md` — extract flow: find reusable patterns, components and tokens and consolidate them into the design system — current
- `skills/impeccable/reference/generate.md` — generate: fast lane into live mode for one named element — current
- `skills/impeccable/reference/harden.md` — reference for the `harden` design operation — current
- `skills/impeccable/reference/hooks.md` — `/impeccable hooks`: the per-edit detector hook, config and trust notes — current
- `skills/impeccable/reference/init.md` — init flow: captures durable product truth in PRODUCT.md — current
- `skills/impeccable/reference/ios.md` — iOS platform notes — current
- `skills/impeccable/reference/layout.md` — reference for the `layout` design operation — current
- `skills/impeccable/reference/live-setup.md` — one-time live-mode project setup, loaded from live.md — current
- `skills/impeccable/reference/live.md` — live variant mode: pick elements in the browser, get variants hot-swapped through the dev server — current
- `skills/impeccable/reference/mode-operate.md` — MODE RULES block printed for the Operate surface type — current
- `skills/impeccable/reference/mode-persuade.md` — MODE RULES block printed for the Persuade and Experience surface types — current
- `skills/impeccable/reference/mode-read.md` — MODE RULES block printed for the Read surface type — current
- `skills/impeccable/reference/new-work.md` — new visual work flow for a new surface or a replacement visual identity — current
- `skills/impeccable/reference/onboard.md` — reference for the `onboard` design operation — current
- `skills/impeccable/reference/operate.md` — Operate mode depth (and Read notes) — current
- `skills/impeccable/reference/optimize.md` — reference for the `optimize` design operation — current
- `skills/impeccable/reference/overdrive.md` — reference for the `overdrive` design operation — current
- `skills/impeccable/reference/polish.md` — reference for the `polish` design operation — current
- `skills/impeccable/reference/quieter.md` — reference for the `quieter` design operation — current
- `skills/impeccable/reference/region-map.md` — region map: names what is visible in the approved comp before asset production — current
- `skills/impeccable/reference/routing.md` — command guidance: workflow questions and the command menu — current
- `skills/impeccable/reference/shape.md` — reference for the `shape` design operation — current
- `skills/impeccable/reference/typeset.md` — reference for the `typeset` design operation — current
- `skills/impeccable/reference/visualize.md` — direction comps and asset production, loaded from new-work.md — current
- `skills/improve/SKILL.md` — read-only advisor that writes implementation plans for other agents — current
- `skills/improve/references/audit-playbook.md` — what to look for per audit category, plus the finding format — current
- `skills/improve/references/plan-template.md` — handoff plan template written for an executor with zero context — current
- `skills/improve/references/closing-the-loop.md` — execute, reconcile and issues: the follow-through flows after a plan is written — current
- `skills/taste-skill/SKILL.md` — strict UI engineering discipline — current
- `skills/ui-ux-pro-max/SKILL.md` — design lookup (styles, palettes, fonts, UX guidelines) with search scripts — current
- `skills/ui-ux-pro-max/CLAUDE.md` — upstream project guidance for the search toolkit, kept as found; names upstream `src/` paths that do not exist here — current\* (upstream layout)
- `skills/ui-ux-pro-max/templates/base/quick-reference.md` — template section: when to apply the guidelines — current
- `skills/ui-ux-pro-max/templates/base/skill-content.md` — template skeleton with title, description and quick-reference placeholders — current
- `skills/emil-design-eng/SKILL.md` — animation, transitions and micro-interaction craft — current
- `skills/autoqa/SKILL.md` — self-QA against a running app (origin not verified) — current\* (`references/discovery.md`, `references/report-template.md`)
- `skills/desloppify/SKILL.md` — multi-language codebase health scanner — current

## Audit agents (`agents/`)

- `agents/audit-runner.md` — subagent that runs the whole audit in its own context (spawned by `audit-orchestrator`) — current
- `agents/audit-domain-runner.md` — subagent that audits one domain (spawned once per domain) — current

## Build

- `skills/frontendgame/SKILL.md` — premium mobile-first UI build — current
- `skills/frontendgame/references/design-system.md` — design system — current
- `skills/frontendgame/references/interaction-patterns.md` — interaction patterns — current
- `skills/frontendgame/references/motion-engineering.md` — motion — current
- `skills/frontendgame/references/reverse-engineering.md` — screenshot-to-code — current
- `skills/frontendgame/references/stack-recipes.md` — stack recipes — current
- `skills/mcp-builder/SKILL.md` — build MCP servers — current
- `skills/mcp-builder/references/mcp_best_practices.md` — MCP best practices — current
- `skills/mcp-builder/references/node_mcp_server.md` — Node/TS server guide — current
- `skills/mcp-builder/references/python_mcp_server.md` — Python server guide — current
- `skills/mcp-builder/references/evaluation.md` — MCP evaluation guide — current
- `skills/tdd-workflow/SKILL.md` — red-first TDD — current
- `skills/tdd-workflow/references/full-process.md` — long TDD process — current
- `skills/debug-resolve/SKILL.md` — systematic debugging — current
- `skills/supabase-debug/SKILL.md` — Supabase diagnosis — current
- `skills/mercadopago-integration/SKILL.md` — MercadoPago OAuth/checkout/webhooks — current
- `skills/mercadopago-integration/references/troubleshooting.md` — MercadoPago troubleshooting — current
- `skills/checklist-design-app-audit/SKILL.md` — Checklist Design audit — current
- `skills/checklist-design-app-audit/references/README.md` — dataset reference — current
- `skills/feature-validation/SKILL.md` — deprecated alias routing to `validation` — current (alias)
- `skills/feature-validation/references/legacy-feature-validation.md` — old feature-validation workflow — legacy
- `skills/feature-validation/references/AUTO-HEALING-INTEGRATION-GUIDE.md` — auto-healing integration — legacy\* (`skill-test.md` not in repo)
- `skills/feature-validation/references/skill-auto-healing.md` — auto-healing module — legacy\* (`skill-test.md`)
- `skills/feature-validation/references/handoff.md` — recursive-learning notes — legacy

## Session & project workflow

- `skills/handoff/SKILL.md` — verified, identity-bound session checkpoint v3 — current
- `skills/handoff/scripts/handoff-contract.cjs` — handoff validation and publication library (required by the publisher) — current
- `skills/handoff/scripts/publish-handoff.cjs` — handoff publisher CLI (validate and publish exclusively) — current
- `skills/skillify/SKILL.md` — workflow → reusable skill — current
- `skills/skill-creator/SKILL.md` — create/validate skills (example paths are illustrative) — current
- `skills/project-setup/SKILL.md` — generate AGENTS.md / CLAUDE.md — current
- `skills/project-setup/references/full-process.md` — long setup process — current\* (`/monitoring-setup` not in repo)
- `skills/project-curate/SKILL.md` — curate a project's `.claude/` — current
- `skills/project-curate/references/full-process.md` — long curation process — current\* (`skills/architecture-decision-records/` not in repo)
- `skills/project-doctor/SKILL.md` — read-only orchestration health check — current\* (`/monitoring-setup`)

## Collaboration

- `skills/debate/SKILL.md` — three-way Claude/Gemini/Codex debate — current
- `skills/debate/README.md` — debate hub user guide — current
- `skills/debate/helpers.md` — debate helper functions (tested by `tests/`) — current

## Loose references (`skills/` root)

- `skills/backend-patterns.md` — backend/API patterns — current
- `skills/frontend-patterns.md` — React/Next.js patterns — current
- `skills/coding-standards.md` — TS/JS coding standards — current
- `skills/clickhouse-io.md` — ClickHouse patterns — current
- `skills/project-guidelines-example.md` — example project-guidelines skill — current (example)
- `skills/AUTO-HEALING-INTEGRATION-GUIDE.md` — older copy of the auto-healing guide — legacy\* (`skill-test.md`)

## Tools

- `tools/retrospective-learning.md` — skill retrospective learning module — legacy\* (`skill-test.md`, `learning.md`)
- `tools/RETROSPECTIVE-LEARNING-INTEGRATION-GUIDE.md` — retrospective learning integration — legacy\* (`skill-test.md`, `learning.md`)
- `tools/sample/feature-validation-SKILL.md` — sample of the old feature-validation skill — legacy
