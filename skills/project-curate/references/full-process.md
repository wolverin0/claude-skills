---
name: project-curate
description: Hand-tune a project's `.claude/` directory by cherry-picking ECC (everything-claude-code) rules/skills/agents and generating project-specific rules based on the project's real intelligence layers (GitNexus, MemoryMaster, graphify, Obsidian wiki, existing CLAUDE.md). Run preflight intelligence builds for layers that don't exist yet. Run in any project to curate or re-curate its `.claude/` directory. Use when asked to "curate this project", "cherry-pick rules for this repo", "/project-curate", or when a project's `.claude/` is bloated with mass-installed noise or missing stack-specific rules.
metadata:
  argument-hint: "[--dry-run] [--force] [--skip-verifier] [--no-graphify]"
  trigger: /project-curate
---

# project-curate

Per-project curation of `.claude/` informed by real codebase intelligence. Complements `/project-setup` (which generates CLAUDE.md + AGENTS.md scaffolding) by populating `.claude/rules/`, pruning mass-install noise, and cherry-picking stack-specific rules from ECC.

**Curates, does not replace.** Preserves every hand-authored file by default. All destructive actions (archiving, overwriting) are reversible and gated by user approval.

## Required before running

- ECC repo cloned somewhere locally (default: `G:\_OneDrive\OneDrive\Desktop\Py Apps\_____testing\repo`). If absent, first run: `git clone --depth 1 https://github.com/affaan-m/everything-claude-code.git <path>/repo`.
- `npx gitnexus` available on PATH (or auto-installed via npx).
- `python -m memorymaster` available (for MemoryMaster CLI fallback if MCP unreachable).
- User's existing `~/.claude/rules/*.md` globals are kept unchanged - this skill only writes to the target project's `.claude/`.

## Flags

