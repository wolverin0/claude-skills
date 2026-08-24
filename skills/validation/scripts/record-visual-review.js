#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--state') out.state = argv[++i];
    else if (key === '--route') out.route = argv[++i];
    else if (key === '--breakpoint') out.breakpoint = argv[++i];
    else if (key === '--status') out.status = argv[++i];
    else if (key === '--analysis') out.analysis = argv[++i];
    else if (key === '--screenshot') out.screenshot = argv[++i];
    else if (key === '--issue') (out.issues ||= []).push(argv[++i]);
    else if (key === '--help') out.help = true;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.state || !args.route || !args.breakpoint || !args.status || !args.analysis) {
    console.error('Usage: node record-visual-review.js --state <file> --route <id> --breakpoint <name> --status pass|fail --analysis <text> [--screenshot <path>] [--issue <text>]');
    process.exit(args.help ? 0 : 2);
  }
  if (!['pass', 'fail'].includes(args.status) || args.analysis.trim().length < 20) {
    console.error('Visual review requires status pass|fail and analysis of at least 20 characters.');
    process.exit(2);
  }
  const file = path.resolve(args.state);
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const id = `${args.route}:${args.breakpoint}`;
  state.results ||= {};
  state.results.visualReviews ||= {};
  state.results.visualReviews[id] = {
    id,
    type: 'visual-review',
    status: args.status,
    analysis: args.analysis.trim(),
    screenshot: args.screenshot || null,
    issues: args.issues || [],
    reviewedAt: new Date().toISOString(),
  };
  if (state.queues && Array.isArray(state.queues.visualReviews)) {
    state.queues.visualReviews = state.queues.visualReviews.filter(item => item !== id);
  }
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, file);
  console.log(JSON.stringify({ ok: true, id }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
