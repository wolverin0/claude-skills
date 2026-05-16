---
name: skillify
description: Codify the workflow the user just successfully completed into a reusable skill. Use after a multi-step task finished green (tests pass / build succeeds / user confirmed "done") and the same pattern is likely to recur. Walks the recent conversation, drafts a SKILL.md, asks the user to approve, then writes it to disk. Inspired by gstack/skillify (Garry Tan) - one-shot deterministic codification, not autonomous trace mining.
---

# Skill: skillify

This skill turns a just-completed workflow into a permanent skill. It does NOT
auto-detect - the user invokes it with `/skillify` after they decide the
workflow is worth keeping.

## When to use

- User just finished a multi-step task that ended green and says "skillify
  this" / "save this as a skill" / "let's make this reusable"
- You (Claude) notice you've done the same pattern 3+ times in one session and
  propose `/skillify` to the user
- User just ran the built-in `/insights` command (which analyzes Claude Code
  session friction points and recurring patterns) and wants to convert one of
  the surfaced patterns into a skill - `/insights` is the discovery tool,
  `/skillify` is the codification tool

## When NOT to use

- The workflow had a major error or pivot mid-way (not yet stable enough to
  freeze)
- The workflow is one-off (e.g., a specific debug session - not the
  general debugging pattern)
- The workflow is just a tool call wrapper (write a function, not a skill)
- A similar skill already exists in `~/.claude/skills/` - propose updating it
  instead

## Reuse, don't re-invent

The Anthropic-shipped skills do most of the heavy lifting. Read these BEFORE
drafting:

- `~/.claude/skills/skill-creator/SKILL.md` - frontmatter contract,
  progressive-disclosure rules. Always cite this.
- `~/.claude/skills/skill-builder/SKILL.md` - validation checklist
  (lines 1-910). Use the checklist verbatim in step 5 below.

## Six-step flow

### 1. Walk back

Read the **last 20 conversation turns** of the current session. Identify the
spine of the workflow:

- the user's initial ask
- the sequence of tool calls + file edits that solved it
- the verification step that confirmed it worked
- the user's confirmation ("listo", "done", "yes that's right", etc.) - or, if
  absent, the green test/build output

If the spine isn't clear (the conversation drifted, multiple attempts, no clear
end-state), STOP and tell the user "I can't see a stable workflow to skillify
yet - point me at the turn range, or describe the workflow in one paragraph."

### 2. Propose name + description + triggers

Generate:

- **slug** (kebab-case, <=32 chars) - directory name and command name
- **description** (<=200 chars) - fits the front-matter `description` field
- **3-5 trigger phrases** - example user prompts that should invoke this skill
- **scope decision** - global (`~/.claude/skills/<slug>/`) or
  project-local (`<project>/.claude/skills/<slug>/`)- Default: ask the user.

### 3. Draft `SKILL.md`

Frontmatter contract (matches `skill-creator`):

```yaml
---
name: <slug>
description: <one sentence, when-to-use baked in, <=200 chars>
allowed-tools: [tools that the skill actually uses]
when-to-use: <one paragraph - be specific about the green-state precondition>
---
```

Body sections:

1. **Overview** - one paragraph
2. **When to use** / **When NOT to use** - bullet lists
3. **Inputs** - what the skill needs from the user before it runs
4. **Procedure** - the exact tool sequence from the walked-back workflow,
   numbered, each step actionable
5. **Verification** - how to confirm the skill worked (single command or DOM check)
6. **Failure modes** - what's known to go wrong + how to recover

Keep it under 200 lines. Long skills don't get used.

### 4. Approval gate

Show the user the full draft via `AskUserQuestion` with:

- option A: "Looks good - save it"
- option B: "Needs edits - I'll tell you what to change"
- option C: "Don't save"

If the user picks B, take their edits, redraft, repeat the gate (max 2
iterations before falling back to "save what we have or cancel").

### 5. Validation checklist (before write)

From `skill-builder` validation, the non-negotiables:

- [ ] `name` matches the slug and directory
- [ ] `description` <=200 chars and starts with a use-case, not a feature
- [ ] `when-to-use` is concrete (not "use when you need to do stuff")
- [ ] `allowed-tools` lists every tool the procedure mentions
- [ ] No raw secrets in the body (api keys, paths with usernames)
- [ ] The procedure is reproducible by a fresh session with no prior context
- [ ] Body is <200 lines

If any check fails, fix BEFORE writing.

### 6. Write + log + smoke-test

- Write `SKILL.md` to the chosen location (global or project)
- Append to `~/.claude/skills/.skillify-log.jsonl`:
  ```
  {"ts": "<iso>", "slug": "<slug>", "scope": "global|project", "source_session": "<session-id>", "source_turns": "<N-M>"}
  ```
- Tell the user how to smoke-test:
  > "Open a fresh Claude Code session and ask: '<trigger phrase 1>' - confirm
  > the skill activates. Tell me if it doesn't."

## Failure modes

