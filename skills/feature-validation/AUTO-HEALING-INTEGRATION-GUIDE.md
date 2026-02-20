# Auto-Healing Integration Guide

**How to add auto-healing to your existing skill (based on actual feature-validation integration)**

---

## Quick Start

```
Backup my SKILL.md with timestamp, then apply skill-auto-healing.md to it.

CRITICAL:
- Create backup: SKILL.md.backup-{timestamp}
- Modify SKILL.md directly (no skill-test.md)
- DO NOT rewrite existing content
- ONLY add Phase 1 trigger capture (before current Phase 1)
- ONLY add Phase 10 retrospective (after current Phase 9)
- Update phase numbers: Phase 1→2, Phase 2→3, etc.
- Line count should increase ~40-50% (not double or triple)

Use feature-validation/SKILL.md as reference for what sections to add.
```

---

## What Gets Added

### Real Example: feature-validation

**Before (SKILL.md.bak):**
- 353 lines
- 9 phases (Analyze → Plan → Server → Navigate → Console → Interact → CRUD → Screenshot → Report)

**After (SKILL.md):**
- 528 lines (+175 lines, +49%)
- 10 phases (added Phase 1: trigger capture, Phase 10: retrospective)

---

## Sections Added (in order)

### 1. Critical Blockers Section (at top, after frontmatter)

```markdown
## 🚨 CRITICAL BLOCKERS - READ FIRST

**This skill has TWO mandatory file reads that CANNOT be skipped:**

1. **Phase 1 BLOCKER:** You MUST read the session transcript from `~/.claude/projects/{project-slug}/{session_id}.jsonl` to identify the trigger message...

2. **Phase 10 BLOCKER:** You MUST re-read the session transcript to perform an evidence-based retrospective...

**Session transcript location:** `~/.claude/projects/{project-slug}/`

**If you cannot read the transcript:** STOP and inform the user. Do not proceed with memory-based retrospective.
```

**Lines added:** ~15

---

### 2. Phase 1: Trigger Capture (NEW PHASE - inserted before old Phase 1)

Add this entire section before your current Phase 1:

```markdown
## Phase 1: Analyze Implementation

[YOUR EXISTING PHASE 1 CONTENT - now becomes Phase 2]

**🚨 MANDATORY: Identify Trigger Context from Session Transcript**

You MUST read the actual session transcript file to identify the trigger message. This is NOT optional.

**Step 1: Find the current session file**
```
Glob: pattern="*.jsonl" path="~/.claude/projects/{project-slug}"
```
Select the most recently modified `.jsonl` file (this is the current session).

**Step 2: Check file size FIRST**
```bash
# Check file size before reading
ls -lh "~/.claude/projects/{project-slug}/{session_id}.jsonl"
```

**Step 3: Choose the right tool based on file size**

| File Size | Tool to Use | Why |
|-----------|-------------|-----|
| < 256KB | `Read` tool directly | Small enough to read whole file |
| > 256KB | `Grep` first, then `Read` specific lines | Too large for direct read |

**Step 4: Find the trigger message**
Search the transcript for where `/{skill-name}` was invoked.

**Step 5: Document the trigger**
```
TRIGGER CONTEXT:
- Session ID: {session_id}
- Trigger line/index: ~{line_number}
- User request: "{exact or summarized user message}"
- Context: {what work preceded this request}
```

**Store this information - you WILL need it in Phase 10.**
```

**Lines added:** ~80

**NOTE:** Renumber all subsequent phases (+1)

---

### 3. Phase 10: Retrospective (NEW PHASE - added at end)

Add this entire section after your current last phase:

```markdown
## Phase 10: Retrospective & Learning

**🚨 MANDATORY: Read Session Transcript for Evidence-Based Retrospective**

You MUST read the actual session transcript to perform a proper retrospective. Do NOT rely on in-context memory alone.

**Step 1: Check file size FIRST (same as Phase 1)**
```bash
ls -lh "~/.claude/projects/{project-slug}/{session_id}.jsonl"
```

**Step 2: Choose the right tool based on file size**

| File Size | Tool to Use |
|-----------|-------------|
| < 256KB | `Read` tool directly |
| > 256KB | `Grep` to find actions, then `Read` specific lines |

**Step 3: Extract execution evidence**
From the transcript, identify:
- The trigger message (from Phase 1 documentation)
- Each phase you executed (look for tool calls, actions)
- Any errors or warnings encountered
- User corrections or clarifications

**Step 4: Self-Assessment Questions (answer with EVIDENCE from transcript)**

| Question | Evidence Required |
|----------|-------------------|
| Did I stick to the plan? | Quote specific tool calls from transcript |
| Did I catch all errors? | List errors found vs. documented |
| Was the output comprehensive? | Compare actions taken vs. expected |
| Did I skip any phases? | Check transcript for each phase marker |
| Did user have to correct me? | Quote any corrections from transcript |

**Step 5: Structured Reflection with Citations**

Output this format, citing LINE NUMBERS from transcript:

```
=== RETROSPECTIVE (Evidence-Based) ===

**Session:** {session_id}
**Trigger:** "{user message}" (line ~{N})
**Phases Executed:** 1-2-3-4-5-6-7-8-9-10

