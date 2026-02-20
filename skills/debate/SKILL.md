---
name: debate
description: Use when a user wants a structured multi-model debate using Claude, Gemini CLI, and OpenAI Codex CLI, with configurable rounds and debate style.
---

# AI Debate Hub Skill v6.0

You are Claude, a **participant and moderator** in a three-way AI debate. You run Gemini and Codex via CLI, contribute your own analysis, and synthesize all perspectives.

**You are NOT just an orchestrator. You are an active participant with your own voice.**

---

## Parsing Invocation

```
/debate [-r N] [-d STYLE] [-w N] <question or task>
```

**Flags:**
- `-r N` / `--rounds N` — Number of rounds (1-10, default: 1)
- `-d STYLE` / `--debate-style STYLE` — quick|thorough|adversarial|collaborative
- `-w N` / `--max-words N` — Word limit per response (default: 300)

**Style defaults (when --rounds not specified):** quick=1, thorough=3, adversarial=3, collaborative=2

**Flag precedence:** `--rounds` always overrides style defaults.

---

## Orchestration

### Phase 1: Setup

1. Parse flags from user invocation
2. Generate debate ID: `NNN-topic-slug` (next available number)
3. Create folder structure:
   ```
   {cwd}/debates/
   ├── index.json          # Add debate ID to array
   ├── viewer.html         # Copy from skill folder if missing
   └── NNN-topic-slug/
       ├── state.json      # Initialize (see below)
       ├── context.md      # Question + config
       └── rounds/         # Empty folder
   ```

4. **Initialize state.json:**
   ```json
   {
     "version": 1,
     "debate_id": "NNN-topic-slug",
     "topic": "Human readable topic",
     "status": "in_progress",
     "current_round": 0,
     "rounds_total": N,
     "participants": ["gemini", "codex", "claude"],
     "created_at": "ISO-8601",
     "sessions": {}
   }
   ```

5. **Update index.json** — Add debate folder name to the `debates` array

### Phase 2: Run Rounds

**Round 1 — All three analyze independently:**

```bash
# Gemini (from project root for file access)
cd "$PROJECT_ROOT" && gemini -y -o text "You are an advisor in a three-way debate.
Topic: {topic}
Task: {task}
Provide initial analysis. {max_words} words max."

# Codex (from debate folder)
cd "$DEBATE_FOLDER" && codex exec --full-auto "You are an advisor in a three-way debate.
Topic: {topic}
Task: {task}
Provide initial analysis. {max_words} words max."
```

After both respond:
- Save responses to `rounds/r001_gemini.md` and `rounds/r001_codex.md`
- Write YOUR analysis to `rounds/r001_claude.md`
- Capture session UUIDs and store in state.json

**Round 2+ — All three respond to each other:**

```bash
# Gemini (resume session)
cd "$PROJECT_ROOT" && gemini -r <UUID> -y -o text "Round N.
Codex said: {codex_response}
Claude said: {claude_response}
Respond to both. {max_words} words max."

# Codex (resume session)
cd "$DEBATE_FOLDER" && codex exec resume <UUID> --full-auto "Round N.
Gemini said: {gemini_response}
Claude said: {claude_response}
Respond to both. {max_words} words max."
```

After both respond:
- Save to `rounds/r00N_gemini.md`, `rounds/r00N_codex.md`
- Write YOUR response to `rounds/r00N_claude.md`
- Update `current_round` in state.json

### Phase 3: Handle Failures

On failure, read `helpers.md` in this skill folder for retry logic and error handling functions.

**Quick reference:**
- Timeout → Retry with exponential backoff (2s, 4s, 8s)
- Rate limit → Wait 60s, retry
- Session expired → Create new session with full context
- Usage limit → Skip advisor, continue with others

### Phase 4: Synthesis

After all rounds complete:

1. **Create transcript.md** — Combine all rounds chronologically
2. **Create synthesis.md:**
   ```markdown
   # Debate Synthesis: {topic}

   ## Consensus (All Agree)
   - Point 1
   - Point 2

   ## Disputed Issues
   - Issue: [Gemini view] vs [Codex view] vs [Claude view]

   ## Recommendations
   | Priority | Action | Source |
   |----------|--------|--------|
   | 1 | ... | All/Gemini/Codex/Claude |

   ## Conclusion
   {Your final recommendation}
   ```

3. **Update state.json:** Set `status: "completed"`, add `completed_at`

---

## Your Contributions

Each round, write YOUR analysis to `rounds/r00N_claude.md`:

**DO NOT just summarize. PARTICIPATE.**

Wrong: "Gemini said X, Codex said Y. Both make good points."

Right: "Gemini raises a valid concern about performance, but misses our existing cache. Codex's security point is critical—I agree. However, BOTH missed the rate limiting vulnerability. My recommendation: address security first (agreeing with Codex), use existing cache (disagreeing with Gemini)."

---

## CLI Quick Reference

**Gemini:**
- First call: `gemini -y -o text "prompt"`
- Resume: `gemini -r <UUID> -y -o text "prompt"`
- Get UUID: `gemini --list-sessions`
- **Always use `-o text`** for captured output

**Codex:**
- First call: `codex exec --full-auto "prompt"`
- Resume: `codex exec resume <UUID> --full-auto "prompt"`
- UUID appears in output header

---

## File Checklist

Before ending any debate, verify:

```
debates/
├── index.json              ✓ Contains this debate
├── viewer.html             ✓ Exists
└── NNN-topic/
    ├── state.json          ✓ Has status, participants, current_round
    ├── context.md          ✓ Has question
    ├── transcript.md       ✓ (if completed)
    ├── synthesis.md        ✓ (if completed)
    └── rounds/
        ├── r001_gemini.md  ✓
        ├── r001_codex.md   ✓
        └── r001_claude.md  ✓ YOUR contribution
```

---

## Helper Functions

For error handling, retry logic, and atomic state updates, read:
`~/.claude/skills/debate/helpers.md`

This contains:
- `update_debate_state()` — Safe atomic state writes
- `run_advisor_with_retry()` — Exponential backoff retry
- `log_contextual_error()` — User-friendly error output
