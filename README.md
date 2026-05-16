# AI Debate Hub

A collection of Claude Code skills and tools for enhanced development workflows.

---

## 📁 Project Structure

```
ai-debate-hub/
├── skills/               # Claude Code skills
│   ├── debate/          # Three-way debate skill
│   └── validation/      # Comprehensive app validation skill
├── tools/               # Reusable tools and frameworks
│   ├── retrospective-learning.md
│   ├── RETROSPECTIVE-LEARNING-INTEGRATION-GUIDE.md
│   └── sample/          # Reference implementations
│       ├── feature-validation-SKILL.md
│       └── report-template.html
├── debates/             # Generated debate transcripts
└── tests/               # Test files
```

---

## 🎯 Skills

### Debate Skill
**Location:** `skills/debate/`
**Purpose:** Three-way debates between Claude, Gemini CLI, and OpenAI Codex CLI

Claude is both a **participant and moderator**, contributing its own analysis alongside other AI advisors. Enables multi-round discussions where all three systems analyze problems independently and converge on recommendations through genuine debate.

**Key Features:**
- Multi-round debates (1-10 rounds configurable)
- Session persistence across rounds
- Multiple debate styles: quick, thorough, adversarial, collaborative
- Automatic synthesis of perspectives
- Web viewer for debate visualization

**Usage:**
```bash
/debate Should we use Redis or in-memory cache for our session store?
/debate -r 3 -d thorough Review our authentication implementation
```

**[Full Documentation →](skills/debate/README.md)**

---

### Validation Skill
**Location:** `skills/validation/`
**Purpose:** CLI-agnostic browser validation with evidence-based reporting.

Discovers routes, elements, and critical flows, then validates them in a real browser with screenshots, redacted snapshots, console/error checks, failed-network grouping, observed outcomes, resumable state, and an HTML report.

**Backend strategy:**
- Default: `agent-browser`
- Fallbacks/adapters: project-local Playwright, `playwright-cli`, Playwright MCP, Claude/Codex Chrome MCP tools, and `browser-harness`

**Usage:**
```bash
/validate http://localhost:3000
/validate --interactive
/validate --backend agent-browser --mode standard http://localhost:5173
/validate --backend playwright-local --config validation.config.json --mode standard http://localhost:5173
/validate --fresh
/validate --resume
```

For deterministic runs, `skills/validation/scripts/select-backend.js` can recommend the available backend from the target project before execution.

**Output:** `test-manifest/validation-state.json`, evidence files under `test-manifest/evidence/`, and HTML reports under `test-manifest/reports/`. Project-local Playwright runs may use `validation.config.json` for route expectations, permission-aware access-denied handling, breakpoints, and extra redaction values.

---

### Audit Skill Bundle
**Location:** `skills/audit/`
**Purpose:** Multi-skill technical due diligence pipeline for codebase audits.

The bundle includes the audit orchestrator, setup method, hard-stop checks, Tambon hunt, blind-spot walk, 13 domain audits, audit decision handling, fix-prompt generation, and audit-loop iteration.

Install all audit skills by copying the children of `skills/audit/` into your active skill root:

```bash
cp -r skills/audit/* ~/.codex/skills/
cp -r skills/audit/* ~/.claude/skills/
```

Primary entry points:

- `audit-orchestrator`: full `/audit` style due diligence.
- `audit-loop`: audit, roadmap, remediation, rerun, and skill patching loop.
- `audit-fix-generator`: produce remediation prompts for individual findings.

---

### Project And Handoff Skills
**Location:** `skills/project-setup/`, `skills/project-curate/`, `skills/project-doctor/`, `skills/handoff/`, `skills/skillify/`

These are reusable workflow skills:

- `project-setup`: generate or refresh `CLAUDE.md` and `AGENTS.md` from a real codebase.
- `project-curate`: tune a project's `.claude/` directory with targeted rules/skills/agents.
- `project-doctor`: read-only audit of project orchestration scaffolding.
- `handoff`: write a structured session handoff for clean context transfer.
- `skillify`: turn a successful repeated workflow into a reusable skill.