| Flag | Effect |
|------|--------|
| (none) | Full interactive flow: preflight + proposal + approve + execute + verify |
| `--dry-run` | Run preflight + produce proposal, write NOTHING |
| `--force` | Skip confirmation prompts on overwriting existing rule files (still preserves unmanaged hand-authored files outside the rule set) |
| `--skip-verifier` | Skip the verifier-pane step (NOT recommended - caught real drift in both pilots) |
| `--no-graphify` | Skip graphify auto-run (use when you know the corpus is too big or you're on a slow machine) |

## Core principles (non-negotiable lessons from 2 pilots)

1. **Grep-verify every reference before commit.** ~50% of generated project-specific rules in pilots had invented identifiers (nonexistent functions, wrong enum values, missed directory refactors). Extract every backtick identifier from generated rules, grep the project, flag unmatched for human review. This is mandatory, not optional.
2. **Prefer pattern descriptions over symbol names.** "Look for `PRAGMA journal_mode` in `storage.py`" is more robust than "WAL is set in `storage.py:_ensure_wal()`" - function names get refactored.
3. **Pull enum values from source-of-truth constants.** When referencing statuses, tiers, roles, event types: read the canonical tuple from the code, don't recall from summary.
4. **Verifier-pane is mandatory.** Spawn a fresh Claude in plan-mode after curation; task it to verify rule accuracy + describe a rule-driven improvement. Budget ~$2-3 Opus xhigh + ~5min per project.
5. **Stay tight on project-specific rule count.** 3-4 max. Pilot #1 generated 6, one had accuracy drift (`mercadopago.md`). Pilot #2 kept to 3 and they held up better. More rules = more drift + more overlap with ECC stack rules.
6. **Archive, don't delete.** Mass-installed agent/skill noise moves to `.claude/_archive_noise_<date>/`, never `rm -rf`.
7. **Plan for amendment commits.** The verifier WILL catch drift. Structure the branch workflow so a `fix(claude-rules):` follow-up commit is expected, not exceptional.

## Process

### Step 0. Ensure ECC repo is present

```bash
ECC_REPO="G:/_OneDrive/OneDrive/Desktop/Py Apps/_____testing/repo"
if [ ! -d "$ECC_REPO" ]; then
  git clone --depth 1 https://github.com/affaan-m/everything-claude-code.git "$ECC_REPO"
fi
ls "$ECC_REPO/rules/" "$ECC_REPO/skills/" > /dev/null || { echo "ECC repo structure broken"; exit 1; }
```

### Step 1. Preflight - build all missing intelligence layers

Run these in order. Each is a light task, but collectively they can take several minutes on a dormant project.

**1a. Basic inventory (always, free, instant):**

```bash
cd <project>
ls -la                                                          # top-level tree
ls package.json pyproject.toml Cargo.toml go.mod 2>/dev/null   # stack detection
[ -d .claude ] && find .claude -maxdepth 2 -type d | sort       # existing .claude/ structure
[ -f CLAUDE.md ] && wc -l CLAUDE.md                             # CLAUDE.md presence + size
[ -f AGENTS.md ] && wc -l AGENTS.md
git status --porcelain 2>/dev/null | head -10                   # WIP check
```

**Repo hygiene rule (NOT fail-fast):** if `git status` shows mixed uncommitted state (real WIP + intelligence artifacts + junk), DO NOT bail back to the user. Handle it autonomously:

1. **First, check for an existing Claude pane for this project** via `mcp__wezbridge__discover_sessions`. If one exists AND is idle AND is running Claude (`is_claude: true`, `status: "idle"`), reuse it - it has the historical conversation context for the WIP. Never spawn a duplicate pane when a working one exists for the same `cwd`.
2. If no existing pane OR it's busy: the coordinator does the cleanup itself. Mechanical classification (WIP code -> branch+commit, intelligence artifacts -> `.gitignore`, accidental junk -> rm, curation artifacts -> leave untracked) does NOT require the existing pane's context.
3. Delegate only when the peer pane is idle AND the classification is genuinely ambiguous (e.g., "was this file intentional-"). Otherwise coordinator handles.

**Hard stop only when** a diff is genuinely unreadable (e.g., binary mystery file, a huge refactor with no obvious intent). In that case, `git stash push -m "pre-curate stash $(date +%F)"` it and proceed - never force-commit mystery content.

**1b. MemoryMaster scope query (always, free):**

```
mcp__memorymaster__query_memory({
  query: "<project-name> architecture decisions gotchas",
  scope_allowlist: "project:<slug>",
  limit: 20,
  detail_level: "summary"
})
```

Report count. Zero claims is OK - project may be dormant. Skill must still proceed.

**1c. GitNexus - auto-run if missing or stale:**

```bash
if [ ! -f .gitnexus/meta.json ]; then
  echo "GitNexus index missing - building..."
  npx gitnexus analyze         # ~30s-2min, AST only, 0 LLM tokens
elif [ .gitnexus/meta.json -ot .git/HEAD ]; then
  echo "GitNexus index stale - refreshing..."
  npx gitnexus analyze
fi
```

Preserve embeddings: check `.gitnexus/meta.json` `stats.embeddings` field; if >0, run with `--embeddings`.

After build, query for a few architectural signals:

```
mcp__gitnexus__query({query: "<domain concept>", repo: "<slug>", limit: 3})
```

This confirms the index works and gives a sanity check on what the graph revealed.

**1d. graphify - auto-run if missing, unless `--no-graphify`:**

Invoke the `/graphify` skill. Graphify has its own built-in corpus-size gate (pauses at `total_words > 2,000,000` OR `total_files > 200` and asks the user to pick a subfolder). Trust it. If graphify pauses, the curate skill pauses with it.

```
Skill: graphify
Args: (path implicit - current project)
```

Expected output: `graphify-out/GRAPH_REPORT.md` + `graphify-out/graph.json` + `graphify-out/graph.html`. God nodes, communities, and surprising connections feed the cherry-pick decisions later.

**1e. Obsidian wiki check (no build, just presence):**

```bash
ls "obsidian-vault/wiki/project-<slug>/" 2>/dev/null          # local project vault
ls "<GLOBAL_VAULT>/wiki/project-<slug>/" 2>/dev/null          # user's global wiki vault
```

If no articles, note it but do NOT auto-run `wiki-absorb` unless MemoryMaster has >10 claims for this scope (wiki-absorb with few claims is noise).

```bash
# Only if >10 claims:
python -m memorymaster --db memorymaster.db wiki-absorb \
  --output "<GLOBAL_VAULT>/wiki" \
  --scope "project:<slug>"
```

**1f. Print preflight report:**

```
== Preflight report: <project> ==
  GitNexus:         <stats> [was missing, took Ns | already indexed | stale, refreshed]
  graphify:         <stats> [built | already present | skipped]
  MemoryMaster:     N claims for project:<slug>
  Wiki:             <N articles | none | absorbed now>
  CLAUDE.md:        <exists (X KB) | missing - Active Rules append will be skipped>
  AGENTS.md:        <exists (X KB) | N/A>
  .claude/ state:   <N skills, M agents, K rules> <noise detected: yes/no>
  Stack detected:   <e.g. TypeScript/React/Vite/Supabase OR Python 3.10+/SQLite>
  Uncommitted:      <clean | N files>

Proceed with curation- (Y/n)
```

Wait for user confirmation unless `--force`.

### Step 2. Backup

```bash
mkdir -p .claude/_backups
tar czf ".claude/_backups/pre-curate-$(date +%Y-%m-%d).tgz" .claude/ CLAUDE.md AGENTS.md 2>/dev/null
```

Gitignore the backup dir:

```bash
grep -q "^\.claude/_backups" .gitignore 2>/dev/null || echo ".claude/_backups/" >> .gitignore
```

### Step 3. Detect branch-protection hook - if present, ALWAYS branch

Check for pre-commit guards that block main:

```bash
grep -l "commit-guard\|files staged on main\|PR branch\|Cross-directory commit" .git/hooks/ 2>/dev/null | head -1
```

**If ANY guard is found: always create a feature branch before the first commit**, regardless of file count. Heuristic confirmed on 2026-04-18 gimnasio-next pilot: the guard matches on "Cross-directory commit on main (X, Y)" even with 2 files, not just ">3 files staged". Don't try to predict the guard's threshold - just branch.

```bash
git checkout -b omni/fix-claude-rules-curation
```

If no guard detected, main commits are fine for small repos.

### Step 4. Produce cherry-pick proposal

Based on preflight intelligence, assemble a proposal table:

**4a. ECC rules to copy:**

Map detected stack -> ECC `rules/<lang>/*.md` dirs. Canonical mappings:

| Detected stack | Copy from ECC | Path scope |
|---|---|---|
| TypeScript / React / Vue / Svelte | `rules/typescript/{coding-style,patterns,testing,security,hooks}.md` | `**/*.{ts,tsx,js,jsx}` (already in frontmatter) |
| Any web UI (frontend component dir present) | `rules/web/{security,performance,design-quality}.md` | **INJECT frontmatter** - ECC web rules ship WITHOUT `paths:`. Required scope: `src/**/*.{ts,tsx}` or equivalent. Not injecting = they load globally. |
| Python | `rules/python/{coding-style,patterns,testing,security,hooks}.md` | `**/*.{py,pyi}` (already in frontmatter) |
| Go, Rust, Java, C#, C++, Dart, PHP, Kotlin, Swift, Perl | `rules/<lang>/{coding-style,patterns,testing,security,hooks}.md` | language-specific globs |

**SKIP** `rules/common/*` - user has own curated globals at `~/.claude/rules/{coding-style,git-workflow,security,testing}.md`. Those win.

**Post-copy fix:** strip the `> This file extends [common/...](../common/...)` line from each copied rule (common/ is not copied, link would dangle):

```bash
sed -i '/^> This file extends \[common\//d' <project>/.claude/rules/**/*.md
```

**4b. Project-specific rules to generate (<=3-4):**

Candidate source signals for project-specific rules:

| Signal | Generates rule |
|---|---|
| GitNexus communities reveal a distinct functional area with repeat gotchas | area-specific rule (e.g., `multi-tenant.md`) |
| AGENTS.md Boundaries section has explicit "never do X" lines | domain invariant rule (e.g., `claims-lifecycle.md`) |
| Schema migration names reveal security hardening pattern | security-specific rule (e.g., `kitchen-pin-security.md`) |
| Custom helpers detected (e.g., `withRetry`, `safeCount`) | resilience-patterns rule |
| Deploy/cron topology distinct from vanilla | deployment rule (e.g., `vercel-deploy.md`) |
| Two-store parity (SQLite + Postgres, or similar) | parity rule (e.g., `storage-parity.md`) |

**Budget: 3-4 rules max.** If tempted to write a 5th, ask: "is this already covered by an ECC stack rule-" Usually yes.

**4c. Skills to cherry-pick from ECC:**

Default: **NONE.** User has 100+ skills globally; piling more on creates noise and invocation ambiguity.

Exceptions - offer only if:
- Security-heavy project (RLS migrations, PIN hashing, audit logs): offer `skills/architecture-decision-records/SKILL.md`
- No other case auto-offers.

Ask user before copying any ECC skill.

**4d. Agents to cherry-pick:**

Default: **NONE.** Always skip - user has globals.

**4e. Noise to archive:**

Detect mass-installed dirs. Common patterns seen in pilot #1 (elbraserito had 52 such dirs):

```bash
# Flag these subdirs of .claude/agents/ and .claude/skills/ as candidates for archival:
#   analysis, architecture, browser, consensus, core, custom, data, development,
#   devops, documentation, flow-nexus, github, goal, optimization, payments, sona,
#   sparc, specialized, sublinear, swarm, templates, testing, v3
#   agentdb-*, flow-nexus-*, github-*, reasoningbank-*, swarm-*, sparc-methodology,
#   stream-chain, pair-programming, v3-*
# These are typically from a one-time claude-flow / SPARC / v3 mass install, never
# picked for the project. User can still keep any of them by explicit request.
```

Propose the list to the user before moving.

**4f. Show the full proposal:**

```
== Cherry-pick proposal: <project> ==

ECC rules to copy (N files):
  - rules/<lang>/coding-style.md    -> .claude/rules/<lang>/coding-style.md
  - ...

Project-specific rules to generate (M files):
  - claims-lifecycle.md   (always-on)  [sources: AGENTS.md Boundaries, models.py]
  - ...

ECC skills to copy: <NONE | list with rationale>
ECC agents to copy: NONE

Noise to archive (-> .claude/_archive_noise_<date>/):
  agents/: <list>
  skills/: <list>

Preserved untouched:
  - CLAUDE.md, AGENTS.md (only CLAUDE.md will get an "Active Rules" append)
  - .claude/rules/<pre-existing user rules>
  - .claude/skills/<pre-existing user-picked skills>
  - .claude/helpers/, .claude/settings.json, .claude/commands/

Proceed- (y/N)
```

Wait for approval unless `--dry-run` (print and exit) or `--force`.

### Step 5. Execute

**5a. Archive noise:**

```bash
mkdir -p .claude/_archive_noise_$(date +%Y-%m-%d)/{agents,skills}
# move each flagged dir
```

**5b. Copy ECC rules + strip common/ line + inject web frontmatter:**

```bash
mkdir -p .claude/rules/<lang>
cp $ECC_REPO/rules/<lang>/*.md .claude/rules/<lang>/
sed -i '/^> This file extends \[common\//d' .claude/rules/<lang>/*.md

# For web/*.md ONLY (they ship without paths frontmatter):
if [ -d .claude/rules/web ]; then
  for f in .claude/rules/web/*.md; do
    head -1 "$f" | grep -q "^---" || {
      # prepend paths frontmatter
      printf '%s\n' "---" "paths:" "  - \"src/**/*.{ts,tsx}\"" "---" "" > /tmp/fm
      cat /tmp/fm "$f" > "$f.new" && mv "$f.new" "$f"
    }
  done
fi
```

**5c. Generate project-specific rules (<=3-4 files):**

For each rule, draft content from the source signals. Then grep-verify every identifier BEFORE writing:

```bash
# Extract every `backtick` identifier from the drafted rule
# For each: grep the project
# Unmatched -> flag for user, do NOT silently commit with bad reference
```

If any reference doesn't match, either:
- Rewrite the rule to describe the pattern instead of name the symbol, OR
- Show user the unmatched reference + ask to continue/amend

**5d. Append "Active Rules" section to CLAUDE.md:**

**Only if CLAUDE.md exists.** This skill does NOT own CLAUDE.md/AGENTS.md - that's `/project-setup`'s job. If CLAUDE.md is missing, skip this step and note the user can add an Active Rules index later (or run `/project-setup` separately).

If present: insert AFTER the last existing section (before any GitNexus block if present). Index the rules; do NOT duplicate content.

**5e. Write curation log:**

Create `.claude/_curation_log_$(date +%Y-%m-%d).md` documenting:
- Context before curation
- What was copied (with sources)
- What was generated (with source signals)
- What was preserved untouched
- What was archived
- What was NOT done and why
- Delta vs previous curations of this project (if applicable)

### Step 6. Branch + atomic commit

If commit-guard detected in Step 3:

```bash
git checkout -b omni/fix-claude-rules-curation
```

Otherwise stay on current branch.

```bash
git add .gitignore CLAUDE.md <any AGENTS.md changes> .claude/rules/ .claude/_curation_log_*.md
# explicitly do NOT add .claude/settings.json if untracked (user's private settings)
# explicitly do NOT add .claude/_backups/ (already gitignored)
git -c commit.gpgsign=false commit -m "chore(claude-rules): curate .claude/ with ECC <langs> + project-specific rules

<bullet list of what was added>
<bullet list of what was archived>

Curation log: .claude/_curation_log_<date>.md
Backup: .claude/_backups/pre-curate-<date>.tgz (gitignored)"
```

### Step 7. Verifier pane - MANDATORY (with fallback)

**Do NOT skip this step unless `--skip-verifier` was explicitly passed.** All three pilots caught real drift the author missed.

**Before spawning, always check for an existing Claude pane for this project:**

```
mcp__wezbridge__discover_sessions({ only_claude: true })
```

If a Claude pane with matching `project` (cwd) exists AND `status: "idle"`, reuse it - don't spawn a duplicate. Spawning when a pane already exists either creates a broken duplicate (pilot #3: pane 32 spawned as plain bash with a `-claude` typo while pane 30 was already a healthy Claude session) or attaches to the existing pane with mixed conversation context (pilots #1 and #2). Either way, reuse beats spawn.

**If no existing pane, spawn fresh:**

```
mcp__wezbridge__spawn_session({
  cwd: "<project-abs-path>",
  permission_mode: "plan",
  spawned_by_pane_id: <this pane>,
  prompt: <the verifier task>
})
```

**VALIDATE spawn actually launched Claude, not bash.** After spawn + send_key("enter"), wait ~15s then `read_output(pane_id, 30)`. If output shows `bash: command not found` or `$ <prompt text>` as shell commands, the spawn failed - kill the pane (`mcp__wezbridge__kill_session`) and fall back to coordinator-self-verify (Step 7b below). Do NOT leave a broken pane running.

Verifier task template:

```
You are a read-only verifier for <project>. The coordinator (pane <X>) just
curated `.claude/rules/` (<N> rule files, on branch <Y>).

TASK (no writes, plan mode enforces this):

1) Run /memory and report the loaded instruction/rule files.

2) Read these new rule files:
   - <list all generated project-specific rules>

3) Read <one canonical file the rules reference, e.g. src/pages/Checkout.tsx
   for frontend or memorymaster/mcp_server.py for backend>. Then run /memory
   again and report the diff - which path-scoped rules newly activated.

4) Without editing anything, describe ONE concrete improvement you would make
   to <canonical file> based on the active rules. Cite which rule suggests it.

5) Rule accuracy check - for each generated rule, verify:
   <list specific file/function/constant references for pane to grep-verify>

6) Report via A2A envelope:

[A2A from pane-<N> to pane-<coord> | corr=<project>-verify-1 | type=result]
## Loaded at start
...
## Loaded after reading <canonical file>
...
## Rule-driven improvement
Rule: <filename>
Quote: "<exact line>"
Suggestion: <what you'd change>
## Rule accuracy check
- <rule>: <VERIFIED | BROKEN: details>
...
## Anything broken?
<list>

Do not edit any files.
```

Per the wezbridge rule: **send_key("enter") after spawn_session** - initial_prompt does NOT auto-submit.

Monitor the pane with heartbeat Monitor (since wezbridge MCP tools cannot be called from shell). Poll `read_output` at each heartbeat until the verifier completes.

Note: `spawn_session` may attach to an existing pane for the same project cwd. If so, the verifier's conversation context is mixed - accept the cost or close the existing pane first.

### Step 7b. Coordinator self-verify - FALLBACK when pane approach fails

When the verifier pane cannot be used (spawn launched bash not Claude; no idle pane available; peer is busy on unrelated work that would be disrupted), the coordinator performs the same checks directly:

```bash
# For each backtick-identifier in every generated rule:
#   - if it's a file path: `ls <path>` or `Glob` to confirm existence
#   - if it's a function/class/const name: `Grep -n "<name>"` within the rule's path scope
#   - if it's a line range: read the file, confirm the range contains what the rule claims
# Emit a pass/fail table. For each FAIL, amend the rule with a minimum-diff fix.
```

The coordinator-self-verify pattern was forced in pilot #3 (pane 32 spawn bug) and caught 2 drifts the author missed (`security-service.ts` export list, `next.config.ts` header line range). Equivalent rigor to verifier-pane for reference checks - weaker only for "describe a rule-driven improvement" (that needs a fresh Claude context + /memory tool). Skipping the improvement suggestion is an acceptable degrade.

**Coordinator-does-it-itself is the default when delegation overhead exceeds the task.** For mechanical checks (grep, ls, line ranges), delegation is pure overhead - coordinator does it.

### Step 8. Apply drift fixes + second commit

Based on verifier findings:

- For each rule the verifier flagged as BROKEN: apply the minimum-diff fix (rewrite the bad reference, or restructure to use pattern-language instead of symbol names).
- Append the findings + fixes to the curation log under a "Verifier pane" section.
- Do NOT re-verify - one cycle is enough. Further drift is the user's call.

```bash
git add .claude/rules/ .claude/_curation_log_*.md
git -c commit.gpgsign=false commit -m "fix(claude-rules): correct drifted identifiers caught by verifier pane

<list of specific fixes, with canonical sources cited>

Caught by: read-only verifier pane <N>"
```

### Step 9. Final report to user

```
== Curation complete: <project> ==
Branch: <branch-name>
Commits:
  - <sha1> chore(claude-rules): initial curation (<X> files, +N/-M)
  - <sha2> fix(claude-rules): drift fixes (<Y> files, +P/-Q)

Rules now active:
  <tree of .claude/rules/>

Archived (reversible):
  <N agents + M skills in .claude/_archive_noise_<date>/>

Verifier findings summary:
  <N rules flagged, all fixed>
  <rule-driven improvement suggestions - NOT applied, surfaced for your review>
  <bonus code bugs found - NOT applied, surfaced for your review>

Backup: .claude/_backups/pre-curate-<date>.tgz
Log:    .claude/_curation_log_<date>.md

Next: merge branch when ready, OR run /project-curate again on a different project.
```

## What NOT to do

- **Never** `rm -rf` any .claude/ content. Always archive to `_archive_noise_<date>/`.
- **Never** overwrite hand-authored files without explicit approval. If in doubt, append or create a new file.
- **Never** skip grep-verify on generated rule references. ~50% drift rate is not theoretical - it's measured.
- **Never** skip the verifier pane. Both pilots caught real issues that would have shipped.
- **Never** write more than 3-4 project-specific rules in one pass. If signals call for more, either split into multiple curation passes or consolidate.
- **Never** copy `rules/common/*` from ECC - user's own globals win.
- **Never** mass-install ECC skills/agents. Cherry-pick by explicit user approval only.
- **Never** run `wiki-absorb` when MemoryMaster has <10 claims for the scope - it's noise.

## Known limitations

- **`spawn_session` is flaky** - can attach to an existing same-project pane (mixed conversation context - pilots #1, #2) OR spawn a plain bash shell with a `-claude` typo instead of Claude (pilot #3 pane 32). Always `discover_sessions` first and reuse an idle Claude pane when one exists. After spawning, VALIDATE by reading output ~15s later: if you see `bash: command not found` or prompt-text-as-shell-commands, kill the pane and fall back to coordinator self-verify.
- **Never leave broken panes running.** If `spawn_session` produces a bash shell instead of Claude, call `mcp__wezbridge__kill_session(pane_id)` - don't just send Ctrl+C and move on.
- Monitor cannot call wezbridge MCP from shell. Heartbeats + manual poll is the pattern.
- Semantic graphify on heavy-docs projects costs real money; trust graphify's internal 2M-words / 200-files gate.
- Pre-existing `.claude/` layouts vary wildly (pilot #1 had 52 noise dirs from mass-install; pilots #2 and #3 were clean). Detection patterns above will need tuning as more projects are curated.
- **Drift rate ~50% per pilot even with grep-verify discipline.** Plan for at least one `fix(claude-rules):` follow-up commit. Grep catches structural drift (wrong identifier, wrong path); verifier-or-coordinator-self-verify catches semantic drift (right name, wrong behavior claim).

## Coordinator vs delegation heuristic

When should the coordinator do a task itself vs spawn/delegate to a peer pane-

| Task shape | Default |
|---|---|
| Mechanical - grep, ls, line-number check, git add+commit, tar backup | **Coordinator does it.** Delegation is pure overhead. |
| Requires fresh Claude context (e.g., `/memory` tool, clean conversation) | Spawn/reuse a peer pane. |
| Requires domain knowledge the peer has and the coordinator doesn't | Delegate to the peer. |
| Requires approval or decision from the user | Never delegate - report and wait. |
| Cleanup on a repo where a peer pane already has its WIP context | Try reusing idle peer first; coordinator does it if peer is busy. |

Pilot #3 anti-pattern: coordinator spawned pane 32 for verification while idle pane 30 already existed for the same project. Always `discover_sessions` first.

## Reference implementations

- Pilot #1: `G:\_OneDrive\OneDrive\Desktop\Py Apps\elbraserito\.claude\` - TS/React/Supabase/MP, 14 rules, 52 noise dirs archived.
- Pilot #2: `G:\_OneDrive\OneDrive\Desktop\Py Apps\memorymaster\.claude\` - Python/SQLite/MCP, 9 rules, 0 noise, branch workflow (commit-guard).
- Pilot #3: `G:\_OneDrive\OneDrive\Desktop\Py Apps\gimnasio\gimnasio-next\.claude\` - Next.js/TS/Drizzle/Auth.js, 13 rules, 0 noise, 2-branch workflow (repo-cleanup branch + curation branch), verifier-pane spawn failed -> coordinator-self-verify.
- All three have `_curation_log_2026-04-18.md` documenting the full flow for reference.

## When to evolve this skill

Amend this SKILL.md after each project curation if:
- A new preflight layer proves valuable (e.g., repomix turns out to help in some case)
- A new ECC dir becomes useful (e.g., first project needing `rules/rust/` - verify its frontmatter situation)
- A new class of drift emerges (beyond invented function names / invented enum values / missed refactors)
- A new gotcha with wezbridge / Monitor / spawn_session surfaces

Amendments ship as `chore(skill): project-curate <what changed>` commits to `~/.claude/skills/project-curate/`.
---

## Codex Port Notes

- Audit mode is read-only for product code unless the user explicitly requests remediation.
- Treat `.claude/`, `.codex/`, `.agents/`, `.gitnexus/`, caches, `node_modules/`, virtualenvs, and generated build outputs as tooling or generated scope unless the finding is specifically repo hygiene.
- Prefer PowerShell equivalents on Windows; use `rg` before `grep` and `Get-ChildItem` before Unix `find` when running in PowerShell.
- If GitNexus MCP tools are unavailable, use `.gitnexus/meta.json`, `.gitnexus/` artifacts, and `npx gitnexus` CLI as the fallback.
- Findings should also be representable as: `{id, domain, severity, exploitability, evidence_path, evidence_line, summary, impact, recommended_fix, verification}`.
