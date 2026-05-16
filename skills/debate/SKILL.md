---
name: debate
description: Multi-LLM debate orchestration (Claude vs Codex vs Gemini) with rounds + synthesis.
---

# AI Debate Hub Skill v6.0.0

You are Claude, a **participant and moderator** in a three-way AI debate. You run Gemini and Codex via CLI, contribute your own analysis, and synthesize all perspectives.

**You are NOT just an orchestrator. You are an active participant with your own voice.**

> This skill runs by explicit command only (`/debate`). It will never auto-invoke.

---

## Parsing Invocation

```
/debate [-r N] [-d STYLE] [-m MODE] [-w N] <question or task>
```

**Flags:**
- `-r N` / `--rounds N` - Number of rounds (1-10, default: 1)
- `-d STYLE` / `--debate-style STYLE` - quick|thorough|adversarial|collaborative
- `-m MODE` / `--moderator-style MODE` - transparent|guided|authoritative (default: guided)
- `-w N` / `--max-words N` - Word limit per response (default: 300)

**Moderator styles:**
- `transparent` - Claude presents all views neutrally, minimal editorial voice
- `guided` (default) - Claude highlights key disagreements and steers toward resolution
- `authoritative` - Claude takes strong positions and challenges weak arguments

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
   +-- index.json          # Add debate ID to array
   +-- viewer.html         # Copy from skill folder if missing
   +-- NNN-topic-slug/
       +-- state.json      # Initialize (see below)
       +-- context.md      # Question + config
       +-- rounds/         # Empty folder
   ```

4. **Initialize state.json:**
   ```json
   {
     "version": 2,
     "debate_id": "NNN-topic-slug",
     "topic": "Human readable topic",
     "status": "in_progress",
     "current_round": 0,
     "rounds_total": N,
     "moderator_style": "guided",
     "participants": ["gemini", "codex", "claude"],
     "created_at": "ISO-8601",
     "sessions": {},
     "telemetry": {
       "round_durations": {},
       "retries_count": 0
     },
     "last_error": null
   }
   ```

   **Telemetry fields:**
   - `round_durations` - Object mapping round number to seconds: `{"1": 45, "2": 38}`
   - `retries_count` - Total retry attempts across all rounds
   - `last_error` - `null` or `{"type": "rate_limit", "message": "429 Too Many Requests", "round": 2, "advisor": "gemini", "timestamp": "ISO-8601"}`

5. **Update index.json atomically** - Add debate folder name to the `debates` array. Use `update_debate_index()` from helpers.md to prevent corruption during parallel debates.

### Phase 2: Run Rounds

**Round 1 - All three analyze independently:**

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
- Write YOUR analysis to `rounds/r001_claude.md` (adapt tone to `--moderator-style`)
- Capture session UUIDs and store in state.json
- Record round duration in `telemetry.round_durations`

**Round 2+ - All three respond to each other:**

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
- Record round duration in `telemetry.round_durations`
- **Early-stop check:** If round >= 2 and all three advisors show strong convergence (same recommendation, no new arguments), set `early_stop: true` in state.json with `early_stop_reason: "consensus"` and skip remaining rounds

### Phase 3: Handle Failures

On failure, read `helpers.md` in this skill folder for retry logic and error handling functions.

**Quick reference:**
- Timeout -> Retry with exponential backoff (2s, 4s, 8s)
- Rate limit -> Wait 60s, retry
- Session expired -> Create new session with full context
- Usage limit -> Skip advisor, continue with others

**Always record failures in state.json:**
```json
{
  "last_error": {
    "type": "rate_limit",
    "message": "429 Too Many Requests (capped at 200 chars)",
    "round": 2,
    "advisor": "gemini",
    "timestamp": "ISO-8601"
  },
  "telemetry": { "retries_count": 3 }
}
```

### Phase 4: Synthesis

After all rounds complete (or early-stop triggered):

1. **Create transcript.md** - Combine all rounds chronologically
2. **Create synthesis.md** using the structured output contract:
   ```markdown
   # Debate Synthesis: {topic}

   ## Advisor Summary

   | Advisor | Position | Confidence | Key Assumption |
   |---------|----------|------------|----------------|
   | Gemini  | ...      | XX%        | ...            |
   | Codex   | ...      | XX%        | ...            |
   | Claude  | ...      | XX%        | ...            |

   ## Consensus (All Agree)
   - Point 1
   - Point 2

   ## Disputed Issues
   - Issue: [Gemini view] vs [Codex view] vs [Claude view]

   ## Risks & Failure Modes
   | Risk | Raised by | Severity |
   |------|-----------|----------|
   | ...  | Gemini    | High     |

   ## Recommendations
   | Priority | Action | Source |
   |----------|--------|--------|
   | 1 | ... | All/Gemini/Codex/Claude |

   ## Conclusion
   {Your final recommendation}

   ## Metadata
   - Rounds completed: {N}
   - Early stop: {yes/no} ({reason if yes})
   - Total duration: {sum of round_durations}s
   ```

3. **Update state.json:** Set `status: "completed"`, add `completed_at`

---

## Advisor Output Contract

Each advisor response (including yours) should follow this structure:

```markdown
**Position:** {1-line summary of recommendation}

**Key Arguments:**
- Argument 1
- Argument 2

**Assumptions:**
- What I'm taking for granted

**Risks / Failure Modes:**
- What could go wrong with my approach

**What Would Change My Mind:**
- Evidence or argument that would shift my position

**Confidence:** {0-100}%
```

When prompting Gemini and Codex, include this structure in the prompt so their responses are comparable. **Do not invent facts; if uncertain, say so explicitly.**

---

## Your Contributions

Each round, write YOUR analysis to `rounds/r00N_claude.md` following the output contract above.

**DO NOT just summarize. PARTICIPATE.**

Wrong: "Gemini said X, Codex said Y. Both make good points."

Right: "Gemini raises a valid concern about performance, but misses our existing cache. Codex's security point is critical-I agree. However, BOTH missed the rate limiting vulnerability. My recommendation: address security first (agreeing with Codex), use existing cache (disagreeing with Gemini)."

**Adapt tone to `--moderator-style`:**
- `transparent` - Present your position alongside others, equal weight
- `guided` - Highlight the strongest arguments, steer toward resolution
- `authoritative` - Take a firm stance, challenge weak reasoning directly

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
+-- index.json              PASS: Contains this debate
+-- viewer.html             PASS: Exists
+-- NNN-topic/
    +-- state.json          PASS: Has status, participants, current_round
    +-- context.md          PASS: Has question
    +-- transcript.md       PASS: (if completed)
    +-- synthesis.md        PASS: (if completed)
    +-- rounds/
        +-- r001_gemini.md  PASS:
        +-- r001_codex.md   PASS:
        +-- r001_claude.md  PASS: YOUR contribution
```

---

## Helper Functions

For error handling, retry logic, and atomic state updates, read:
`helpers.md` in this skill folder.

This contains:
- `update_debate_state()` - Safe atomic state writes
- `update_debate_index()` - Safe atomic index.json writes (parallel-safe)
- `run_advisor_with_retry()` - Exponential backoff retry with telemetry
- `log_contextual_error()` - User-friendly error output

**Cross-platform alternative:** For Windows/macOS without `flock`, use:
```bash
node tools/atomic-json.mjs write state.json '<json>'
node tools/atomic-json.mjs append-index index.json '<entry-json>'
```
