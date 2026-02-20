# Skill Auto-Healing Module

A reusable module that enables ANY skill to automatically evaluate its own execution, learn from mistakes, and improve over time through evidence-based retrospectives.

---

## Overview

**Problem:** LLMs execute skills but don't naturally reflect on their performance or learn from session context.

**Solution:** This module provides a standardized framework for:
1. Capturing the trigger context (what started this skill)
2. Tracking execution through session transcripts
3. Self-evaluating performance with evidence
4. Generating actionable improvements

**How to Use:** Include this module in any skill by adding to the skill's phases:
- At START: Include "Part 1: Trigger Capture" section
- At END: Include "Part 3: Retrospective" section

---

## Prerequisites: Finding Session Transcripts

Claude Code stores session transcripts as `.jsonl` files. The location varies by OS:

| OS | Session Transcript Location |
|----|----------------------------|
| Windows | `~\.claude\projects\{project-slug}\*.jsonl` |
| macOS | `~/.claude/projects/{project-slug}/*.jsonl` |
| Linux/WSL | `~/.claude/projects/{project-slug}/*.jsonl` |

**Project Slug:** Derived from your working directory path with special characters replaced (e.g., `/home/user/my-project` → `home-user-my-project`).

### Discovering Your Session Path

At runtime, determine the session path dynamically:

```bash
# Find .claude projects directory
CLAUDE_PROJECTS="$HOME/.claude/projects"

# List available project folders
ls "$CLAUDE_PROJECTS"

# Find session files in current project (most recent first)
ls -t "$CLAUDE_PROJECTS/{project-slug}"/*.jsonl | head -5
```

For Windows (PowerShell):
```powershell
$ClaudeProjects = "$env:USERPROFILE\.claude\projects"
Get-ChildItem "$ClaudeProjects\{project-slug}\*.jsonl" | Sort-Object LastWriteTime -Descending | Select -First 5
```

---

## Part 1: Trigger Capture (Add to Skill START)

### Purpose
Identify and document what triggered this skill invocation so we can evaluate if we met the user's intent.

### Implementation

Add this to your skill's first phase:

```markdown
## 🎯 TRIGGER CAPTURE (Required)

Before starting work, identify the trigger context from the session transcript.

### Step 1: Locate Session File

Find the Claude projects directory and current session:

**Cross-platform approach:**
\```
Glob: pattern="*.jsonl" path="{claude_projects_dir}/{project_slug}"
\```

Select the most recently modified `.jsonl` file (this is the current session).

### Step 2: Check File Size

\```bash
# Linux/macOS/WSL
ls -lh "{session_file_path}"

# Or get size in bytes
stat --format=%s "{session_file}" 2>/dev/null || stat -f%z "{session_file}" 2>/dev/null || wc -c < "{session_file}"
\```

\```powershell
# Windows PowerShell
(Get-Item "{session_file_path}").Length
\```

### Step 3: Extract Trigger (Size-Aware)

| File Size | Method |
|-----------|--------|
| < 256KB | Read entire file, search for skill invocation |
| > 256KB | Use Grep to find skill name, then Read specific lines |

**For SMALL files (< 256KB):**
\```
Read: file_path="{session_file}"
\```

**For LARGE files (> 256KB):**
\```
Grep: pattern="{skill_name}" path="{session_file}" output_mode="content" -n=true
\```
Then read the specific line range around the trigger:
\```
Read: file_path="{session_file}" offset={found_line - 5} limit=15
\```

### Step 4: Document Trigger Context

\```
TRIGGER CONTEXT:
- Session ID: {extracted_session_id}
- Session File: {filename}
- Trigger Line: ~{line_number}
- Timestamp: {timestamp}
- User Request: "{exact_user_message}"
- Apparent Intent: {what_user_wants_to_achieve}
- Success Criteria: {how_we_know_we_succeeded}
\```

**Store this information - it's required for the retrospective.**
```

---

## Part 2: Execution Tracking (During Skill Execution)

### Purpose
Track key actions during execution so we can evaluate them later.

### Implementation

