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
              v
+---------------------------+
|       SYNTHESIS           |
+---------------------------+
|   All 3 perspectives      |
|   Claude's recommendation |
+---------------------------+
```

## Features

- **Multi-round debates**: Configurable 1-10 rounds of back-and-forth
- **Session persistence**: Advisors maintain context across rounds via session UUIDs
- **Multiple debate styles**: quick, thorough, adversarial, collaborative
- **Automatic synthesis**: Generates summary of agreements, disagreements, and recommendations
- **Token efficient**: Only injects other advisor's response (each remembers own context)

## Requirements

- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - `npm install -g @anthropic-ai/gemini-cli`
- [Codex CLI](https://github.com/openai/codex) - OpenAI's coding assistant

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

## Usage

### Basic Invocation
```
/debate Should we use Redis or in-memory cache for our session store?
```

### With Options
```
/debate -r 3 -d thorough Review our authentication implementation
/debate --rounds 2 --debate-style adversarial Is this API design secure?
```

### Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--rounds N` | `-r N` | 1 | Number of debate rounds (1-10) |
| `--debate-style STYLE` | `-d STYLE` | quick | Style: quick, thorough, adversarial, collaborative |
| `--moderator-style MODE` | `-m MODE` | guided | Mode: transparent, guided, authoritative |
| `--max-words N` | `-w N` | 300 | Word limit per response |

## Architecture

### Session Management

Each advisor maintains its own session for context continuity:

- **Gemini**: Runs from project root, sessions tracked by UUID via `--list-sessions`
- **Codex**: Runs from debate folder, UUID captured from output header

```bash
# Gemini (from project root)
gemini -y "Initial prompt..."
gemini -r <UUID> -y "Follow-up..."

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

Synthesis:
+-- All three perspectives consolidated
+-- Points of agreement across all three
+-- Points of disagreement
+-- Claude's final recommendation
```

### File Structure

```
{project}/debates/
|-- viewer.html             # Auto-deployed from skill folder
|-- index.json              # Debate registry for viewer
+-- NNN-topic-slug/
    |-- context.md          # Initial context
    |-- state.json          # Session UUIDs, status
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
- **Synthesis** - Final analysis and recommendations
- **Rounds** - Side-by-side comparison (2 or 3 columns)
- **Transcript** - Full chronological debate record
- **State** - Debug view of debate metadata

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

### Version History

- **v4.7** (current) - Three-way debate structure
  - Claude is now an active PARTICIPANT, not just orchestrator
  - Each round has contributions from all three: Gemini, Codex, Claude
  - Advisors receive responses from BOTH other participants
  - Claude's responses saved to r00N_claude.md files

- **v4.6** - Production-ready architecture
  - Gemini runs from project root for file access
  - Both advisors use explicit UUID tracking
  - Full e2e tested and validated

- **v4.5** - Fixed Codex syntax, removed broken flags
- **v4.4** - Added session UUID persistence
- **v4.3** - Flag precedence rules, synthesis workflow
- **v4.2** - Session folder scoping documentation

## Known Limitations

1. **Gemini `--include-directories`**: Flag exists but doesn't work; run from project root instead
2. **Codex `-C` flag**: Doesn't bypass trust requirements; use `cd` instead
3. **Codex rate limits**: May hit usage limits on extended debates

## License

MIT

## Contributing

Issues and PRs welcome at [github.com/wolverin0/claude-skills](https://github.com/wolverin0/claude-skills)
