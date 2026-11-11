#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { applyLimit, evaluateCoverage, modePolicy, normalizeMode } = require('./validation-contract');
const { isPassingSummary } = require('./validate-multirole');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validation-contract-'));
const stateFile = path.join(tempDir, 'state.json');
const imageFile = path.join(tempDir, 'route.png');
const desktopImageFile = path.join(tempDir, 'route-desktop.png');
const tabletImageFile = path.join(tempDir, 'route-tablet.png');
fs.writeFileSync(imageFile, 'synthetic image');
fs.writeFileSync(desktopImageFile, 'synthetic desktop image');
fs.writeFileSync(tabletImageFile, 'synthetic tablet image');
const imageHash = crypto.createHash('sha256').update(fs.readFileSync(imageFile)).digest('hex');
const desktopImageHash = crypto.createHash('sha256').update(fs.readFileSync(desktopImageFile)).digest('hex');
const tabletImageHash = crypto.createHash('sha256').update(fs.readFileSync(tabletImageFile)).digest('hex');
const options = { stateFile };
const analysis = {
  hierarchy: 'The page heading clearly leads into the main content.',
  density: 'The controls have enough spacing for readable scanning.',
  alignment: 'The inputs remain aligned with their visible labels.',
  proportion: 'The content occupies the viewport without crowding.',
  states: 'The loaded and empty states are both clear to read.',
};
const review = { status: 'pass', analysis, screenshot: imageFile, sha256: imageHash,
  role: 'public', theme: 'default', sourceSha: 'test-source', buildId: 'test-build', route: 'home' };
const evaluate = (state, config) => evaluateCoverage(state, config, options);

const responsiveAuditSource = fs.readFileSync(path.join(__dirname, 'responsive-audit.js'), 'utf8');
assert.ok(responsiveAuditSource.includes("push('mobile-scroll-container', 'high'"));
assert.ok(responsiveAuditSource.includes("data-validation-horizontal-scroll') !== 'allow'"));

assert.strictEqual(normalizeMode('full'), 'exhaustive');
assert.strictEqual(modePolicy('standard').defaultMaxRoutes, null);
assert.strictEqual(modePolicy('smoke').defaultMaxRoutes, 6);
assert.deepStrictEqual(applyLimit([1, 2, 3], 2), { items: [1, 2], truncated: true, limit: 2 });

const completeState = {
  session: { mode: 'standard', role: 'public', theme: 'default', sourceSha: 'test-source', buildId: 'test-build' },
  config: { breakpoints: [{ name: 'mobile' }, { name: 'tablet' }, { name: 'desktop' }] },
  discovery: {
    routes: [{ id: 'home' }],
    elements: [{ id: 'home-menu' }],
    modals: [], flows: [], crudModules: [], apiEndpoints: [], truncation: {},
  },
  queues: { routes: [], elements: [], modals: [], flows: [], crud: [], api: [], visualReviews: [] },
  results: {
    routes: { home: { status: 'pass', evidence: { screenshots: [imageFile, tabletImageFile, desktopImageFile] } } },
    elements: { 'home-menu': { status: 'pass' } },
    modals: {}, flows: {}, crud: {}, api: {},
    visualReviews: {
      'public:default:home:mobile': { ...review, breakpoint: 'mobile' },
      'public:default:home:tablet': { ...review, breakpoint: 'tablet', screenshot: tabletImageFile, sha256: tabletImageHash },
      'public:default:home:desktop': { ...review, breakpoint: 'desktop', screenshot: desktopImageFile, sha256: desktopImageHash },
    },
  },
};
const complete = evaluate(completeState, { inventoryComplete: true, modals: [], flows: [] });
assert.strictEqual(complete.coverageComplete, true);
assert.deepStrictEqual(complete.unaccounted, []);

const missingReview = JSON.parse(JSON.stringify(completeState));
delete missingReview.results.visualReviews['public:default:home:mobile'];
assert.strictEqual(evaluate(missingReview, { inventoryComplete: true }).coverageComplete, false);

const truncated = JSON.parse(JSON.stringify(completeState));
truncated.discovery.truncation.routes = true;
assert.strictEqual(evaluate(truncated, { inventoryComplete: true }).coverageComplete, false);

const unexplainedSkip = JSON.parse(JSON.stringify(completeState));
unexplainedSkip.results.elements['home-menu'] = { status: 'skip' };
assert.strictEqual(evaluate(unexplainedSkip, { inventoryComplete: true }).coverageComplete, false);

const missingCrud = JSON.parse(JSON.stringify(completeState));
missingCrud.discovery.crudModules = [{ id: 'customers' }];
assert.strictEqual(evaluate(missingCrud, { inventoryComplete: true }).coverageComplete, false);

const smoke = JSON.parse(JSON.stringify(completeState));
smoke.session.mode = 'smoke';
const smokeCoverage = evaluate(smoke, {});
assert.strictEqual(smokeCoverage.smokeScopeComplete, true);
assert.strictEqual(smokeCoverage.coverageComplete, false);

const exhaustive = JSON.parse(JSON.stringify(completeState));
exhaustive.session.mode = 'exhaustive';
exhaustive.discovery.apiEndpoints = [{ id: 'GET-/api/customers' }];
exhaustive.queues.api = ['GET-/api/customers'];
assert.strictEqual(evaluate(exhaustive, { inventoryComplete: true }).coverageComplete, false);
exhaustive.queues.api = [];
exhaustive.results.api['GET-/api/customers'] = { status: 'pass' };
assert.strictEqual(evaluate(exhaustive, { inventoryComplete: true }).coverageComplete, true);

const greenMultiRole = { authorizationLeaks: 0, accessFailures: 0, responsiveHighIssues: 0, authFailures: 0, smokeFailures: 0 };
assert.strictEqual(isPassingSummary(greenMultiRole, 0), true);
assert.strictEqual(isPassingSummary({ ...greenMultiRole, smokeFailures: 1 }, 0), false);

try {
  const configFile = path.join(tempDir, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify({ inventoryComplete: true }));
  fs.writeFileSync(stateFile, JSON.stringify(missingReview));
  const incompleteCli = spawnSync(process.execPath, [path.join(__dirname, 'assert-coverage.js'), '--state', stateFile, '--config', configFile]);
  assert.strictEqual(incompleteCli.status, 1);
  assert.strictEqual(JSON.parse(fs.readFileSync(stateFile, 'utf8')).session.status, 'incomplete');

  fs.writeFileSync(stateFile, JSON.stringify(completeState));
  const completeCli = spawnSync(process.execPath, [path.join(__dirname, 'assert-coverage.js'), '--state', stateFile, '--config', configFile]);
  assert.strictEqual(completeCli.status, 0);
  const certified = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  assert.strictEqual(certified.session.status, 'in_progress');
  assert.strictEqual(certified.session.coverageComplete, true);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('validation-contract tests: pass');