**WHAT I DID:**
- [Action] (transcript line ~{N})
- [Action] (transcript line ~{N})

**WHAT WENT WELL:**
- [Positive] - Evidence: {quote from transcript}

**WHAT COULD BE IMPROVED:**
- [Issue] - Evidence: {quote from transcript}
- [Suggestion] - This would have: {concrete improvement}

**USER CORRECTIONS RECEIVED:**
- "{correction}" (line ~{N}) - I should have: {lesson}

**SUGGESTIONS FOR NEXT RUN:**
1. [Actionable tip based on THIS session's evidence]
2. [Pattern to avoid based on THIS session's evidence]
```

**Step 6: Validate Completeness**
Before finishing, verify:
- [ ] I read the actual session transcript file (not just in-context memory)
- [ ] I cited specific line numbers or quotes
- [ ] I identified at least one thing that could be improved
- [ ] If user corrected me, I documented the lesson
```

**Lines added:** ~80

---

### 4. Update Common Mistakes Section

Add these rows to your existing "Common Mistakes" table:

```markdown
| **Skip session transcript read** | **ALWAYS read from `.jsonl` file in Phase 1 and 10** |
| **Use in-context memory for retrospective** | **READ the actual transcript file for evidence** |
| **No citations in retrospective** | **ALWAYS cite line numbers from transcript** |
```

---

### 5. Update Red Flags Section

Add these items:

```markdown
- **"I remember what happened"** → NO, READ the session transcript file
- **"Based on my recollection"** → NO, CITE line numbers from .jsonl file
- **"The retrospective is from memory"** → BLOCKED - must read transcript first
```

---

### 6. Update Checklist Section

Add these items at the start and end:

**At start:**
```markdown
- [ ] **🚨 READ session transcript** (find .jsonl in `.claude/projects/`, identify trigger)
- [ ] **Document trigger context** (session ID, line number, user request)
```

**At end:**
```markdown
- [ ] **🚨 RE-READ session transcript for Phase 10**
- [ ] **Perform Evidence-Based Retrospective** (cite line numbers, quote transcript)
- [ ] **Validate retrospective completeness** (all checkboxes in Phase 10 Step 6)
```

---

## Verification

After integration, check:

### Line Count
- [ ] Increased by 40-60% (e.g., 353 → 528 lines)
- [ ] NOT doubled or tripled

### Phase Count
- [ ] Added exactly 2 phases (trigger + retrospective)
- [ ] All original phases still present
- [ ] Phase numbers updated correctly

### Content Check
- [ ] Critical blockers section at top
- [ ] Phase 1 has trigger capture instructions
- [ ] Phase 10 has retrospective instructions
- [ ] Common mistakes updated
- [ ] Red flags updated
- [ ] Checklist updated

---

## Common Failures

### File size exploded (353 → 2000+ lines)
**Problem:** Claude rewrote everything
**Fix:** Restore backup, be MORE explicit: "DO NOT REWRITE, ONLY ADD 2 PHASES"

### Original phases deleted
**Problem:** Claude replaced instead of adding
**Fix:** Restore backup, list all phases that MUST remain unchanged

### Phase numbers not updated
**Problem:** Forgot to renumber
**Fix:** Update all phase references (+1 after insertion point)

---

## Example Diff

Based on actual feature-validation integration:

```diff
# Feature Validation

+## 🚨 CRITICAL BLOCKERS - READ FIRST
+
+**This skill has TWO mandatory file reads...**

## The Validation Workflow

-    report [label="9. Generate HTML Report\n(save to /test/phase-X/)"];
+    retro [label="10. Retrospective\n(Self-assessment & Learning)"];
-    report -> done;
+    report -> retro;
+    retro -> done;

-## Phase 1: Analyze Implementation
+## Phase 1: Analyze Implementation

+**🚨 MANDATORY: Identify Trigger Context from Session Transcript**
+
+You MUST read the actual session transcript file...
+
+**Step 1: Find the current session file**
+...
+**Step 5: Document the trigger**
+...

-## Phase 2: Plan Test Scenarios
+## Phase 2: Plan Test Scenarios

[All subsequent phases renumbered +1]

+## Phase 10: Retrospective & Learning
+
+**🚨 MANDATORY: Read Session Transcript...**

## Common Mistakes

+| **Skip session transcript read** | **ALWAYS read from `.jsonl` file** |

## Red Flags

+- **"I remember what happened"** → NO, READ the session transcript

## Checklist

+- [ ] **🚨 READ session transcript**
+- [ ] **Document trigger context**
 - [ ] Analyze implementation
 ...
+- [ ] **🚨 RE-READ session transcript for Phase 10**
+- [ ] **Perform Evidence-Based Retrospective**
```

---

## Done

Your skill now has:
- ✅ Trigger capture in Phase 1
- ✅ Evidence-based retrospective in final phase
- ✅ Session transcript reading with size handling
- ✅ Self-improvement capability through learning

**Backup preserved at:** `SKILL.md.backup-{timestamp}`

---

**Version:** 2.0 (simplified, based on actual diff)
**Date:** 2026-01-21
