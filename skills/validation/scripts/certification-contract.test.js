#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.join(__dirname, 'certify-validation.js');
const accountingScript = path.join(__dirname, 'assert-coverage.js');
const recorderScript = path.join(__dirname, 'record-visual-review.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'validation-cert-'));
const screenshot = path.join(temp, 'customer-mobile.png');
const tabletScreenshot = path.join(temp, 'customer-tablet.png');
const desktopScreenshot = path.join(temp, 'customer-desktop.png');
const stateFile = path.join(temp, 'state.json');
const configFile = path.join(temp, 'config.json');
fs.writeFileSync(screenshot, 'synthetic image bytes');
fs.writeFileSync(tabletScreenshot, 'synthetic tablet image');
fs.writeFileSync(desktopScreenshot, 'synthetic desktop image');
const defaultConfig = { inventoryComplete: true, sourceSha: 'source-sha-123', buildId: 'build-123',
  routes: [{ id: 'customers' }], elements: [{ id: 'create-customer' }] };
fs.writeFileSync(configFile, JSON.stringify(defaultConfig));
const digest = crypto.createHash('sha256').update(fs.readFileSync(screenshot)).digest('hex');
const digestOf = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const observation = {
  hierarchy: 'The customer heading precedes the primary action and table.',
  density: 'The rows retain enough space to scan names and status.',
  alignment: 'Labels and values share a stable column alignment.',
  proportion: 'The main table fills the content area without crowding controls.',
  states: 'The loaded list and empty search state remain understandable.',
};
const reviewId = 'admin:light:customers:mobile';
const base = {
  session: { mode: 'standard', sourceSha: 'source-sha-123', buildId: 'build-123', role: 'admin', theme: 'light' },
  config: { breakpoints: [{ name: 'mobile' }, { name: 'tablet' }, { name: 'desktop' }], roles: ['admin'], themes: ['light'] },
  discovery: { routes: [{ id: 'customers' }], elements: [{ id: 'create-customer' }], modals: [], flows: [], crudModules: [], apiEndpoints: [], truncation: {} },
  queues: { routes: [], elements: [], modals: [], flows: [], crud: [], api: [], visualReviews: [] },
  results: {
    routes: { customers: { status: 'pass', evidence: { screenshots: [screenshot, tabletScreenshot, desktopScreenshot] } } },
    elements: { 'create-customer': { status: 'pass', expected: 'Opens the create form', observed: 'The form opened' } },
    modals: {}, flows: {}, crud: {}, api: {},
    visualReviews: {
      [reviewId]: { status: 'pass', screenshot, sha256: digest, sourceSha: 'source-sha-123', buildId: 'build-123', role: 'admin', theme: 'light', route: 'customers', breakpoint: 'mobile', analysis: observation },
      'admin:light:customers:tablet': { status: 'pass', screenshot: tabletScreenshot, sha256: digestOf(tabletScreenshot), sourceSha: 'source-sha-123', buildId: 'build-123', role: 'admin', theme: 'light', route: 'customers', breakpoint: 'tablet', analysis: observation },
      'admin:light:customers:desktop': { status: 'pass', screenshot: desktopScreenshot, sha256: digestOf(desktopScreenshot), sourceSha: 'source-sha-123', buildId: 'build-123', role: 'admin', theme: 'light', route: 'customers', breakpoint: 'desktop', analysis: observation },
    },
  },
};
function run(change, configChange) {
  const state = structuredClone(base);
  change?.(state);
  const config = structuredClone(defaultConfig);
  configChange?.(config);
  fs.writeFileSync(configFile, JSON.stringify(config));
  fs.writeFileSync(stateFile, JSON.stringify(state));
  const result = spawnSync(process.execPath, [script, '--state', stateFile, '--config', configFile], { encoding: 'utf8' });
  return { status: result.status, state: JSON.parse(fs.readFileSync(stateFile, 'utf8')), output: result.stdout + result.stderr };
}
try {
  const unsafeLegacy = run(s => {
    s.results.visualReviews = { 'customers:mobile': { status: 'pass', analysis: 'Looks good, no issues found anywhere.' } };
    s.results.elements['create-customer'].status = 'fail';
  });
  assert.strictEqual(unsafeLegacy.status, 1, `legacy false green: ${unsafeLegacy.output}`);
  const valid = run();
  assert.strictEqual(valid.status, 0, valid.output);
  assert.strictEqual(valid.state.session.status, 'completed');
  const html = fs.readFileSync(valid.state.report.path, 'utf8');
  assert.ok(html.includes('customer-mobile.png'));
  assert.ok(html.includes('Opens the create form'));
  assert.ok(html.includes('The form opened'));
  assert.ok(html.includes(observation.proportion));
  const recorderState = structuredClone(base);
  delete recorderState.results.visualReviews[reviewId];
  recorderState.queues.visualReviews = [reviewId];
  const recordArgs = [recorderScript, '--state', stateFile, '--route', 'customers', '--breakpoint', 'mobile',
    '--role', 'admin', '--theme', 'light', '--source-sha', 'source-sha-123', '--build-id', 'build-123',
    '--screenshot', screenshot, '--status', 'pass',
    ...Object.entries(observation).flatMap(([key, value]) => [`--${key}`, value])];
  fs.writeFileSync(stateFile, JSON.stringify(recorderState));
  const badText = recordArgs.map((arg, index) => index === recordArgs.indexOf('--hierarchy') + 1
    ? 'Looks good, no issues found anywhere.' : arg);
  assert.strictEqual(spawnSync(process.execPath, badText, { encoding: 'utf8' }).status, 2);
  assert.strictEqual(spawnSync(process.execPath, recordArgs.map(arg => arg === screenshot
    ? path.join(temp, 'absent.png') : arg), { encoding: 'utf8' }).status, 2);
  assert.strictEqual(spawnSync(process.execPath, recordArgs, { encoding: 'utf8' }).status, 0);
  const recorded = JSON.parse(fs.readFileSync(stateFile, 'utf8')).results.visualReviews[reviewId];
  assert.strictEqual(recorded.sha256, digest);
  const cases = [
    ['missing-image', s => { s.results.visualReviews[reviewId].screenshot = path.join(temp, 'missing.png'); }],
    ['stale-image', s => { s.results.visualReviews[reviewId].sha256 = '0'.repeat(64); }],
    ['generic-review', s => { s.results.visualReviews[reviewId].analysis = 'Looks good, no issues found anywhere.'; }],
    ['state-fail', s => { s.results.elements['create-customer'].status = 'fail'; }],
    ['review-fail', s => { s.results.visualReviews[reviewId].status = 'fail'; }],
    ['role-conflict', s => { s.results.visualReviews[reviewId].role = 'buyer'; }],
    ['theme-conflict', s => { s.results.visualReviews[reviewId].theme = 'dark'; }],
    ['build-conflict', s => { s.results.visualReviews[reviewId].buildId = 'older-build'; }],
    ['missing-route-result', s => { delete s.results.routes.customers; }],
    ['missing-element-result', s => { delete s.results.elements['create-customer']; }],
    ['missing-role', s => { s.config.roles.push('buyer'); }],
    ['missing-theme', s => { s.config.themes.push('dark'); }],
  ];
  for (const [name, change] of cases) {
    const result = run(change);
    assert.strictEqual(result.status, 1, `${name}: ${result.output}`);
    assert.notStrictEqual(result.state.session.status, 'completed', name);
  }
  const targetChanged = run(null, c => { c.sourceSha = 'new-source'; c.buildId = 'new-build'; });
  assert.strictEqual(targetChanged.status, 1, `stale build accepted: ${targetChanged.output}`);
  const undeclaredRoute = run(null, c => { c.routes.push({ id: 'providers' }); });
  assert.strictEqual(undeclaredRoute.status, 1, `missing declared route accepted: ${undeclaredRoute.output}`);
  const undeclaredElement = run(null, c => { c.elements.push({ id: 'open-provider' }); });
  assert.strictEqual(undeclaredElement.status, 1, `missing declared element accepted: ${undeclaredElement.output}`);
  const missingIndependent = run(s => { s.session.implementationBy = 'builder'; }, c => { c.designGate = true; });
  assert.strictEqual(missingIndependent.status, 1, `missing independent review accepted: ${missingIndependent.output}`);
  const independent = run(s => {
    s.session.implementationBy = 'builder';
    for (const review of Object.values(s.results.visualReviews)) {
      review.implementationBy = 'builder';
      review.reviewedBy = 'separate-reviewer';
    }
  }, c => { c.designGate = true; });
  assert.strictEqual(independent.status, 0, independent.output);
  const selfReview = run(s => {
    s.session.implementationBy = 'builder';
    for (const review of Object.values(s.results.visualReviews)) {
      review.implementationBy = 'builder';
      review.reviewedBy = 'builder';
    }
  }, c => { c.designGate = true; });
  assert.strictEqual(selfReview.status, 1, `self review accepted: ${selfReview.output}`);
  const cliTargetState = structuredClone(base);
  fs.writeFileSync(stateFile, JSON.stringify(cliTargetState));
  fs.writeFileSync(configFile, JSON.stringify({ ...defaultConfig, sourceSha: undefined, buildId: undefined }));
  const cliTarget = spawnSync(process.execPath, [script, '--state', stateFile, '--config', configFile,
    '--target-source-sha', 'source-sha-123', '--target-build-id', 'build-123'], { encoding: 'utf8' });
  assert.strictEqual(cliTarget.status, 0, cliTarget.stdout + cliTarget.stderr);
  fs.writeFileSync(configFile, JSON.stringify(defaultConfig));
  const failedHealth = structuredClone(base);
  failedHealth.results.elements['create-customer'].status = 'fail';
  fs.writeFileSync(stateFile, JSON.stringify(failedHealth));
  const accounted = spawnSync(process.execPath, [accountingScript, '--state', stateFile, '--config', configFile], { encoding: 'utf8' });
  assert.strictEqual(accounted.status, 0, accounted.stdout + accounted.stderr);
  const accountedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  assert.strictEqual(accountedState.coverage.coverageComplete, true);
  assert.strictEqual(accountedState.coverage.healthPassed, false);
  assert.notStrictEqual(accountedState.session.status, 'completed');
  const scopedDir = path.join(temp, 'test-manifest', 'scoped');
  fs.mkdirSync(scopedDir, { recursive: true });
  const scopedFile = path.join(scopedDir, 'validation-state.json');
  const scoped = structuredClone(base);
  scoped.session.projectRoot = temp;
  scoped.results.routes.customers.evidence.screenshots = [screenshot, tabletScreenshot, desktopScreenshot].map(file => path.relative(temp, file));
  for (const item of Object.values(scoped.results.visualReviews)) item.screenshot = path.relative(temp, item.screenshot);
  fs.writeFileSync(scopedFile, JSON.stringify(scoped));
  const scopedResult = spawnSync(process.execPath, [script, '--state', scopedFile, '--config', configFile], { encoding: 'utf8' });
  assert.strictEqual(scopedResult.status, 0, scopedResult.stdout + scopedResult.stderr);
  console.log('certification-contract tests: pass');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