Encourage the skill to use TodoWrite for tracking:

```markdown
## 📊 EXECUTION TRACKING

Use TodoWrite to track each major action:
- Mark items `in_progress` when starting
- Mark items `completed` immediately when done
- Add new items if scope changes

This creates an audit trail in the session transcript.
```

---

## Part 3: Retrospective (Add to Skill END)

### Purpose
Evaluate execution against the original trigger, identify improvements, and document lessons.

### Implementation

Add this as your skill's final phase:

```markdown
## 🔄 RETROSPECTIVE (Required)

Before completing, perform an evidence-based self-evaluation.

### Step 1: Check Session File Size

\```bash
# Linux/macOS/WSL
ls -lh "{session_file}"

# Windows PowerShell
(Get-Item "{session_file}").Length
\```

### Step 2: Read Execution Evidence (Size-Aware)

| File Size | Method |
|-----------|--------|
| < 256KB | Read entire file |
| > 256KB | Grep for tool calls, then Read specific lines |

**For LARGE files, search for your actions:**
\```
Grep: pattern="tool_use|TodoWrite|{skill_specific_tools}" path="{session_file}" -n=true
\```

Then read around key action lines:
\```
Read: file_path="{session_file}" offset={action_line - 2} limit=5
\```

### Step 3: Compare Intent vs. Outcome

Review the TRIGGER CONTEXT from Part 1:
- **User Request:** {what they asked for}
- **Success Criteria:** {how we defined success}

Now evaluate:
- Did the outcome match the intent?
- Were all success criteria met?
- Were there any deviations?

### Step 4: Self-Assessment Checklist

| Question | Evidence Required | Result |
|----------|-------------------|--------|
| Did I understand the request correctly? | Quote trigger message | ✅/❌ |
| Did I follow the skill's prescribed steps? | List phases executed | ✅/❌ |
| Did I complete all required actions? | TodoWrite completion | ✅/❌ |
| Were there any errors or failures? | Console/tool errors | ✅/❌ |
| Did the user have to correct me? | Quote corrections | ✅/❌ |
| Did I meet the success criteria? | Evidence of outcome | ✅/❌ |

### Step 5: Generate Retrospective Output

\```
=== RETROSPECTIVE (Evidence-Based) ===

**Session:** {session_id}
**Skill:** {skill_name}
**Trigger:** "{user_message}" (line ~{N})

**INTENT vs OUTCOME:**
- User wanted: {summarize request}
- We delivered: {summarize outcome}
- Match: ✅ Full / ⚠️ Partial / ❌ Mismatch

**EXECUTION SUMMARY:**
- Phases completed: {list}
- Tools used: {list with line numbers}
- Time span: {start_timestamp} → {end_timestamp}

**WHAT WENT WELL:**
- {positive} - Evidence: (line ~{N})

**WHAT COULD BE IMPROVED:**
- {issue} - Evidence: (line ~{N})
- Suggestion: {concrete improvement}

**USER CORRECTIONS:**
- "{correction}" (line ~{N})
- Lesson: {what to do differently}

**RECOMMENDATIONS FOR SKILL:**
1. {actionable improvement to skill itself}
2. {pattern to add/avoid}
\```

### Step 6: Validate Retrospective Completeness

Before finishing, verify:
- [ ] I read the actual session transcript (not just in-context memory)
- [ ] I cited specific line numbers from transcript
- [ ] I compared intent vs outcome explicitly
- [ ] I identified at least one improvement
- [ ] If user corrected me, I documented the lesson
```

---

## Part 4: Integration Guide

### How to Add Auto-Healing to Any Skill

**Option A: Reference This Module**

Add to your skill's header:
```markdown
## Dependencies
This skill uses the Auto-Healing module for self-evaluation.
See: `skill-auto-healing.md`

At skill START: Follow "Part 1: Trigger Capture"
At skill END: Follow "Part 3: Retrospective"
```

**Option B: Embed Directly**

Copy the relevant sections into your skill file:
1. Copy "Trigger Capture" to your first phase
2. Copy "Retrospective" to your final phase
3. Adapt tool patterns for your skill's specific tools