- **No stable workflow to skillify** - STOP, ask the user to point at turns
- **Existing skill collides** - propose updating the existing skill instead;
  do not silently overwrite
- **User keeps iterating in step 4** - after 2 redraft cycles, fall back to
  "save current draft OR cancel"
- **Workflow uses tools the user can't grant** - list them, ask the user to
  approve via `allowed-tools` before write

## --discover mode (autonomous, MemoryMaster-backed)

When the user invokes `/skillify --discover`, find skill candidates by mining
**MemoryMaster topic clusters** - NOT tool-sequence JSONL traces. Tool
sequences (`Bash -> Read -> Edit`) are mechanical noise; what makes a skill is a
RECURRING USER INTENT ("debug Supabase RLS", "deploy a Saleor storefront",
"audit a CRM database"). Those intents live in MM as recurring `subject` +
`claim_type` clusters.

### Step 1 - survey topics from MemoryMaster

Pull a wide sample of recent claims and aggregate by `subject`:

```
mcp__memorymaster__list_claims(limit=500, status="confirmed")
```

In-memory, group the returned claims by `subject`. For each subject, count
claims per `claim_type` (DECISION, GOTCHA, ARCHITECTURE, CONSTRAINT, REFERENCE,
ENVIRONMENT). This gives a per-topic profile.

### Step 2 - apply the skill-candidacy heuristic

For each topic (subject), classify as:

- **strong skill candidate** - >=5 claims AND the mix is >=40% (DECISION + GOTCHA + CONSTRAINT). High-volume + lots of operational knowledge = workflow worth codifying.
- **hot pattern, watch** - >=3 claims with `created_at` in the last 30 days, regardless of type mix. Something is happening; might mature into a skill later.
- **wiki article candidate, not a skill** - >=5 claims but the mix is >=60% REFERENCE. This is reference knowledge, not procedural; route to `/wiki breakdown` instead.
- **observational only** - fewer than 5 claims OR no clear type bias. Skip.

Sort strong candidates by `(DECISION + GOTCHA + CONSTRAINT count) / total count`
descending. Take the top N (default 3).

### Step 3 - enrich each top candidate

For each top candidate subject, pull its actual claims:

```
mcp__memorymaster__query_memory(query=<subject>, top_k=10)
```

Read the claim text. Extract:

- the recurring decisions (what choices keep getting made)
- the gotchas (what keeps going wrong)
- the constraints (what's non-negotiable)
- any referenced commands, file paths, MCP tools

### Step 4 - draft a SKILL.md per candidate

Use the same frontmatter contract as the post-execution mode (see step 3 of the
six-step flow above). The procedure section is synthesized from the cluster's
DECISION + CONSTRAINT claims (what to do); the "Failure modes" section from the
GOTCHA claims (what goes wrong); the "When to use" from the cluster's
characteristic subject.

### Step 5 - approval gate per candidate (NON-NEGOTIABLE)

For **EACH** top candidate, show the user via `AskUserQuestion`:
- option A: "Save as a new skill" - write to the chosen location, append to `.skillify-log.jsonl`
- option B: "Edit first - I'll tell you what to change"
- option C: "Skip this one"
- option D: "This is reference, not a skill - make a wiki article instead" -> run `/wiki breakdown` for that subject

**Per-skill approval is mandatory.** User feedback `mm-97b3~3` (2026-05-12): "next time, don't do it directly, consult with me". A general "keep going" or "do another one" approval at the top of the session does NOT pre-approve subsequent skills. Each SKILL.md commit needs its own explicit approval immediately before write. Why: skills auto-activate on description match in every future session - an unwanted skill silently shapes behavior across projects, so the user is the only authority on whether the synthesized content matches the workflow they want.

### Step 6 - optional: also score with the eval scaffolding

If the user wants a quality check before saving, run the candidate through
`G:/tmp/claude-skill-tooling/skill-eval/promote.py` with `--target
C:/Users/pauol/.claude/skills/` (dry-run by default). The cross-modal eval
adapters there are MOCK-scored today; they're scaffold signals only until
real API calls are wired.

### Why this differs from the tool-sequence miner

There's a separate trace miner at `~/.claude/scripts/skill-miner/` that mines
`~/.claude/projects/*.jsonl` for repeated tool sequences. That tool answers
"which low-level tool combos repeat" - useful for perf-tuning Claude Code
itself, NOT for finding skill-worthy workflows. Its `manifest.json` (e.g.
`Bash(ls-*) -> Read -> Read`) is noise for skill discovery and should NOT feed
`/skillify --discover`. Keep the trace miner around for its own purpose; don't
read its output here.

## References

- gstack /skillify - github.com/garrytan/gstack (one-shot codification model)
- Anthropic /skill-creator - `~/.claude/skills/skill-creator/SKILL.md` (frontmatter contract)
- Hermes self-evolution - github.com/NousResearch/hermes-agent-self-evolution (Phase B target)
- MemoryMaster claim `mm-37f8` - the bundle of references that motivated this skill
