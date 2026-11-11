#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { evaluateCoverage } = require('./validation-contract');
const { renderReport } = require('./assert-coverage');

function main(argv) {
  const stateIndex = argv.indexOf('--state');
  const configIndex = argv.indexOf('--config');
  if (stateIndex < 0 || !argv[stateIndex + 1] || configIndex < 0 || !argv[configIndex + 1]) {
    console.error('Usage: node certify-validation.js --state <validation-state.json> --config <validation.config.json> [--target-source-sha <sha>] [--target-build-id <id>]');
    return 2;
  }
  const stateFile = path.resolve(argv[stateIndex + 1]);
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const config = JSON.parse(fs.readFileSync(path.resolve(argv[configIndex + 1]), 'utf8'));
  const targetSourceIndex = argv.indexOf('--target-source-sha');
  const targetBuildIndex = argv.indexOf('--target-build-id');
  const coverage = evaluateCoverage(state, config, { stateFile,
    targetSourceSha: targetSourceIndex >= 0 ? argv[targetSourceIndex + 1] : undefined,
    targetBuildId: targetBuildIndex >= 0 ? argv[targetBuildIndex + 1] : undefined });
  state.coverage = coverage;
  state.session.coverageComplete = coverage.coverageComplete;
  state.session.smokeScopeComplete = coverage.smokeScopeComplete;
  state.session.status = coverage.certifiable ? 'completed' : 'incomplete';
  state.session.currentPhase = coverage.certifiable ? 'report' : 'test';
  state.session.lastUpdatedAt = new Date().toISOString();
  state.session.completedAt = coverage.certifiable ? state.session.lastUpdatedAt : null;
  renderReport(state, config, stateFile, coverage);
  const tmp = `${stateFile}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, stateFile);
  console.log(JSON.stringify({ certifiable: coverage.certifiable, coverageComplete: coverage.coverageComplete,
    healthPassed: coverage.healthPassed, unaccounted: coverage.unaccounted,
    identityFailures: coverage.identityFailures,
    healthFailures: coverage.healthFailures, report: state.report.path }, null, 2));
  return coverage.certifiable ? 0 : 1;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