### Skill-Specific Customization

When embedding, customize these elements:

| Element | Customize To |
|---------|--------------|
| `{skill_name}` | Your skill's name (e.g., "code-review", "test-runner") |
| `{skill_specific_tools}` | Tools your skill uses (e.g., "browser_navigate\|browser_click") |
| `{project_slug}` | Your project's slug in `.claude/projects/` |
| Success Criteria | Define what success means for your skill |
| Self-Assessment Questions | Add skill-specific questions |

---

## Part 5: File Size Handling Reference

### Why This Matters

Claude Code session transcripts can grow very large (50MB+). The Read tool has a 256KB limit. Attempting to read large files directly will fail.

### Decision Matrix

```
┌─────────────────────────────────────────────────────────┐
│                   SESSION FILE SIZE                      │
├─────────────────┬───────────────────────────────────────┤
│   < 256 KB      │            > 256 KB                   │
├─────────────────┼───────────────────────────────────────┤
│                 │                                       │
│  Read directly  │  1. Grep for patterns                 │
│                 │  2. Note line numbers                 │
│                 │  3. Read specific line ranges         │
│                 │                                       │
└─────────────────┴───────────────────────────────────────┘
```

### Grep Patterns for Common Scenarios

| Looking For | Grep Pattern |
|-------------|--------------|
| Skill invocation | `{skill_name}` |
| Tool calls | `tool_use` |
| User messages | `"type":"user"` |
| Assistant responses | `"type":"assistant"` |
| Errors | `error\|Error\|ERROR` |
| Playwright tools | `mcp__playwright\|browser_` |
| File operations | `Read\|Write\|Edit` |
| TodoWrite updates | `TodoWrite` |
| Bash commands | `"name":"Bash"` |

### Reading Specific Lines

After Grep returns line numbers:
```
Read: file_path="{session_file}" offset={line - 5} limit=10
```

This reads 5 lines before and 5 lines after the match, providing context.

---

## Part 6: Common Patterns & Anti-Patterns

### ✅ DO: Evidence-Based Claims

```
GOOD: "I navigated to /settings (line ~1234) and took a screenshot (line ~1240)"
BAD:  "I navigated to /settings and took a screenshot"
```

### ✅ DO: Compare Intent vs Outcome

```
GOOD: "User asked for bug fixes. I fixed 6 bugs. All 6 verified working."
BAD:  "Task completed successfully."
```

### ✅ DO: Document Corrections

```
GOOD: "User corrected me at line ~500: 'use /validation not /feature-validation'.
       Lesson: Read skill name more carefully."
BAD:  (ignoring corrections)
```

### ❌ DON'T: Skip Transcript Reading

```
BAD: "Based on my recollection of the session..."
BAD: "I remember doing X, Y, Z..."
```

### ❌ DON'T: Generic Retrospectives

```
BAD: "Everything went well. No improvements needed."
```

### ❌ DON'T: Ignore File Size

```
BAD: Read: file_path="{large_session_file}"  # Will fail if > 256KB!
```

### ❌ DON'T: Hardcode Paths

```
BAD: path="C:\Users\specific-user\.claude\projects\..."
GOOD: path="{claude_projects_dir}/{project_slug}"
```

---

## Part 7: Retrospective Templates

### Template A: Quick Retrospective (< 5 actions)

```
=== QUICK RETROSPECTIVE ===
Session: {id} | Skill: {name}
Trigger: "{message}" (line ~{N})
Outcome: {1-sentence summary}
Match: ✅/⚠️/❌
Key Learning: {1 thing to remember}
```

### Template B: Standard Retrospective (5-15 actions)

```
=== RETROSPECTIVE ===
Session: {id}
Skill: {name}
Trigger: "{message}" (line ~{N})

Intent: {what user wanted}
Outcome: {what was delivered}
Match: ✅ Full / ⚠️ Partial / ❌ Mismatch

Actions: {count} | Errors: {count} | Corrections: {count}

Improvements:
1. {improvement with evidence}

Lesson: {key takeaway}
```

