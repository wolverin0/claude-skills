# AI Debate Hub

A Claude Code skill that enables **three-way debates** between Claude, Gemini CLI, and OpenAI Codex CLI. Claude is both a **participant and moderator**, contributing its own analysis alongside the other advisors.

## Overview

AI Debate Hub creates a three-way discussion where all three AI systems analyze problems independently, respond to each other's points across multiple rounds, and converge on recommendations through genuine debate.

**Key distinction:** Claude is NOT just an orchestrator - it's an active participant with its own voice.

```
        User Question
              |
              v
+---------------------------+
|         ROUND 1           |
+---------------------------+
|  Gemini   Codex   Claude  |
|  analyzes analyzes analyzes|
+---------------------------+
              |
              v
+---------------------------+
|         ROUND 2+          |
+---------------------------+
|  Gemini   Codex   Claude  |
|  responds responds responds|
|  to both  to both  to both |
+---------------------------+
              |
              v (early-stop if consensus)
+---------------------------+
|       SYNTHESIS           |
+---------------------------+
|   Advisor summary table   |
|   Consensus + disputes    |
|   Risks & failure modes   |
|   Claude's recommendation |
+---------------------------+
```

## Requirements

| Dependency | Required | Notes |
|-----------|----------|-------|
| [Claude Code CLI](https://github.com/anthropics/claude-code) | Yes | Orchestrator + participant |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | Yes | `npm install -g @google/gemini-cli` |
| [Codex CLI](https://github.com/openai/codex) | Yes | OpenAI's coding assistant |
| `bash` | Yes | Shell for helper scripts (or WSL on Windows) |
| `jq` | Recommended | JSON validation in atomic writes |
| `flock` | Optional | File locking (Linux). Fallback exists without it |
| Node.js 18+ | Optional | Cross-platform alternative to bash helpers |

### Windows Users

Two options:

1. **WSL (recommended)** — Run everything inside WSL. All bash helpers work natively.
2. **Node.js alternative** — Use `tools/atomic-json.mjs` instead of bash helpers for state/index management. No `flock` or `jq` needed.

## Installation

1. Clone this repository into your Claude Code skills directory:
```bash
cd ~/.claude/skills
git clone https://github.com/wolverin0/claude-skills.git
```

2. The skill is now available at `~/.claude/skills/claude-skills/skills/debate/SKILL.md`

Or copy just the debate skill:
```bash
cp -r claude-skills/skills/debate ~/.claude/skills/
```

## Quickstart

```bash
# Simple one-round debate
/debate Should we use Redis or in-memory cache for our session store?

# Three-round thorough analysis
/debate -r 3 -d thorough Review our authentication implementation

# Adversarial with authoritative moderator
/debate -r 2 -d adversarial -m authoritative Is this API design secure?
```

## Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--rounds N` | `-r N` | 1 | Number of debate rounds (1-10) |
| `--debate-style STYLE` | `-d STYLE` | quick | Style: quick, thorough, adversarial, collaborative |
| `--moderator-style MODE` | `-m MODE` | guided | Mode: transparent, guided, authoritative |
| `--max-words N` | `-w N` | 300 | Word limit per response |

### Moderator Styles

| Mode | Behavior |
|------|----------|
| `transparent` | Claude presents all views neutrally, minimal editorial voice |
| `guided` | Claude highlights key disagreements and steers toward resolution |
| `authoritative` | Claude takes strong positions and challenges weak arguments |

## Architecture

### Session Management

Each advisor maintains its own session for context continuity:

- **Gemini**: Runs from project root, sessions tracked by UUID via `--list-sessions`
- **Codex**: Runs from debate folder, UUID captured from output header

```bash
# Gemini (from project root)
gemini -y -o text "Initial prompt..."
gemini -r <UUID> -y -o text "Follow-up..."

# Codex (from debate folder)
codex exec --full-auto "Initial prompt..."
codex exec resume <UUID> --full-auto "Follow-up..."
```

### Debate Flow

```
Round 1 (all three analyze):
|-- Gemini analyzes topic
|-- Codex analyzes topic
+-- Claude analyzes topic (YOUR contribution)

Round 2+ (all three respond):
|-- Gemini responds to Codex + Claude
|-- Codex responds to Gemini + Claude
+-- Claude responds to Gemini + Codex (YOUR contribution)
    └── Early-stop check: if strong consensus, skip remaining rounds

Synthesis:
+-- Advisor summary table (position, confidence, assumptions)
+-- Points of agreement across all three
+-- Points of disagreement
+-- Risks & failure modes
+-- Claude's final recommendation
```

### Output Contract

Each advisor response follows a structured format for comparability:

- **Position** (1 line)
- **Key Arguments** (bullets)
- **Assumptions**
- **Risks / Failure Modes**
- **What Would Change My Mind**
- **Confidence** (0-100%)

This makes synthesis meaningful — you can cross-compare assumptions and confidence levels.

### File Structure

```
{project}/debates/
|-- viewer.html             # Auto-deployed from skill folder
|-- index.json              # Debate registry for viewer (atomic writes)
+-- NNN-topic-slug/
    |-- context.md          # Initial context
    |-- state.json          # Session UUIDs, status, telemetry
    |-- transcript.md       # Combined chronological record
    |-- synthesis.md        # Final synthesis (all 3 perspectives)
    +-- rounds/
        |-- r001_gemini.md
        |-- r001_codex.md
        |-- r001_claude.md  # Claude's contribution
        |-- r002_gemini.md
        |-- r002_codex.md
        |-- r002_claude.md  # Claude's contribution
        +-- ...
```

### Viewing Debates

The skill automatically deploys a web viewer to your debates folder:

```bash
cd {project}/debates
python -m http.server 8000
# Open http://localhost:8000/viewer.html
```

The viewer shows:
- **Synthesis** — Final analysis and recommendations (with copy-to-clipboard)
- **Rounds** — Side-by-side comparison (2 or 3 columns)
- **Transcript** — Full chronological debate record
- **Context** — Original question and configuration
- **State** — Debug view of debate metadata + telemetry

## Debate Styles

| Style | Behavior | Default Rounds |
|-------|----------|----------------|
| `quick` | Single round, parallel analysis | 1 |
| `thorough` | Multi-round, verify claims | 3 |
| `adversarial` | One proposes, one critiques | 3 |
| `collaborative` | "Yes, and..." building | 2 |

## Development

### Testing

Run a simple test debate:
```
/debate -r 2 Is 2+2=4?
```

Verify session continuity by checking token growth in Codex output.

### Test Checklist

- [ ] Single round debate generates complete folder structure
- [ ] 3-round debate respects session persistence across rounds
- [ ] Simulated rate-limit triggers retry and records `last_error` in state.json
- [ ] Two parallel debates don't corrupt `index.json`
- [ ] `viewer.html` renders without errors and copy-to-clipboard works

## Known Limitations

1. **Gemini `--include-directories`**: Flag exists but doesn't work; run from project root instead
2. **Codex `-C` flag**: Doesn't bypass trust requirements; use `cd` instead
3. **Codex rate limits**: May hit usage limits on extended debates

## Version History

- **v6.0.0** (current) — Production hardening
  - Unified version across all files
  - Added `--moderator-style` flag (transparent, guided, authoritative)
  - Structured output contract per advisor (position, confidence, assumptions, risks)
  - Early-stop on consensus detection
  - Error telemetry in state.json (round durations, retries, last_error)
  - Atomic index.json writes (parallel-safe)
  - Cross-platform Node.js helper (`tools/atomic-json.mjs`)
  - Enhanced viewer with copy-to-clipboard
  - `disable-model-invocation: true` in frontmatter

- **v4.7** — Three-way debate structure
  - Claude is now an active PARTICIPANT, not just orchestrator
  - Each round has contributions from all three: Gemini, Codex, Claude
  - Advisors receive responses from BOTH other participants
  - Claude's responses saved to r00N_claude.md files

- **v4.6** — Production-ready architecture
  - Gemini runs from project root for file access
  - Both advisors use explicit UUID tracking
  - Full e2e tested and validated

- **v4.5** — Fixed Codex syntax, removed broken flags
- **v4.4** — Added session UUID persistence
- **v4.3** — Flag precedence rules, synthesis workflow
- **v4.2** — Session folder scoping documentation

## License

MIT

## Contributing

Issues and PRs welcome at [github.com/wolverin0/claude-skills](https://github.com/wolverin0/claude-skills)
