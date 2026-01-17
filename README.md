# AI Debate Hub

A Claude Code skill that orchestrates multi-round debates between AI advisors (Gemini CLI and OpenAI Codex CLI), synthesizes their responses, and presents recommendations to the user.

## Overview

AI Debate Hub enables Claude to act as a moderator, consulting multiple AI systems on complex questions. Each advisor analyzes the problem independently, then responds to each other's points across multiple rounds, leading to more thorough and balanced recommendations.

```
User Question
     |
     v
+--------------------+
|  Claude (Moderator)|
+--------------------+
     |         |
     v         v
+--------+ +--------+
| Gemini | | Codex  |
+--------+ +--------+
     |         |
     +----+----+
          |
          v
   Synthesized Answer
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
git clone https://github.com/wolverin0/claude-skills.git
```

2. Copy the skill to your project or reference it directly:
```bash
cp claude-skills/ai-debate-hub/skills/debate.md ~/.claude/skills/
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
Round 1 (parallel):
|-- Gemini analyzes topic
+-- Codex analyzes topic

Round 2+ (sequential):
|-- Gemini responds to Codex's points
+-- Codex responds to Gemini's points

Synthesis:
+-- Claude summarizes agreements/disagreements
+-- Provides final recommendation
```

### File Structure

```
debates/
|-- index.json              # Debate registry
+-- NNN-topic-slug/
    |-- context.md          # Initial context
    |-- state.json          # Session UUIDs, status
    |-- synthesis.md        # Final synthesis
    +-- rounds/
        |-- r001_gemini.md
        |-- r001_codex.md
        |-- r002_gemini.md
        +-- ...
```

## Debate Styles

| Style | Behavior | Default Rounds |
|-------|----------|----------------|
| `quick` | Single round, parallel analysis | 1 |
| `thorough` | Multi-round, verify claims | 3 |
| `adversarial` | One proposes, one critiques | 3 |
| `collaborative` | "Yes, and..." building | 2 |

## Example Debates

This repository includes test debates demonstrating the system:

- `007-session-test` - Session resumption validation
- `008-skill-final-review` - Meta-review of the skill itself
- `009-cli-validation` - CLI flag testing
- `010-e2e-test` - Full end-to-end architecture test

## Development

### Testing

Run a simple test debate:
```
/debate -r 2 Is 2+2=4?
```

Verify session continuity by checking token growth in Codex output.

### Version History

- **v4.6** (current) - Production-ready
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