---

### MercadoPago Integration Skill
**Location:** `skills/mercadopago-integration/`
**Purpose:** MercadoPago OAuth/payment integration guidance for Supabase/React-style apps.

The repo copy was checked against the installed skill copies; content differences were line-ending-only for the compared files, so the repo version remains the canonical copy.

---

### Feature Validation (Example Skill)
**Location:** `tools/sample/feature-validation-SKILL.md`
**Purpose:** Reference implementation showing retrospective learning integration

This is an **example skill** demonstrating how retrospective learning has been integrated into a real-world validation skill. It includes:
- Phase 1: Trigger capture (reads session transcript)
- Phases 2-9: Feature testing workflow
- Phase 10: Retrospective (evidence-based self-evaluation)

**Use this as a reference** when integrating retrospective learning into your own skills.

**Report Template:** `tools/sample/report-template.html`

---

## 🛠️ Tools

### Retrospective Learning Module
**Location:** `tools/retrospective-learning.md`
**Purpose:** Enables skills to learn from execution through evidence-based retrospectives

A reusable module that adds self-evaluation and learning capabilities to any skill by:
1. **Capturing trigger context** - Documents why the skill was invoked
2. **Tracking execution** - Records all actions during execution
3. **Performing retrospectives** - Evaluates performance against original intent with session transcript evidence

**Key Benefits:**
- Skills learn from mistakes through line-cited evidence
- User corrections are documented as lessons
- Skill improvements suggested based on actual execution
- Works with large session transcripts (> 256KB handled correctly)

**Features:**
- Cross-platform (Windows/macOS/Linux)
- Size-aware transcript reading
- Evidence-based self-assessment
- Skill improvement recommendations

**[Full Documentation →](tools/retrospective-learning.md)**

---

### Retrospective Learning Integration Guide
**Location:** `tools/RETROSPECTIVE-LEARNING-INTEGRATION-GUIDE.md`
**Purpose:** Step-by-step guide for adding retrospective learning to your skills

A practical guide showing how to integrate the retrospective learning module into existing skills with minimal changes.

**What it provides:**
- Copy-paste prompt template for Claude
- Real before/after example (353 → 528 lines, +49%)
- Section-by-section breakdown of what gets added
- Verification checklist to ensure correct integration
- Troubleshooting for common failures (rewrites, missing content)
- Actual diff showing feature-validation integration

**Quick Start:**
```
Backup my SKILL.md with timestamp, then apply retrospective-learning.md to it.

CRITICAL:
- Create backup: SKILL.md.backup-{timestamp}
- Modify SKILL.md directly
- DO NOT rewrite existing content
- ONLY add Phase 1 trigger capture + final phase retrospective
- Renumber phases correctly
- Line count should increase ~40-60% (not double)

Use feature-validation-SKILL.md as reference.
```

**[Full Integration Guide →](tools/RETROSPECTIVE LEARNING-INTEGRATION-GUIDE.md)**

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/wolverin0/ai-debate-hub.git
cd ai-debate-hub
```

### 2. Install Skills

Copy skills to your Claude Code skills directory:

```bash
# Debate skill
cp -r skills/debate ~/.claude/skills/

# Validation skill
cp -r skills/validation ~/.claude/skills/

