#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { expectedVisualReviews, imagePath, validVisualReview } = require('./validation-contract');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--state') out.state = argv[++i];
    else if (key === '--route') out.route = argv[++i];
    else if (key === '--breakpoint') out.breakpoint = argv[++i];
    else if (key === '--role') out.role = argv[++i];
    else if (key === '--theme') out.theme = argv[++i];
    else if (key === '--source-sha') out.sourceSha = argv[++i];
    else if (key === '--build-id') out.buildId = argv[++i];
    else if (key === '--reviewed-by') out.reviewedBy = argv[++i];
    else if (key === '--implementation-by') out.implementationBy = argv[++i];
    else if (key === '--status') out.status = argv[++i];
    else if (['--hierarchy', '--density', '--alignment', '--proportion', '--states'].includes(key)) {
      (out.analysis ||= {})[key.slice(2)] = argv[++i];
    }
    else if (key === '--screenshot') out.screenshot = argv[++i];
    else if (key === '--issue') (out.issues ||= []).push(argv[++i]);
    else if (key === '--help') out.help = true;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.state || !args.route || !args.breakpoint || !args.role || !args.theme ||
      !args.sourceSha || !args.buildId || !args.status || !args.analysis || !args.screenshot) {
    console.error('Usage: node record-visual-review.js --state <file> --route <id> --breakpoint <name> --role <id> --theme <id> --source-sha <sha> --build-id <id> --screenshot <path> --status pass|fail --hierarchy <observation> --density <observation> --alignment <observation> --proportion <observation> --states <observation> [--reviewed-by <id> --implementation-by <id> for design gate] [--issue <text>]');
    process.exit(args.help ? 0 : 2);
  }
  const file = path.resolve(args.state);
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const id = `${args.role}:${args.theme}:${args.route}:${args.breakpoint}`;
  const screenshotFile = imagePath(args.screenshot, { stateFile: file, projectRoot: state.session?.projectRoot });
  if (!screenshotFile || !fs.existsSync(screenshotFile) || !fs.statSync(screenshotFile).isFile()) {
    console.error('Screenshot is missing or is not a file.');
    process.exit(2);
  }
  const review = {
    id,
    type: 'visual-review',
    status: args.status,
    analysis: args.analysis,
    screenshot: args.screenshot,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(screenshotFile)).digest('hex'),
    role: args.role,
    theme: args.theme,
    route: args.route,
    breakpoint: args.breakpoint,
    sourceSha: args.sourceSha,
    buildId: args.buildId,
    reviewedBy: args.reviewedBy || null,
    implementationBy: args.implementationBy || null,
    issues: args.issues || [],
    reviewedAt: new Date().toISOString(),
  };
  if (!expectedVisualReviews(state).some(cell => cell.id === id) ||
      !validVisualReview(review, review, state, { stateFile: file, designGate: state.config?.designGate })) {
    console.error('Review does not match state identity, route screenshot, or concrete observations.');
    process.exit(2);
  }
  state.results ||= {};
  state.results.visualReviews ||= {};
  state.results.visualReviews[id] = review;
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
