#!/usr/bin/env node
'use strict';

// handoff-guard.cjs — Claude Code PreCompact hook (snippet: assets/settings-hooks.json).
//
// Reads the hook JSON on stdin and looks in <cwd>/handoffs/ for a published,
// checksum-valid handoff of THIS session and project (handoff-contract.cjs),
// created within HANDOFF_GUARD_MAX_AGE_MIN minutes (default 60).
//   manual /compact, none found -> exit 2: compaction is blocked and the user
//                                  is told to run /handoff first.
//   auto compaction             -> never blocked (blocking an auto compaction
//                                  that recovers from a context-limit error
//                                  fails the request); stdout becomes summary
//                                  instructions instead.
//   found                       -> exit 0; stdout tells the summary to keep
//                                  the handoff file and corr.
// It never writes a handoff: only the /handoff skill authors one.
// HANDOFF_GUARD=off disables it.

const fs = require('node:fs');
const path = require('node:path');
const contract = require(path.join(__dirname, 'handoff-contract.cjs'));

function readStdin() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

function findHandoff(cwd, sessionId, maxAgeMin, now = Date.now()) {
  // Read-only: contract.handoffsDirectory() would create the folder.
  let directory;
  try {
    directory = path.join(fs.realpathSync(cwd), 'handoffs');
    const st = fs.lstatSync(directory);
    if (!st.isDirectory() || st.isSymbolicLink()) return { status: 'none' };
  } catch { return { status: 'none' }; }
  const projectId = contract.projectIdentity(cwd);
  let newest = null;
  for (const name of fs.readdirSync(directory)) {
    if (!/^handoff-[0-9a-f-]{36}\.md$/i.test(name)) continue;
    const file = path.join(directory, name);
    try {
      if (fs.lstatSync(file).isSymbolicLink()) continue;
      const meta = contract.validatePublished(contract.readRegular(file), { session_id: sessionId, project_id: projectId });
      if (!newest || Date.parse(meta.created_at) > Date.parse(newest.meta.created_at)) newest = { name, meta };
    } catch { /* other session, other project, unfinished or tampered: not a usable checkpoint */ }
  }
  if (!newest) return { status: 'none' };
  const ageMin = (now - Date.parse(newest.meta.created_at)) / 60000;
  return { status: ageMin <= maxAgeMin ? 'fresh' : 'stale', ageMin, ...newest };
}

function main() {
  if ((process.env.HANDOFF_GUARD || '').toLowerCase() === 'off') return 0;
  const input = readStdin();
  if (input.hook_event_name && input.hook_event_name !== 'PreCompact') return 0;
  const maxAgeMin = Number(process.env.HANDOFF_GUARD_MAX_AGE_MIN || 60);
  const cwd = input.cwd || process.cwd();
  const sessionId = input.session_id;
  const manual = input.trigger === 'manual';
  const found = sessionId ? findHandoff(cwd, sessionId, maxAgeMin) : { status: 'none' };

  if (found.status === 'fresh') {
    process.stdout.write(
      `A verified handoff for this session exists: handoffs/${found.name} ` +
      `(corr ${found.meta.corr}, generation ${found.meta.generation}, ${Math.round(found.ageMin)} min old). ` +
      'Keep that path and corr verbatim in the summary and tell the next turn to validate and read it before continuing.\n');
    return 0;
  }
  const why = found.status === 'stale'
    ? `the newest verified handoff for this session (handoffs/${found.name}) is ${Math.round(found.ageMin)} min old`
    : 'no verified handoff exists for this session';
  if (manual) {
    process.stderr.write(`Compaction blocked: ${why}. Run /handoff first, then /compact again ` +
      '(or set HANDOFF_GUARD=off for this compaction).\n');
    return 2;
  }
  process.stdout.write(`Before this automatic compaction, ${why}. ` +
    'In the summary, list unfinished work, pending decisions and the exact files touched, and state that ' +
    'no fresh handoff covers this point: the next turn should ask the user to run /handoff before relying on it.\n');
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { findHandoff };
