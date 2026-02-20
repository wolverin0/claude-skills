---
name: debug-resolve
description: Use when debugging a bug or incident and you need a strict end-to-end investigation loop from reproduction to verified fix.
---

# Debug & Resolve â€” Don't Stop Until Green

Systematic debugging skill that enforces resolution. Use when debugging a bug or investigating an issue.

## Rules
1. **NEVER stop mid-investigation.** Complete the full debug loop or explicitly document blockers.
2. **NEVER guess.** Read logs and code before proposing fixes.
3. **NEVER retry the same approach.** If it failed twice, try something different.

## Debug Loop

### Step 1: Gather Context
- Read the error message / bug report carefully
- Identify which service is affected (check project CLAUDE.md)
- Read relevant source files (entry point â†’ error location)
- Check logs: server logs, browser console, Supabase logs, Docker logs

### Step 2: Reproduce
- Confirm the bug exists with a concrete test or verification
- If you can't reproduce, gather more context before proceeding
- Write a failing test if possible (this becomes your regression test)

### Step 3: Isolate Root Cause
- Trace the data flow from input to error
- Add temporary logging if needed (remove after)
- Check recent changes: `git log --oneline -10`, `git diff HEAD~3`
- For Supabase: check RLS policies, auth state, table permissions
- For Docker: check if container has latest code (`docker exec cat /app/file.js`)

### Step 4: Fix
- Make the minimal change that fixes the root cause
- Don't refactor surrounding code
- Don't fix other unrelated issues you noticed

### Step 5: Verify (MANDATORY)
```bash
# Run the failing test â€” it should now pass
npm test / pytest / cargo test

# Build check
npm run build / npx tsc --noEmit

# If deployed: verify with curl
curl -s <endpoint> | head -c 200
```

### Step 6: Confirm Resolution
- The original error no longer occurs
- No new errors introduced
- Tests pass
- Build succeeds

If verification fails, go back to Step 3. Do NOT mark as resolved.

## Output Format
```
BUG: <description>
ROOT CAUSE: <what was actually wrong>
FIX: <what was changed and why>
FILES: <list of modified files>
VERIFICATION:
  - Test: PASS/FAIL
  - Build: PASS/FAIL
  - Manual check: PASS/FAIL
STATUS: RESOLVED / BLOCKED (reason)
```

