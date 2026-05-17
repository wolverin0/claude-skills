---
name: handoff
description: Write a structured session handoff before ending, clearing context, or transferring work to another agent or pane.
metadata:
  argument-hint: "[focus-instruction]"
  disable-model-invocation: false
---

# /handoff - Intelligent Session Handoff

Write a comprehensive, structured handoff document so the NEXT session (or a clean restart of THIS session after /clear) can pick up with ZERO context loss on what matters.

**Output file**: `handoffs/handoff-<ISO-timestamp>-<short-id>.md` relative to your current working directory. Create the `handoffs/` directory if it doesn't exist. **NEVER overwrite** an existing handoff file - always generate a unique filename.

**If `$ARGUMENTS` is provided**, treat it as a focus instruction (e.g., "focus on the auth refactor, skip the test debugging"). Prioritize that area in your handoff.

## Mandatory Sections

Fill ALL of these. If a section is genuinely empty, write "None" - do NOT skip the heading.

### 1. `## Context`
What was this session about- One paragraph, high-level. Include:
- The project name and what it does (1 sentence)
- What task/feature/bug you were working on
- Who requested it and why (if known)

### 2. `## Current State`
Concrete, verifiable state of the codebase RIGHT NOW:
- Files modified (list paths, not just "some files")
- Commits made in this session (short SHAs + messages)
- Uncommitted changes: yes/no (run `git status --short` if unsure)
- Build status: passing/failing (run the build if unsure)
- Tests: passing/failing/not-run
- Dev server: running on port X / not running
- Any processes you started that are still alive

### 3. `## Open Threads`
Work that is IN PROGRESS but NOT yet reflected in committed files:
- Partially implemented features (what's done, what's not)
- Debugging hypotheses you were testing
- Decisions you were mid-way through making
- Things you told the user you'd do but haven't started

**This is the most critical section.** The next session won't know about these unless you write them down. Be specific - "I was refactoring X" is useless; "I extracted function Y from file Z into module W, the import in Z is updated but 3 callers in A, B, C still reference the old location" is useful.

### 4. `## Next Steps`
Exactly what to do FIRST in the new session, ordered by priority:
1. Step 1 (most urgent / blocking)
2. Step 2
3. Step 3
- Include the exact commands to run if applicable
- Include file paths to read first

### 5. `## Constraints & Gotchas`
Anything learned during this session that shouldn't be re-discovered:
- Approaches that FAILED and why (so the next session doesn't retry them)
- Non-obvious requirements or edge cases found
- Environment quirks (Windows-specific, port conflicts, etc.)
- Rate limits, API quotas, or timing issues encountered

### 6. `## Relevant Files`
Absolute paths to the files the next session should read FIRST:
```
/full/path/to/critical-file-1.ts
/full/path/to/critical-file-2.cjs
```
Don't make the next session grep - give it the exact paths.

### 7. `## Corr ID`
If a correlation ID was provided (e.g., `corr=handoff-abc123`), include it here for tracking. If none was provided, generate one: `handoff-` + 6 random alphanumeric characters.

## Rules

1. **NEVER include credentials, API keys, tokens, private IPs, or personal filesystem paths** (like `C:\Users\username\...`) in the handoff file. Use relative paths or `$HOME`-based references.
2. **Be concrete, not abstract.** "Made progress on the feature" is USELESS. "Added `parseStatusBar()` to `src/status-parser.cjs`, imported in `pane-discovery.cjs:12`, exposed `ctx` field in `collectPanes()` at `dashboard-server.cjs:85`" is USEFUL.
3. **Verify before writing.** Run `git status`, check the build, check if your dev server is alive. Don't guess - report facts.
4. **The handoff file IS the contract.** The next session will read ONLY this file to understand what happened. If it's not in the file, it didn't happen.
5. **After writing the file, STOP.** Do not continue with other work. The handoff file is the last action of this session.
