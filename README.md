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
**Purpose:** Comprehensive web app validation with REAL browser testing and evidence-based reporting

Automatically discovers and tests ALL interactive elements in your web application across 4 breakpoints (mobile, tablet, laptop, desktop). Tests with actual browser interactions, not just static analysis.

**Key Features:**
- **Comprehensive discovery** - Finds every button, link, form, and input
- **Real verification** - Clicks elements and verifies outcomes actually happened
- **Screenshot analysis** - Captures AND analyzes screenshots at each breakpoint
- **Console error checking** - Checks for JavaScript errors after every interaction
- **Session persistence** - Resume testing across context resets without losing progress
- **HTML reports** - Persistent, evidence-based reports with screenshots
- **Automatic cleanup** - Removes test artifacts after validation

**Typical workflow:**
1. **PRE-FLIGHT:** Verify dev server is running
2. **DISCOVER:** Find all routes, elements, and critical flows
3. **TEST:** Test each element at all breakpoints with verification
4. **REPORT:** Generate HTML report with evidence

**Usage:**
```bash
/validate http://localhost:3000
/validate --resume    # Resume from previous state
/validate --fresh     # Start fresh validation
```

**Output:** Persistent HTML reports in `test-manifest/reports/` with:
- Screenshots for every element at every breakpoint
- Console errors found during testing
- Passed/failed tests with evidence
- UI issues identified

**[Full Documentation →](skills/validation/README.md)**

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
- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [Claude-in-Chrome MCP Extension](https://github.com/anthropics/claude-in-chrome) - Browser automation via MCP
- Running web application (dev server or static site)

### For Retrospective Learning
- Claude Code (already required for skills)
- Session transcripts must be accessible at `~/.claude/projects/{project-slug}/*.jsonl`

---

## 📖 Documentation

### Skills
- **[Debate Skill Documentation](skills/debate/README.md)** - Full debate skill usage guide
- **[Validation Skill Documentation](skills/validation/README.md)** - Comprehensive app validation guide
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
