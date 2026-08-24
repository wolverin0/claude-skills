#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { evaluateCoverage } = require('./validation-contract');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--state') out.state = argv[++i];
    else if (argv[i] === '--config') out.config = argv[++i];
    else if (argv[i] === '--help') out.help = true;
  }
  return out;
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is missing or invalid (${file}): ${error.message}`);
  }
}

function writeAtomic(file, value) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.state) {
    console.error('Usage: node assert-coverage.js --state <validation-state.json> [--config validation.config.json]');
    process.exit(args.help ? 0 : 2);
  }
  const stateFile = path.resolve(args.state);
  const state = readJson(stateFile, 'validation state');
  const config = args.config ? readJson(path.resolve(args.config), 'validation config') : {};
  const coverage = evaluateCoverage(state, config);
  state.coverage = coverage;
  state.session.coverageComplete = coverage.coverageComplete;
  state.session.smokeScopeComplete = coverage.smokeScopeComplete;
  state.session.status = coverage.requestedScopeComplete ? 'completed' : 'incomplete';
  state.session.currentPhase = coverage.requestedScopeComplete ? 'report' : 'test';
  state.session.lastUpdatedAt = new Date().toISOString();
  writeAtomic(stateFile, state);
  console.log(JSON.stringify(coverage, null, 2));
  process.exit(coverage.requestedScopeComplete ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
