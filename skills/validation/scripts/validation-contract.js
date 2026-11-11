#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COMPLETE_MODES = new Set(['standard', 'exhaustive']);

function normalizeMode(value) {
  const mode = String(value || 'standard').toLowerCase();
  if (mode === 'full' || mode === 'human') return 'exhaustive';
  if (mode === 'smoke' || mode === 'standard' || mode === 'exhaustive') return mode;
  throw new Error(`Unsupported validation mode: ${value}`);
}

function modePolicy(value) {
  const mode = normalizeMode(value);
  return {
    mode,
    samplingAllowed: mode === 'smoke',
    defaultMaxRoutes: mode === 'smoke' ? 6 : null,
    defaultMaxElements: mode === 'smoke' ? 12 : null,
    requireDeclaredInventory: COMPLETE_MODES.has(mode),
    requireSemanticReviews: true,
  };
}

function positiveLimit(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function applyLimit(items, value) {
  const limit = positiveLimit(value);
  if (!limit || items.length <= limit) return { items: [...items], truncated: false, limit };
  return { items: items.slice(0, limit), truncated: true, limit };
}

function itemId(item, fallback) {
  return String(item && (item.id || item.path || item.name) || fallback);
}

function resultAccounted(result) {
  if (!result || !['pass', 'fail', 'skip', 'runner-fail', 'quarantined'].includes(result.status)) return false;
  if (result.status === 'skip' || result.status === 'quarantined') {
    return String(result.skipReason || result.reason || result.rationale || '').trim().length >= 5;
  }
  return true;
}

function missingResults(expected, results, prefix) {
  const map = results || {};
  return (expected || []).flatMap((item, index) => {
    const id = itemId(item, `${prefix}-${index}`);
    return resultAccounted(map[id]) ? [] : [`${prefix}:${id}`];
  });
}

function identity(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function scopeIds(items, fallback) {
  return (Array.isArray(items) && items.length ? items : [fallback]).map((item, index) =>
    typeof item === 'string' ? item : itemId(item, `scope-${index}`));
}

function expectedVisualReviews(state, config = {}) {
  const routes = state.discovery && state.discovery.routes || [];
  const breakpoints = state.config && state.config.breakpoints || [];
  const roles = scopeIds(config.roles || state.config?.roles, state.session?.role);
  const themes = scopeIds(config.themes || state.config?.themes, state.session?.theme);
  return roles.flatMap(role => themes.flatMap(theme => routes.flatMap((route, routeIndex) =>
    breakpoints.map((breakpoint, bpIndex) => {
      const routeId = itemId(route, `route-${routeIndex}`);
      const breakpointId = itemId(breakpoint, `bp-${bpIndex}`);
      return { id: `${role}:${theme}:${routeId}:${breakpointId}`, role, theme, route: routeId, breakpoint: breakpointId };
    }))));
}

function imagePath(screenshot, options) {
  if (!identity(screenshot) || !identity(options.stateFile)) return null;
  if (path.isAbsolute(screenshot)) return path.resolve(screenshot);
  if (identity(options.projectRoot)) return path.resolve(options.projectRoot, screenshot);
  const stateDir = path.dirname(path.resolve(options.stateFile));
  const root = path.basename(stateDir) === 'test-manifest' ? path.dirname(stateDir) : stateDir;
  return path.resolve(root, screenshot);
}

const REVIEW_DIMENSIONS = ['hierarchy', 'density', 'alignment', 'proportion', 'states'];
function concreteAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return false;
  const values = REVIEW_DIMENSIONS.map(key => analysis[key]);
  return values.every(value => typeof value === 'string' && value.trim().length >= 20 &&
    !/^(looks? good|no issues?|fine|okay|ok|pass)(?:[\s.,!]|$)/i.test(value.trim())) &&
    new Set(values.map(value => value.trim().toLowerCase())).size === values.length;
}

function validVisualReview(review, cell, state, options) {
  if (!review || !['pass', 'fail'].includes(review.status) || !concreteAnalysis(review.analysis)) return false;
  if (!identity(state.session?.sourceSha) || !identity(state.session?.buildId) ||
      !identity(state.session?.role) || !identity(state.session?.theme)) return false;
  for (const key of ['role', 'theme', 'route', 'breakpoint']) if (review[key] !== cell[key]) return false;
  if (review.sourceSha !== state.session.sourceSha || review.buildId !== state.session.buildId) return false;
  if (options.designGate) {
    const implementationBy = identity(state.session?.implementationBy);
    if (!implementationBy || review.implementationBy !== implementationBy ||
        !identity(review.reviewedBy) || review.reviewedBy === implementationBy) return false;
  }
  if (!/^[a-f0-9]{64}$/i.test(String(review.sha256 || ''))) return false;
  const imageOptions = { ...options, projectRoot: state.session?.projectRoot };
  const file = imagePath(review.screenshot, imageOptions);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  const routeEvidence = state.results?.routes?.[cell.route]?.evidence?.screenshots || [];
  if (!routeEvidence.some(item => imagePath(item, imageOptions) === file)) return false;
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') === review.sha256.toLowerCase();
}

function healthFailures(results, state) {
  const failures = [];
  for (const name of ['routes', 'elements', 'modals', 'flows', 'crud', 'api', 'visualReviews']) {
    for (const [id, result] of Object.entries(results[name] || {})) {
      if (result?.status === 'fail' || result?.status === 'runner-fail') failures.push(`${name}:${id}:${result.status}`);
    }
  }
  if (state.runner?.failures?.length) failures.push(`runner:${state.runner.failures.length}`);
  if (state.auth?.blocked) failures.push('auth:blocked');
  return failures;
}

function declaredInventoryGaps(declared, discovered, kind) {
  if (!Array.isArray(declared)) return [];
  return declared.flatMap((item, index) => {
    const name = typeof item === 'string' ? item : itemId(item, `${kind}-${index}`);
    const found = (discovered || []).some(actual => {
      const actualName = typeof actual === 'string' ? actual : itemId(actual, '');
      return actualName === name || (item?.path && actual?.path === item.path) ||
        (item?.id && actual?.id === item.id);
    });
    return found ? [] : [`inventory:${kind}-not-discovered:${name}`];
  });
}

function targetIdentityFailures(state, config, options) {
  const failures = [];
  const sourceSha = identity(options.targetSourceSha) || identity(config.sourceSha);
  const buildId = identity(options.targetBuildId) || identity(config.buildId);
  if (!sourceSha) failures.push('target:source-sha-missing');
  else if (state.session?.sourceSha !== sourceSha) failures.push('target:source-sha-mismatch');
  if (!buildId) failures.push('target:build-id-missing');
  else if (state.session?.buildId !== buildId) failures.push('target:build-id-mismatch');
  if (identity(options.targetSourceSha) && identity(config.sourceSha) && options.targetSourceSha !== config.sourceSha)
    failures.push('target:config-source-conflict');
  if (identity(options.targetBuildId) && identity(config.buildId) && options.targetBuildId !== config.buildId)
    failures.push('target:config-build-conflict');
  return failures;
}

function evaluateCoverage(state, config = {}, options = {}) {
  const policy = modePolicy(state.session && state.session.mode);
  const discovery = state.discovery || {};
  const results = state.results || {};
  const queues = state.queues || {};
  const inventoryDeclared = !policy.requireDeclaredInventory || config.inventoryComplete === true;
  const unaccounted = [];

  if (!inventoryDeclared) unaccounted.push('inventory:not-declared-complete');
  unaccounted.push(...declaredInventoryGaps(config.routes, discovery.routes, 'route'));
  unaccounted.push(...declaredInventoryGaps(config.elements, discovery.elements, 'element'));
  if (!discovery.routes?.length) unaccounted.push('inventory:no-routes');
  const breakpointNames = new Set((state.config?.breakpoints || []).map(bp => bp.name));
  for (const name of (policy.mode === 'smoke' ? ['mobile', 'desktop'] : ['mobile', 'tablet', 'desktop'])) {
    if (!breakpointNames.has(name)) unaccounted.push(`breakpoint:missing:${name}`);
  }
  unaccounted.push(...missingResults(discovery.routes, results.routes, 'route'));
  unaccounted.push(...missingResults(discovery.elements, results.elements, 'element'));
  unaccounted.push(...missingResults(config.modals || discovery.modals, results.modals, 'modal'));
  unaccounted.push(...missingResults(config.flows || discovery.flows, results.flows, 'flow'));
  if (COMPLETE_MODES.has(policy.mode)) {
    unaccounted.push(...missingResults(config.crudModules || discovery.crudModules, results.crud, 'crud'));
  }
  if (policy.mode === 'exhaustive') {
    unaccounted.push(...missingResults(config.apiEndpoints || discovery.apiEndpoints, results.api, 'api'));
  }

  const reviews = results.visualReviews || {};
  const usedScreenshots = new Set();
  for (const review of expectedVisualReviews(state, config)) {
    const result = reviews[review.id];
    const file = imagePath(result?.screenshot, { ...options, projectRoot: state.session?.projectRoot });
    if (!validVisualReview(result, review, state, { ...options, designGate: config.designGate || state.config?.designGate }) ||
        usedScreenshots.has(file)) {
      unaccounted.push(`visual-review:${review.id}`);
    } else {
      usedScreenshots.add(file);
    }
  }

  const truncation = discovery.truncation || {};
  const truncated = Object.values(truncation).some(Boolean);
  if (truncated && !policy.samplingAllowed) unaccounted.push('inventory:truncated');

  for (const [name, queue] of Object.entries(queues)) {
    if (Array.isArray(queue) && queue.length) unaccounted.push(`queue:${name}:${queue.length}`);
  }

  const unique = [...new Set(unaccounted)];
  const requestedScopeComplete = unique.length === 0;
  const failures = healthFailures(results, state);
  const identityFailures = targetIdentityFailures(state, config, options);
  return {
    mode: policy.mode,
    requestedScopeComplete,
    coverageComplete: COMPLETE_MODES.has(policy.mode) && requestedScopeComplete,
    smokeScopeComplete: policy.mode === 'smoke' && requestedScopeComplete,
    inventoryDeclared,
    truncated,
    unaccounted: unique,
    healthPassed: failures.length === 0,
    healthFailures: failures,
    identityFailures,
    certifiable: requestedScopeComplete && failures.length === 0 && identityFailures.length === 0,
    counts: {
      routes: (discovery.routes || []).length,
      elements: (discovery.elements || []).length,
      modals: (config.modals || discovery.modals || []).length,
      flows: (config.flows || discovery.flows || []).length,
      crudModules: (config.crudModules || discovery.crudModules || []).length,
      apiEndpoints: (config.apiEndpoints || discovery.apiEndpoints || []).length,
      visualReviews: Object.keys(reviews).length,
    },
  };
}

module.exports = {
  applyLimit,
  evaluateCoverage,
  expectedVisualReviews,
  imagePath,
  validVisualReview,
  modePolicy,
  normalizeMode,
  positiveLimit,
};
