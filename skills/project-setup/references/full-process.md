---
name: project-setup
description: Analyze codebase and generate proper CLAUDE.md + AGENTS.md with MemoryMaster integration, real commands, and architecture boundaries. Run in any project to set up or refresh agent instructions. Use when entering a new project, when asked to "set up instructions", "generate CLAUDE.md", "configure this project for agents", or when project instructions are missing/outdated.
metadata:
  argument-hint: "[--force] [--dry-run] [--rollback] [--codex] [--no-memorymaster]"
---

# Project Setup

Generate unified agent instruction files by analyzing the actual codebase.

**CURATES, does NOT replace.** Preserve existing content, restructure into canonical format.

**WARNING - NEVER run destructive commands.** No `npm test`, `pytest`, `go test`, migrations, seeders, or network calls. Only safe probes: `--help`, `--version`, `--co`, `--no-run`, `--listTests`, file existence checks.

**WARNING - Do NOT run from multiple agents simultaneously.** Race condition on shared files.

## Flags

| Flag | Effect |
|------|--------|
| (none) | Merge with existing content, update only stale sections |
| `--dry-run` | Explore + query + show diff, write NOTHING. Reports if exploration fails. |
| `--force` | Full regeneration (still preserves unmanaged sections) |
| `--rollback` | `git stash pop` + `git clean -f GEMINI.md .gemini/settings.json` for new files |
| `--codex` | Also update Codex project config |
| `--no-memorymaster` | Skip MemoryMaster section entirely |

## Process

### 0. Rollback (if `--rollback`)

```bash
cp docs/backups/CLAUDE.md.pre-setup CLAUDE.md 2>/dev/null
cp docs/backups/AGENTS.md.pre-setup AGENTS.md 2>/dev/null
cp docs/backups/GEMINI.md.pre-setup GEMINI.md 2>/dev/null
rm -f GEMINI.md .gemini/settings.json 2>/dev/null  # clean new files if they didn't exist before
```
Then stop.

### 1. Check idempotency marker

```bash
grep "project-setup:" AGENTS.md 2>/dev/null
```

If `<!-- project-setup:YYYY-MM-DD -->` exists AND `--force` is NOT set:
- Switch to **UPDATE mode**: only refresh Commands, Testing, and Verification sections
- Do NOT query MemoryMaster (prevents feedback loop of re-summarizing own output)
- Do NOT rewrite Mission, Architecture, or Boundaries (they are stable)
- Skip to step 6 with update-only behavior

If marker is absent or `--force`: proceed with full generation.

### 2. Create physical backup files

```bash
mkdir -p docs/backups
cp CLAUDE.md docs/backups/CLAUDE.md.pre-setup 2>/dev/null
cp AGENTS.md docs/backups/AGENTS.md.pre-setup 2>/dev/null
cp GEMINI.md docs/backups/GEMINI.md.pre-setup 2>/dev/null
```

These are REAL files the user can diff and restore from. Not git stash.

### 3. Read existing instructions FULLY

```bash
cat CLAUDE.md AGENTS.md GEMINI.md .claude/rules/*.md 2>/dev/null
cat README.md 2>/dev/null | head -100
```

**Extract and preserve:** architecture descriptions, boundary rules, gotchas, deployment notes, team conventions, GitNexus markers (`<!-- gitnexus:start -->` to `<!-- gitnexus:end -->`), hand-edited notes in unmanaged sections.

**Content mapping for existing files (CRITICAL for first run):**
| Existing section | Maps to |
|-----------------|---------|
| Architecture, Design, System, Structure, Directories | -> Architecture (unmanaged) |
| Don'ts, Rules, Constraints, Limits, Forbidden | -> Boundaries (unmanaged) |
| Deploy, Pipeline, CI/CD, Infrastructure | -> `.claude/rules/deployment.md` |
| API, Schema, Endpoints, Webhooks | -> `.claude/rules/api.md` |
| Auth, Security, Permissions | -> `.claude/rules/security.md` |
| Stack, Dependencies, Tech, Framework | -> Stack (managed) |
| Tests, Testing, Coverage | -> Testing (managed) |
| Commands, Scripts, Run, Build | -> Commands (managed) |
| Anything that doesn't fit above | -> Keep as unmanaged section below `<!-- managed:end -->` |