### Template C: Full Retrospective (> 15 actions or complex skill)

Use the complete template from Part 3, Step 5.

---

## Part 8: Skill Improvement Loop

### How Auto-Healing Improves Skills Over Time

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. SKILL EXECUTES                                     │
│      ↓                                                  │
│   2. RETROSPECTIVE IDENTIFIES IMPROVEMENTS              │
│      ↓                                                  │
│   3. USER REVIEWS SUGGESTIONS                           │
│      ↓                                                  │
│   4. SKILL FILE UPDATED (if approved)                   │
│      ↓                                                  │
│   5. NEXT EXECUTION BENEFITS                            │
│      ↓                                                  │
│   (repeat)                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Capturing Improvements

When the retrospective suggests skill improvements:

1. **Document in retrospective output** - "RECOMMENDATIONS FOR SKILL" section
2. **User reviews** - Decides if improvement is valid
3. **Update skill file** - Add to instructions, common mistakes, or red flags
4. **Test on next run** - Verify improvement helps

---

## Part 9: Cross-Platform Path Resolution

### Dynamic Path Discovery

Instead of hardcoding paths, skills should discover them at runtime:

```markdown
### Discovering Claude Projects Directory

**Step 1: Find home directory**
- Linux/macOS/WSL: `$HOME` or `~`
- Windows CMD: `%USERPROFILE%`
- Windows PowerShell: `$env:USERPROFILE`

**Step 2: Construct projects path**
- Unix-like: `$HOME/.claude/projects/`
- Windows: `%USERPROFILE%\.claude\projects\`

**Step 3: Identify project slug**
The project slug is derived from the working directory.
Use Glob to list available projects:
\```
Glob: pattern="*" path="~/.claude/projects/"
\```

**Step 4: Find current session**
\```
Glob: pattern="*.jsonl" path="~/.claude/projects/{project_slug}"
\```
Select the most recently modified file.
```

### Path Examples by OS

| OS | Home | Projects Dir | Example Session |
|----|------|--------------|-----------------|
| Linux | `/home/user` | `/home/user/.claude/projects/` | `my-project/abc123.jsonl` |
| macOS | `/Users/user` | `/Users/user/.claude/projects/` | `my-project/abc123.jsonl` |
| WSL | `/home/user` | `/home/user/.claude/projects/` | `my-project/abc123.jsonl` |
| Windows | `C:\Users\user` | `C:\Users\user\.claude\projects\` | `my-project\abc123.jsonl` |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│           SKILL AUTO-HEALING QUICK REFERENCE            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AT START:                                              │
│  1. Glob → find session .jsonl in ~/.claude/projects/   │
│  2. Check size (ls -lh or stat)                         │
│  3. Read or Grep+Read based on size                     │
│  4. Find skill invocation line                          │
│  5. Document TRIGGER CONTEXT                            │
│                                                         │
│  DURING:                                                │
│  - Use TodoWrite to track actions                       │
│  - Note any errors or corrections                       │
│                                                         │
│  AT END:                                                │
│  1. Check file size again                               │
│  2. Read or Grep+Read execution evidence                │
│  3. Compare intent vs outcome                           │
│  4. Answer self-assessment questions                    │
│  5. Generate retrospective with line citations          │
│  6. Validate completeness checklist                     │
│                                                         │
│  KEY RULES:                                             │
│  - Always cite line numbers                             │
│  - Never skip transcript reading                        │
│  - Always identify at least 1 improvement               │
│  - Document all user corrections                        │
│  - Use dynamic paths, never hardcode                    │
│                                                         │
│  FILE SIZE DECISION:                                    │
│  - < 256KB → Read directly                              │
│  - > 256KB → Grep first, then Read specific lines       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Part 10: Concrete Integration Example

### ⚠️ WARNING: LLM Behavior Pattern

**When you ask Claude to integrate auto-healing into your skill, it will likely:**
- ❌ Completely rewrite your skill from scratch
- ❌ Remove existing phases and content
- ❌ Change your skill's structure
- ❌ Create new files you didn't ask for

**What it SHOULD do instead:**
- ✅ Keep ALL existing content unchanged
- ✅ Add trigger capture BEFORE first phase
- ✅ Add retrospective AFTER last phase
- ✅ Update state schema to include trigger/retrospective fields
- ✅ Preserve all existing phase files and logic

### Preventing Rewrites

**In your prompt, explicitly state:**
```
"Backup my SKILL.md with timestamp, then apply skill-auto-healing.md to it.

