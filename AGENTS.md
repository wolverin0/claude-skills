# AGENTS.md — claude-skills

Covers: repo layout, skill-editing rules (progressive disclosure, frontmatter
split Claude Code vs Codex, negative triggers, README/DOCS-MAP sync, path
sanitization), the exact verification commands, and the installer/compare tools.
Read before changing any skill. Canonical source of skills installed into
Claude Code (`~/.claude/skills/`) and Codex (`~/.codex/skills/`); nothing here
runs as a service.

## Layout

- `skills/<name>/` — one skill per folder: `SKILL.md` (frontmatter + short
  body), optional `references/`, `scripts/`, `assets/`, `agents/openai.yaml`
  (Codex UI and invocation policy). `skills/` root holds folders only.
- `skills/audit/` — the audit bundle: three entry-point skills
  (`audit-orchestrator`, `audit-loop`, `audit-fix-generator`); phase and
  domain modules in `audit-orchestrator/modules/` (no `SKILL.md`); each
  entry point ships an identical copy of the catalogs in `references/`.
- `commands/`, `agents/`, `hooks/`, `workflows/` — Claude Code slash commands,
  subagents, hook scripts and the `/audit-remediate` workflow script.
- `prompts/` — copy-paste run prompts; `tools/` — legacy docs and
  `tools/references/` (docs no skill installs); `tests/` — shell tests.
- `README.md` is the catalog and install guide; `DOCS-MAP.md` lists every
  document with its status.

## Rules for changing skills

- Progressive disclosure: keep `SKILL.md` short; move long material to
  `references/`, deterministic steps to `scripts/`, output templates to
  `assets/`. A skill must work from its own folder once copied: cite files
  relative to the skill, never another skill's folder or a machine path.
- Frontmatter: the six Agent Skills spec keys are portable; Claude Code-only
  keys (for example `disable-model-invocation`) are allowed but have no effect
  in Codex, which uses `agents/openai.yaml` `policy.allow_implicit_invocation`.
  `quick_validate.py` enforces this split.
- `description` says what triggers the skill and, where a sibling overlaps,
  when not to use it.
- Third-party skills (see README "Third-party skills") stay as found.
- Any change to a path, count, command or flag updates `README.md` and
  `DOCS-MAP.md` in the same commit.
- No personal absolute paths (use `~` or `<projects-root>`), secrets, `.env`,
  `.bak` or `.lock` files in commits.

## Verify before committing

```bash
for t in tests/*.sh; do bash "$t" || echo "FAILED: $t"; done   # includes quick_validate on every skill
python skills/skill-creator/scripts/quick_validate.py skills/<name>
node --test skills/validation/scripts/validation-contract.test.js
git diff --check
```

Run the shell tests on Linux or macOS with `jq` installed; under Git Bash
the JSON-validation case is skipped. CI (`.github/workflows/ci.yml`) runs the
same commands.

## Installed copies

`python skills/skill-creator/scripts/compare_installed_skills.py --target all`
compares repo skills with the installed ones and writes nothing.
`python tools/install_skills.py --profile <p> --dry-run` and
`--prune-orphans --dry-run` show what an install or prune would change; run
them without `--dry-run` only when the operator asks to install.
