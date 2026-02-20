---
name: validation
description: Use when implementation is complete and needs comprehensive UI and flow validation with evidence-based reporting.
---

# Validation Skill

Comprehensive app validation with REAL verification - discovers all interactive elements, tests them with actual verification, and generates HTML reports.

## Invocation

```
/validate [app-url]
```

If no URL provided, looks for running dev server or asks user.

---

## Core Principles

**LLMs don't naturally test like humans.** This skill enforces:

1. **PRE-FLIGHT first** - Verify environment before any testing
2. **DISCOVER everything** - Find EVERY button on every page
3. **ANALYZE context** - Determine what each button SHOULD do
4. **VERIFY actions** - Confirm the action actually happened (with evidence)
5. **ANALYZE screenshots** - Look for UI issues, not just take pictures
6. **Test critical flows** - Validate key user journeys, not just elements
7. **Persist state** - Resume across sessions without losing progress
8. **Clean up** - Remove VAL_* test artifacts after testing
9. **Report with evidence** - Every verdict needs proof

---

## Phase Architecture

This skill has 3 phases, each in a separate file:

| Phase | File | Purpose |
|-------|------|---------|
| DISCOVER | `phases/DISCOVER.md` | Find all testable elements |
| TEST | `phases/TEST.md` | Execute tests with verification |
| REPORT | `phases/REPORT.md` | Generate HTML report |

**Load phases using Read tool** - only load what's needed for current phase.

---

## State Management

**State file:** `{project}/test-manifest/validation-state.json`

### State Schema

```json
{
  "session": {
    "id": "uuid",
    "startedAt": "ISO timestamp",
    "lastUpdatedAt": "ISO timestamp",
    "status": "in_progress|completed",
    "currentPhase": "discover|test|cleanup|report",
    "appUrl": "http://localhost:XXXX",
    "contextResets": 0
  },
  "preflight": {
    "passed": true,
    "serverStatus": "responding|failed",
    "loadTime": 1.2,
    "consoleErrors": 0,
    "consoleWarnings": 0,
    "authRequired": false
  },
  "discovery": {
    "completedAt": null,
    "routes": [],
    "elements": [],
    "criticalFlows": []
  },
  "testing": {
    "currentIndex": 0,
    "results": {},
    "pending": [],
    "failed": [],
    "quarantined": []
  },
  "cleanup": {
    "completed": false,
    "itemsFound": 0,
    "itemsDeleted": 0,
    "itemsFailed": 0,
    "failedItems": []
  },
  "summary": {
    "totalElements": 0,
    "totalFlows": 0,
    "tested": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "flowsPassed": 0,
    "flowsFailed": 0,
    "uiIssues": 0,
    "consoleErrors": 0
  }
}
```

### State Update Rule

**After EVERY element test:**
1. Read state file
2. Add result to `testing.results`
3. Remove from `testing.pending`
4. Update `summary` counts
5. Update `lastUpdatedAt`
6. Write state file

**This ensures zero progress loss on context overflow.**

---

## Orchestrator Flow

### Step 1: Check for Existing State

```
Read: {project}/test-manifest/validation-state.json
```

**If file NOT exists:**
- Create state with `currentPhase: "discover"`
- Read and execute `phases/DISCOVER.md`

**If file exists AND status = "in_progress":**
- Check `currentPhase` value
- If "discover" with discovery incomplete â†’ Continue discovery
- If "test" with pending items â†’ Continue testing
- If "test" with no pending items â†’ Move to report
- If "report" â†’ Generate report

**If file exists AND status = "completed":**
- If `--fresh` flag provided: delete state, start fresh
- Else: show previous results summary

### Step 2: Load Phase File

Based on `currentPhase`, read the appropriate phase file:

```
phases/DISCOVER.md  â†’ Discovery phase
phases/TEST.md      â†’ Testing phase
phases/REPORT.md    â†’ Report generation
```

### Step 3: Execute Phase

Follow loaded phase instructions completely.

### Step 4: Resume Check

When resuming from existing state:

```
=== RESUMING VALIDATION ===

Session: {session.id}
Started: {session.startedAt}
Context resets: {contextResets}

Progress: {tested}/{totalElements} elements
Completion: {percentage}%

Continuing from {currentPhase} phase...
```

Increment `contextResets`, save state, then continue.

---

## Directory Structure

Created by this skill:

```
{project}/
  test-manifest/
    validation-state.json      # Persistent state
    screenshots/
      routes/                  # Route screenshots by breakpoint
      elements/                # Element interaction screenshots
    reports/
      validation-YYYY-MM-DD.html
```

---

## Browser Tools (MCP Chrome Extension)

**This skill uses MCP browser tools via the Claude-in-Chrome extension.** Claude calls these tools directly - no scripts needed.

### MCP Tools Reference