# Audit bundle
cp -r skills/audit/* ~/.claude/skills/

# Workflow skills
cp -r skills/handoff skills/skillify skills/project-setup skills/project-curate skills/project-doctor ~/.claude/skills/

# Or link instead of copy
ln -s $(pwd)/skills/debate ~/.claude/skills/debate
ln -s $(pwd)/skills/validation ~/.claude/skills/validation
```

### 3. Use the Skills

**Debate skill:**
```bash
# Basic usage
/debate Should we implement feature X?

# With options
/debate -r 3 -d thorough Review our API design
```

**Validation skill:**
```bash
# Basic usage
/validate http://localhost:3000

# With options
/validate --resume    # Resume from previous validation
/validate --fresh     # Start fresh
```

### 4. Add Retrospective Learning to Your Skills

Follow the [Retrospective Learning Integration Guide](tools/RETROSPECTIVE LEARNING-INTEGRATION-GUIDE.md) to add self-evaluation capabilities to your own skills.

---

## 📊 Debate Viewer

The debate skill generates a web-based viewer for visualizing debates:

```bash
cd debates
python -m http.server 8000
# Open http://localhost:8000/viewer.html
```

**Viewer features:**
- Side-by-side round comparison (all 3 participants)
- Synthesis view (final recommendations)
- Full chronological transcript
- State/metadata debug view

---

## 🔧 Requirements

### For Debate Skill
- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - `npm install -g @google/gemini-cli`
- [OpenAI Codex CLI](https://github.com/openai/codex) - `npm install -g openai-codex`

### For Validation Skill
- Running web application (dev server or static site)
- Recommended backend: `agent-browser`
- Optional backends: `playwright-cli`, Playwright MCP, Claude/Codex Chrome MCP tools, or `browser-harness`

### For Retrospective Learning
- Claude Code (already required for skills)
- Session transcripts must be accessible at `~/.claude/projects/{project-slug}/*.jsonl`

---

## 📖 Documentation

### Skills
- **[Debate Skill Documentation](skills/debate/README.md)** - Full debate skill usage guide
- **[Validation Skill](skills/validation/SKILL.md)** - Adapter-based browser validation skill
- **[Feature Validation Example](tools/sample/feature-validation-SKILL.md)** - Reference implementation with retrospective learning

### Tools
- **[Retrospective Learning Module](tools/retrospective-learning.md)** - Technical documentation for the retrospective learning module
- **[Integration Guide](tools/RETROSPECTIVE-LEARNING-INTEGRATION-GUIDE.md)** - How to add retrospective learning to your skills

---

## 🎨 Example: Retrospective Learning in Action

**Before integration:**
```markdown
## Phase 1: Analyze Implementation
git diff --name-only HEAD~5

## Phase 2: Plan Test Scenarios
...
## Phase 9: Generate HTML Report
```

**After integration (+175 lines, +49%):**
```markdown
## 🚨 CRITICAL BLOCKERS
You MUST read session transcript before and after execution

## Phase 1: Analyze Implementation
**🚨 MANDATORY: Identify Trigger Context from Session Transcript**
[80 lines of trigger capture instructions]

git diff --name-only HEAD~5

## Phase 2-9: [Original content, renumbered]
...

## Phase 10: Retrospective & Learning
**🚨 MANDATORY: Read Session Transcript for Evidence-Based Retrospective**
[80 lines of self-evaluation instructions with line citations]
```

**Result:** Skill now captures why it was invoked, tracks actions, and performs evidence-based retrospectives citing actual transcript line numbers.

---

## 🤝 Contributing

Contributions welcome! Areas of interest:
- New debate styles or moderator modes
- Additional skills with retrospective learning integration
- Improvements to retrospective learning module
- Better visualization in debate viewer
- Bug fixes and documentation improvements

**To contribute:**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **Repository:** [github.com/wolverin0/ai-debate-hub](https://github.com/wolverin0/ai-debate-hub)
- **Issues:** [Report bugs or request features](https://github.com/wolverin0/ai-debate-hub/issues)
- **Claude Code:** [anthropics/claude-code](https://github.com/anthropics/claude-code)

---

## 📝 Version History

- **v1.0.0** - Initial release
  - Debate skill with three-way participation
  - Auto-healing module and integration guide
  - Feature validation reference implementation
  - Web-based debate viewer

---

**Built with Claude Code**
Demonstrating self-improving skills through retrospective learning and collaborative AI debate.