**NEVER silently drop content.** If you can't map it, keep it as-is below the managed block.

### 4. Explore codebase

**Hard-ignore these dirs:** `.git`, `node_modules`, `.next`, `.pytest_cache`, `target`, `vendor`, `dist`, `build`, `__pycache__`, `.cache`, `.turbo`

```bash
# TECH: Stack
ls package.json pyproject.toml Cargo.toml go.mod composer.json Gemfile pom.xml build.gradle 2>/dev/null
cat package.json 2>/dev/null | jq '.dependencies,.devDependencies,.scripts' 2>/dev/null | head -40
cat pyproject.toml 2>/dev/null | head -30

# TECH: Integrations (adapt --include to detected stack)
grep -rl "supabase\|stripe\|mercadopago\|aws-sdk\|firebase\|prisma\|drizzle\|redis\|kafka" \
  --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.rs" \
  --include="*.rb" --include="*.java" -l 2>/dev/null | head -10

# ARCH: Structure (maxdepth 3 for monorepos)
find . -maxdepth 3 -type d \
  -not -path './.git/*' -not -path './node_modules/*' -not -path './.next/*' \
  -not -path './.pytest_cache/*' -not -path './target/*' -not -path './vendor/*' \
  -not -path './dist/*' -not -path './build/*' -not -path './__pycache__/*' \
  | sort | head -40

# ARCH: Monorepo
ls pnpm-workspace.yaml lerna.json nx.json turbo.json 2>/dev/null

# QUALITY: Test + lint config
ls jest.config.* vitest.config.* pytest.ini .eslintrc* biome.json ruff.toml 2>/dev/null

# BUILD: CI
ls .github/workflows/ Dockerfile docker-compose.yml 2>/dev/null
```

**If exploration returns zero useful info** (no manifest, no src dir), warn the user and ask before generating. Don't generate blind instructions.

### 5. Query MemoryMaster (skip if UPDATE mode or `--no-memorymaster`)

```
mcp__memorymaster__query_memory({query: "<project-name> architecture decisions gotchas", limit: 10, detail_level: "summary"})
```

If MCP fails: note it and continue. Don't block.

### 6. Derive or read scope

**First run (no marker):** Derive from git remote, write as hardcoded string.
```bash
git remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git//'
```
Fallback: clean basename (lowercase, spaces to hyphens).

**Re-run (marker exists):** Read existing scope from AGENTS.md, NEVER re-derive:
```bash
grep "Scope:" AGENTS.md 2>/dev/null | head -1
```

### 7. Generate AGENTS.md

Uses **managed/unmanaged section model**:

```markdown
<!-- project-setup:YYYY-MM-DD -->
# <Project Name>

<!-- managed:start - regenerated by /project-setup -->
## Mission
<One paragraph>

## Stack
<Verified from manifests>

## Commands
| Command | Purpose |
|---------|---------|

## Testing
<Framework, how to run>

## Verification
<Safe probes only. At least ONE verified command.>
<!-- managed:end -->

## Architecture
<Real dirs. Preserved from existing file or generated on first run.>

## Boundaries
<Preserved from existing. Never auto-regenerated after first run.>

## MemoryMaster (MCP - always available)
- Scope: `project:<name>`
- **MCP tools**: `query_memory`, `ingest_claim`, `query_for_context`, `list_claims`, `run_cycle`
- **CLI**: `python -m memorymaster --db memorymaster.db <command>`
- Query before: architectural decisions, debugging unfamiliar code
- Ingest after: bug root causes, decisions, gotchas (set `source_agent`)
- **Never ingest**: credentials, API keys, tokens, private IPs

## Intelligence Layers (auto-detect, include only what exists)

**Before generating the sections below, probe for each layer:**

```bash
ls graphify-out/GRAPH_REPORT.md 2>/dev/null && echo "HAS_GRAPHIFY=true"
ls .gitnexus/meta.json 2>/dev/null && echo "HAS_GITNEXUS=true"
ls obsidian-vault/wiki/ 2>/dev/null && echo "HAS_WIKI=true"
ls monitoring.md 2>/dev/null && echo "HAS_MONITORING=true"
```

**Include ONLY the sections that match. Skip the rest - don't write "not available".**

### If HAS_GRAPHIFY:
```markdown
## graphify (Knowledge Graph)
- **Read first**: `graphify-out/GRAPH_REPORT.md` - god nodes, communities, architecture
- **Query**: `graphify query "<question>"` or `graphify path "A" "B"`
- **Auto-update**: post-commit hook rebuilds graph on every commit (AST, 0 tokens)
- **Rule**: read the graph BEFORE grepping raw files - saves 70x tokens
```

### If HAS_GITNEXUS:
```markdown
## GitNexus (Code Intelligence)
- **Query**: `gitnexus_query({query: "concept"})` - execution flows by relevance
- **Impact**: `gitnexus_impact({target: "symbol"})` - MUST run before editing any function/class
- **Context**: `gitnexus_context({name: "symbol"})` - callers, callees, process participation
- **Auto-update**: post-commit hook reindexes on every commit
- **Rule**: NEVER edit a symbol without running impact analysis first
```

### If HAS_WIKI:
```markdown
## Obsidian Wiki
- Articles in `obsidian-vault/wiki/project-<name>/` - compiled truth + timeline
- Auto-generated by `wiki-absorb` every 6h via steward cron
- Use `/wiki query <topic>` to search, `/wiki absorb` to update manually
```

### If HAS_MONITORING:
```markdown
## Monitoring (OmniClaude)
- Contract: `monitoring.md` in project root - signals, severity, escalation
- Read this for project context when debugging incidents
- Run `/monitoring-setup` to regenerate after significant changes
```

### Always include (bottom of AGENTS.md):
```markdown
## Intelligence-First Rule
Before exploring via Grep/Glob/Agent, read cached intelligence in order:
graphify GRAPH_REPORT -> CLAUDE.md/AGENTS.md -> GitNexus -> MemoryMaster -> Obsidian wiki -> monitoring.md -> raw files (only what's missing).
Never dispatch an Explore agent without checking cached sources first.
```
```

**Line guideline:** ~150 lines. Move verbose content to `.claude/rules/`. No hard cap - some projects genuinely need 250+.

**`--force`:** Rewrites only `<!-- managed:start -->` to `<!-- managed:end -->`. Everything outside those markers is preserved.

**UPDATE mode (re-run without --force):** Only refreshes Commands, Testing, Verification inside managed block. Touches nothing else.

### 8. Safe verification

**ONLY these are allowed:**
- `npm test -- --help` or `npx jest --listTests`
- `python -m pytest --co -q | tail -1`
- `go test ./... -list .`
- `cargo test --no-run`
- `ls <path>` to verify directories exist
- `<command> --version` to verify tools exist

**FORBIDDEN:** `npm test`, `pytest` (without --co), `go test` (without -list), any migration, any seeder, any API call.

### 9. Generate .gemini/settings.json + GEMINI.md

`.gemini/settings.json`: `{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}`

`GEMINI.md` (no @imports - Gemini doesn't support them):
```markdown
# <Project> - Gemini Instructions
See AGENTS.md for canonical project instructions.
## Gemini-specific
- MemoryMaster MCP available - use `query_memory` and `ingest_claim`
```

### 10. Generate CLAUDE.md

Preserve GitNexus blocks + unmanaged content:

```markdown
# <Project> - Claude Instructions
@AGENTS.md

## Claude-specific
- GitNexus: `/gitnexus-impact-analysis` before editing symbols
- Wiki: `/wiki query`, `/wiki absorb`, `/wiki lint`
- Path rules: `.claude/rules/`
- Run `/project-setup` to refresh after major changes

<!-- gitnexus:start -->
{preserved or auto-generated by hook}
<!-- gitnexus:end -->
```

### 11. Scaffold .claude/rules/ (intelligence-driven)

Create `.claude/rules/` if not exists. Generate **path-specific rules** with
`paths:` YAML frontmatter so rules only load when Claude works on matching files.

**Sources for rule content (in order):**
1. `graphify-out/GRAPH_REPORT.md` - god nodes tell you which services are critical,
   communities tell you which areas need distinct rules
2. `CLAUDE.md` existing gotchas/essentials - extract into scoped rules
3. MemoryMaster claims of type `constraint`, `gotcha`, `bug_root_cause` - lessons learned
4. Stack conventions detected in Step 4

**Generate these files (skip if no matching code detected):**

**`.claude/rules/frontend.md`** - for React/Vue/Svelte frontends:
```markdown
---
paths:
  - "dashboard/react-app/**/*.{ts,tsx}"
  - "src/**/*.{ts,tsx}"
---
# Frontend Rules
- Use TanStack Query for data fetching, not raw useEffect + fetch
- Use shadcn/ui primitives, not custom components
- Handle both {data:[]} and [] response formats
- No <h1> in pages - Header component handles titles
- Named exports preferred over default exports
```

**`.claude/rules/bot.md`** - for bot/agent code:
```markdown
---
paths:
  - "bot/**/*.js"
---
# Bot Rules
- Always sendReplyAndLog(message, text, session) - never message.reply()
- Always updateStage() then await saveSession() before replying
- Use LRUMap for all in-memory maps - prevents leaks
- Use Winston logger, never console.log
- CommonJS require(), exact case in paths (Linux deploy!)
```

**`.claude/rules/api.md`** - for API routes:
```markdown
---
paths:
  - "dashboard/routes/**/*.js"
  - "bot/routes/**/*.js"
---
# API Rules
- Response format: res.json({ success: true, data: {...} })
- Error format: res.status(N).json({ success: false, error: 'message' })
- Always wrap async handlers in try-catch, log with context
- Parameterized queries only - never string-concatenate SQL
```

**`.claude/rules/security.md`** (no paths - always loaded):
```markdown
# Security Rules
- No hardcoded secrets - always use environment variables
- Validate user input at system boundaries
- Sanitize HTML output to prevent XSS
- Auth middleware only checks login, not role - add explicit role checks
- If a security issue is found, stop and report immediately
```

**`.claude/rules/deployment.md`** (no paths - always loaded):
```markdown
# Deployment Rules
- NEVER docker build on server (crashes VM)
- All changes locally first, never edit on server
- New directories need explicit docker-compose volume mount
- After deploy, always verify with health check
- Deploy related files together in one operation
```

**`.claude/rules/testing.md`** (no paths - always loaded):
```markdown
# Testing Rules
- Run tests before reporting work as done
- Bot tests: wait for reply in logs before sending next message
- Distinguish "implemented" from "verified"
```

**Customization:** Read the project's `CLAUDE.md` for project-specific gotchas
and extract them into the appropriate rule file. Read MemoryMaster for
`constraint` and `gotcha` claims and append them to the matching rule file.
Do NOT duplicate content - if a rule is already in CLAUDE.md AND in a rule file,
keep it only in the rule file and reference it from CLAUDE.md.

**Verify after generation:**
```bash
ls -la .claude/rules/*.md
# Each file should have paths: frontmatter (except security/deployment/testing)
grep -l "^paths:" .claude/rules/*.md
```

### 12. Write or dry-run

**`--dry-run`:** Show diff for each file vs existing. Explores and queries but writes NOTHING. If exploration hit errors (EPERM, missing tools), report them.

**Write:** Write files, then verify paths exist, check no global rules duplicated, confirm managed markers present.