CRITICAL REQUIREMENTS:
- Create backup: SKILL.md.backup-{timestamp}
- Modify SKILL.md directly (no skill-test.md)
- DO NOT rewrite existing content
- DO NOT change existing phases
- ONLY add Phase 1 trigger capture (before current Phase 1)
- ONLY add final phase retrospective (after current last phase)
- Renumber all phases correctly
- Line count should increase by ~40-60% (NOT double or triple)

Use feature-validation/SKILL.md as reference for what sections to add."
```

### Before/After Example: Feature Validation

This shows the ACTUAL integration that was done to feature-validation skill.

**BEFORE: SKILL.md.bak (353 lines, 9 phases)**
```markdown
# Feature Validation

## Overview

**Feature validation is REAL testing, not documentation screenshots.**

## The Validation Workflow

digraph validation_flow {
    report [label="9. Generate HTML Report\n(save to /test/phase-X/)"];
    report -> done;
}

## Phase 1: Analyze Implementation

**Determine what was implemented:**

```bash
git diff --name-only HEAD~5
```

**Categorize changes:**
- UI Components - Need visual validation
- CRUD Operations - Need full cycle tests
...

## Phase 2: Plan Test Scenarios
## Phase 3: Ensure Dev Server Running
## Phase 4: Navigate to Feature
## Phase 5: Check Console Errors
## Phase 6: Interact & Test
## Phase 7: CRUD Testing (If Applicable)
## Phase 8: Screenshot Evidence
## Phase 9: Generate HTML Report

## Common Mistakes
## Red Flags - STOP and Fix
## Checklist
```

**AFTER: SKILL.md (528 lines, 10 phases - +175 lines, +49%)**
```markdown
# Feature Validation

## 🚨 CRITICAL BLOCKERS - READ FIRST                    // ← ADDED

**This skill has TWO mandatory file reads that CANNOT be skipped:**

1. **Phase 1 BLOCKER:** You MUST read the session transcript...
2. **Phase 10 BLOCKER:** You MUST re-read the session transcript...

## Overview

**Feature validation is REAL testing, not documentation screenshots.**

## The Validation Workflow

digraph validation_flow {
    report [label="9. Generate HTML Report\n(save to /test/phase-X/)"];
    retro [label="10. Retrospective\n(Self-assessment & Learning)"];   // ← ADDED
    report -> retro;                                                     // ← CHANGED
    retro -> done;                                                       // ← ADDED
}

## Phase 1: Analyze Implementation

**Determine what was implemented:**

```bash
git diff --name-only HEAD~5
```

**🚨 MANDATORY: Identify Trigger Context from Session Transcript**     // ← ADDED ENTIRE SECTION

You MUST read the actual session transcript file...

**Step 1: Find the current session file**
**Step 2: Check file size FIRST**
**Step 3: Choose the right tool based on file size**
**Step 4: Find the trigger message**
**Step 5: Document the trigger**

**Store this information - you WILL need it in Phase 10.**              // ← END ADDED SECTION

**Categorize changes:**
- UI Components - Need visual validation
...

## Phase 2: Plan Test Scenarios                                         // ← RENUMBERED (was Phase 2)
## Phase 3: Ensure Dev Server Running                                   // ← RENUMBERED (was Phase 3)
## Phase 4: Navigate to Feature                                         // ← RENUMBERED (was Phase 4)
## Phase 5: Check Console Errors                                        // ← RENUMBERED (was Phase 5)
## Phase 6: Interact & Test                                             // ← RENUMBERED (was Phase 6)
## Phase 7: CRUD Testing (If Applicable)                                // ← RENUMBERED (was Phase 7)
## Phase 8: Screenshot Evidence                                         // ← RENUMBERED (was Phase 8)
## Phase 9: Generate HTML Report                                        // ← RENUMBERED (was Phase 9)