| Action | MCP Tool |
|--------|----------|
| **Navigate** | `mcp__claude-in-chrome__navigate url="{url}"` |
| **Get page state** | `mcp__claude-in-chrome__read_page` |
| **Click element** | `mcp__claude-in-chrome__click ref="{ref}"` |
| **Fill form** | `mcp__claude-in-chrome__form_input ref="{ref}" value="{value}"` |
| **Resize viewport** | `mcp__claude-in-chrome__resize_window width={w} height={h}` |
| **Take screenshot** | `mcp__claude-in-chrome__computer action="screenshot"` |
| **Read console** | `mcp__claude-in-chrome__read_console_messages` |

### How MCP Tools Work

1. **Direct tool calls** - Claude calls MCP tools directly, no scripts needed
2. **Accessibility tree** - `read_page` returns element refs for clicking
3. **Visual analysis** - Claude sees screenshots directly and analyzes them
4. **Console access** - `read_console_messages` returns actual error/warning text

### Typical Test Sequence

```
1. mcp__claude-in-chrome__navigate url="{appUrl}"
2. mcp__claude-in-chrome__read_page                    â†’ Get element refs
3. mcp__claude-in-chrome__resize_window width=375      â†’ Set viewport
4. mcp__claude-in-chrome__computer action="screenshot" â†’ Take screenshot
5. ANALYZE the screenshot (Claude sees the image)
6. mcp__claude-in-chrome__click ref="ref_5"            â†’ Click button
7. mcp__claude-in-chrome__read_page                    â†’ Verify outcome
8. mcp__claude-in-chrome__read_console_messages        â†’ Check for errors
```

### Screenshot Handling

**Screenshots are captured and analyzed in real-time by Claude:**

- Claude sees screenshots directly when `mcp__claude-in-chrome__computer action="screenshot"` is called
- Claude MUST analyze each screenshot immediately (not just note it was taken)
- Screenshot analysis is recorded in the state for the report

### Breakpoints (4 Required)

| Breakpoint | Width | Height |
|------------|-------|--------|
| Mobile | 375 | 812 |
| Tablet | 768 | 1024 |
| Laptop | 1024 | 768 |
| Desktop | 1440 | 900 |

---

## Anti-Laziness Rules (CRITICAL)

These rules are embedded in each phase but repeated here for emphasis:

### Screenshots MUST be ANALYZED

```
WRONG: "Screenshot taken successfully"
RIGHT: "Screenshot analysis:
  - Header: Visible, properly aligned
  - Navigation: All items visible, no overflow
  - Main content: Cards display correctly
  - Mobile (375px): Menu collapses to hamburger
  - Issue: Footer text cut off at 375px"
```

### Button Actions MUST be VERIFIED

```
WRONG: "Clicked delete button successfully"
RIGHT: "Delete button clicked:
  - Confirmation modal appeared: YES
  - Confirmed deletion
  - Item 'Test Customer 12345' removed from list: VERIFIED
  - List count changed from 5 to 4: VERIFIED"
```

### Console Errors MUST be READ

```
WRONG: "No console errors"
RIGHT: "Console check:
  - Errors: 0
  - Warnings: 2 (React key warning, deprecation notice)
  - Actual messages: [list them]"
```

---

## Quick Reference

### Starting Fresh

```
1. Check if state exists
2. If yes with --fresh flag, delete it
3. Create test-manifest directory
4. Load DISCOVER.md phase
5. Execute discovery
6. Save state with all found elements
7. Load TEST.md phase
8. Test each element with verification
9. Save state after EACH element
10. When all tested, load REPORT.md
11. Generate HTML report
12. Mark status = "completed"
```

### Resuming

```
1. Read existing state
2. Identify current phase
3. Load appropriate phase file
4. Continue from where left off
5. State already has progress - use it
```

---

## Output Format

When complete:

```
=== VALIDATION COMPLETE ===

PRE-FLIGHT: PASSED
  Server: responding (1.2s)
  Console: 0 errors, 2 warnings

Summary:
- Routes tested: X
- Elements tested: Y
- Critical flows: Z
- Passed: A
- Failed: B
- UI Issues: C
- Console Errors: D

Cleanup:
- Items found: N
- Items deleted: N
- Items failed: 0

Report: test-manifest/reports/validation-YYYY-MM-DD.html

Top Issues:
1. [Issue description with evidence]
2. [Issue description with evidence]
3. [Issue description with evidence]
```

---

## Files in This Skill

| File | Lines | Purpose |
|------|-------|---------|
| SKILL.md | ~350 | This file - orchestrator |
| phases/DISCOVER.md | ~300 | PRE-FLIGHT + element discovery + critical flows |
| phases/TEST.md | ~650 | Testing with verification reports + cleanup |
| phases/REPORT.md | ~280 | HTML report generation |
| templates/report.html | ~460 | Report template |

**Total:** ~2040 lines across 5 files

**Context per phase:** ~700-1000 lines max (orchestrator + one phase)

