#!/usr/bin/env node
// project-doctor checker — read-only. Reports a table of PASS/WARN/FAIL/SKIP
// rows for the project rooted at the current working directory.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const cwd = process.cwd();
const home = os.homedir();

const results = [];
function row(check, verdict, detail) {
  results.push({ check, verdict, detail: detail || '' });
}

function exists(rel) {
  try { return fs.existsSync(path.resolve(cwd, rel)); } catch { return false; }
}

function readSafe(rel) {
  try { return fs.readFileSync(path.resolve(cwd, rel), 'utf8'); } catch { return null; }
}

// Minimal YAML frontmatter parser (handles flat key: value pairs, list items)
function parseFrontmatter(text) {
  if (!text) return null;
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const obj = {};
  let currentKey = null;
  for (const rawLine of m[1].split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;
    if (line.startsWith('  - ') || line.startsWith('- ')) {
      const item = line.replace(/^\s*-\s*/, '').replace(/^["']|["']$/g, '');
      if (currentKey) {
        if (!Array.isArray(obj[currentKey])) obj[currentKey] = [];
        obj[currentKey].push(item);
      }
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const v = kv[2].trim().replace(/^["']|["']$/g, '');
      obj[currentKey] = v === '' ? null : v;
    }
  }
  return obj;
}

// --- Check: monitoring.md ---
const monPath = 'monitoring.md';
const monExists = exists(monPath);
if (!monExists) {
  row('monitoring.md exists', 'FAIL', 'No monitoring.md in project root. Run /monitoring-setup.');
} else {
  row('monitoring.md exists', 'PASS', '');
  const monText = readSafe(monPath);
  const fm = parseFrontmatter(monText);
  if (!fm) {
    row('monitoring.md parses', 'FAIL', 'Frontmatter missing or unparseable. Re-run /monitoring-setup.');
  } else {
    row('monitoring.md parses', 'PASS', `${Object.keys(fm).length} keys`);

    // watchdog
    const wd = fm.watchdog;
    if (!wd) {
      row('watchdog: defined', 'WARN', 'watchdog frontmatter key missing');
    } else if (wd === 'manual' || wd.startsWith('manual')) {
      row('watchdog: defined', 'PASS', 'manual');
    } else if (wd.includes('/') || wd.endsWith('.sh') || wd.endsWith('.ts') || wd.endsWith('.js')) {
      // looks like a path
      const candidate = wd.split(/[\s:]/)[0]; // strip prefix like "while-loop:foo.sh"
      const pathPart = candidate.includes(':') ? candidate.split(':').slice(-1)[0] : candidate;
      if (exists(pathPart)) {
        row('watchdog: script exists', 'PASS', pathPart);
      } else {
        row('watchdog: script exists', 'WARN', `path "${pathPart}" not found — possibly stale`);
      }
    } else {
      row('watchdog: descriptor', 'PASS', `free-text: "${wd.slice(0, 40)}"`);
    }

    // roadmap_file
    if (fm.roadmap_file) {
      row('roadmap_file resolves', exists(fm.roadmap_file) ? 'PASS' : 'WARN',
        exists(fm.roadmap_file) ? fm.roadmap_file : `"${fm.roadmap_file}" not found`);
    } else {
      row('roadmap_file resolves', 'SKIP', 'no roadmap_file key');
    }

    // state_checkpoint
    if (fm.state_checkpoint) {
      row('state_checkpoint resolves', exists(fm.state_checkpoint) ? 'PASS' : 'WARN',
        exists(fm.state_checkpoint) ? fm.state_checkpoint : `"${fm.state_checkpoint}" not found`);
    } else {
      row('state_checkpoint resolves', 'SKIP', 'no state_checkpoint key');
    }

    // telegram chat id
    const chatId = fm.telegram_chat_id || fm.chat_id;
    if (chatId) {
      if (chatId === 'CHANGEME_CHAT_ID' || chatId.includes('CHANGEME')) {
        row('telegram_chat_id is real', 'WARN', 'placeholder still present — replace with real chat ID');
      } else {
        row('telegram_chat_id is real', 'PASS', '');
      }
    } else {
      row('telegram_chat_id is real', 'SKIP', 'no telegram_chat_id key');
    }

    // skills referenced
    if (Array.isArray(fm.skills) && fm.skills.length > 0) {
      const missing = fm.skills.filter(s => !fs.existsSync(path.join(home, '.claude', 'skills', s, 'SKILL.md')));
      if (missing.length === 0) {
        row('referenced skills installed', 'PASS', `${fm.skills.length} skills`);
      } else {
        row('referenced skills installed', 'WARN', `missing: ${missing.join(', ')}`);
      }
    } else {
      row('referenced skills installed', 'SKIP', 'no skills key');
    }
  }
}

// --- Check: AGENTS.md / CLAUDE.md ---
row('AGENTS.md exists', exists('AGENTS.md') ? 'PASS' : 'WARN', exists('AGENTS.md') ? '' : 'consider adding shared agent guidance');
row('CLAUDE.md exists', exists('CLAUDE.md') ? 'PASS' : 'WARN', exists('CLAUDE.md') ? '' : 'consider adding Claude-specific project rules');

// --- Check: graphify freshness ---
const graphPath = path.resolve(cwd, 'graphify-out/GRAPH_REPORT.md');
if (fs.existsSync(graphPath)) {
  const mtime = fs.statSync(graphPath).mtimeMs;
  const ageDays = (Date.now() - mtime) / (1000 * 60 * 60 * 24);
  if (ageDays > 30) {
    row('graphify report fresh', 'WARN', `${ageDays.toFixed(0)} days old — re-run /graphify`);
  } else {
    row('graphify report fresh', 'PASS', `${ageDays.toFixed(0)} days old`);
  }
} else {
  row('graphify report fresh', 'SKIP', 'no graphify-out/ — run /graphify if you want one');
}

// --- Check: .claude/settings.json valid ---
const localSettings = '.claude/settings.json';
if (exists(localSettings)) {
  try {
    JSON.parse(readSafe(localSettings));
    row('.claude/settings.json valid JSON', 'PASS', '');
  } catch (e) {
    row('.claude/settings.json valid JSON', 'FAIL', e.message);
  }
} else {
  row('.claude/settings.json valid JSON', 'SKIP', 'no .claude/settings.json');
}

// --- Check: git worktree status ---
try {
  const status = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const dirty = status.split('\n').filter(l => l.trim()).length;
  row('git worktree status', 'INFO', dirty === 0 ? 'clean' : `${dirty} uncommitted entries`);
} catch {
  row('git worktree status', 'SKIP', 'not a git repo');
}

// --- Render table ---
const widths = [
  Math.max(28, ...results.map(r => r.check.length)),
  6,
  Math.max(20, ...results.map(r => r.detail.length))
];
function pad(s, w) { return (s + ' '.repeat(w)).slice(0, w); }
const sep = '+' + '-'.repeat(widths[0] + 2) + '+' + '-'.repeat(widths[1] + 2) + '+' + '-'.repeat(widths[2] + 2) + '+';

console.log(sep);
console.log('| ' + pad('check', widths[0]) + ' | ' + pad('verdict', widths[1]) + ' | ' + pad('detail', widths[2]) + ' |');
console.log(sep);
for (const r of results) {
  console.log('| ' + pad(r.check, widths[0]) + ' | ' + pad(r.verdict, widths[1]) + ' | ' + pad(r.detail, widths[2]) + ' |');
}
console.log(sep);

const counts = results.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a; }, {});
console.log('\nSummary:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join('  '));

const fail = (counts.FAIL || 0) > 0;
process.exit(fail ? 1 : 0);