## Phase 10: Retrospective & Learning                                   // ← ADDED ENTIRE PHASE

**🚨 MANDATORY: Read Session Transcript for Evidence-Based Retrospective**

You MUST read the actual session transcript to perform a proper retrospective...

**Step 1: Check file size FIRST**
**Step 2: Choose the right tool based on file size**
**Step 3: Extract execution evidence**
**Step 4: Self-Assessment Questions**
**Step 5: Structured Reflection with Citations**
**Step 6: Validate Completeness**

## Common Mistakes

| **Skip session transcript read** | **ALWAYS read from `.jsonl` file** |     // ← ADDED
| **Use in-context memory** | **READ the actual transcript** |              // ← ADDED
| **No citations in retrospective** | **ALWAYS cite line numbers** |        // ← ADDED

## Red Flags - STOP and Fix

- **"I remember what happened"** → NO, READ the session transcript          // ← ADDED
- **"Based on my recollection"** → NO, CITE line numbers                    // ← ADDED
- **"The retrospective is from memory"** → BLOCKED - must read transcript   // ← ADDED

## Checklist

- [ ] **🚨 READ session transcript**                                        // ← ADDED
- [ ] **Document trigger context**                                          // ← ADDED
- [ ] Analyze implementation
...
- [ ] **🚨 RE-READ session transcript for Phase 10**                        // ← ADDED
- [ ] **Perform Evidence-Based Retrospective**                              // ← ADDED
- [ ] **Validate retrospective completeness**                               // ← ADDED
```

### Key Changes Summary

| Aspect | SKILL.md.bak | SKILL.md | Lines Added |
|--------|--------------|----------|-------------|
| **Total Lines** | 353 lines | 528 lines | **+175 (+49%)** |
| **Phases** | 9 phases | 10 phases | +1 (Phase 10) |
| **Critical Blockers** | None | 15 lines | +15 |
| **Phase 1 Additions** | N/A | Trigger capture | +80 |
| **Phase 10** | N/A | Retrospective | +80 |
| **Common Mistakes** | 7 items | 10 items | +3 |
| **Red Flags** | 5 items | 8 items | +3 |
| **Checklist** | 10 items | 13 items | +3 |

### Integration Verification Checklist

After integration, verify:

- [ ] **Backup created** (SKILL.md.backup-{timestamp})
- [ ] **Line count increased by 40-60%** (e.g., 353 → 528 lines)
- [ ] **NOT doubled or tripled**
- [ ] **All original sections still present** (none removed)
- [ ] **Phase 1 has trigger capture section added**
- [ ] **Final phase (Phase 10) retrospective added**
- [ ] **All middle phases renumbered correctly** (+1 from original)
- [ ] **Critical blockers section added at top**
- [ ] **Red flags include retrospective rules**
- [ ] **Checklist includes auto-healing items**

### Common Integration Failures

| Symptom | Problem | Fix |
|---------|---------|-----|
| File doubled/tripled in size | LLM rewrote everything | Restore backup, use feature-validation as reference |
| Original phases missing | LLM deleted content | Restore backup, be explicit: "DO NOT DELETE" |
| Phase numbers not updated | Forgot to renumber | Update all phase references (+1 after trigger) |
| Line count exploded (353 → 2000+) | Complete rewrite | Should be 353 → 528 (+49%) |

---

## License

MIT - Free to use, modify, and distribute.

## Contributing

To improve this module:
1. Use it in your skills
2. Document issues in retrospectives
3. Submit improvements via PR

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-21 | Initial version |
| 1.1 | 2026-01-21 | Made OS-agnostic, removed hardcoded paths |
| 1.2 | 2026-01-21 | Added Part 10: Concrete integration example with LLM behavior warnings |
| 1.3 | 2026-01-21 | Updated Part 10 to use actual feature-validation diff (353→528 lines), removed generic validation example |
