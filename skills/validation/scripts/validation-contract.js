#!/usr/bin/env node
'use strict';

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

function expectedVisualReviews(state) {
  const routes = state.discovery && state.discovery.routes || [];
  const breakpoints = state.config && state.config.breakpoints || [];
  return routes.flatMap((route, routeIndex) => breakpoints.map((breakpoint, bpIndex) => ({
    id: `${itemId(route, `route-${routeIndex}`)}:${itemId(breakpoint, `bp-${bpIndex}`)}`,
  })));
}

function evaluateCoverage(state, config = {}) {
  const policy = modePolicy(state.session && state.session.mode);
  const discovery = state.discovery || {};
  const results = state.results || {};
  const queues = state.queues || {};
  const inventoryDeclared = !policy.requireDeclaredInventory || config.inventoryComplete === true;
  const unaccounted = [];

  if (!inventoryDeclared) unaccounted.push('inventory:not-declared-complete');
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
  for (const review of expectedVisualReviews(state)) {
    const result = reviews[review.id];
    if (!resultAccounted(result) || String(result.analysis || '').trim().length < 20) {
      unaccounted.push(`visual-review:${review.id}`);
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
  return {
    mode: policy.mode,
    requestedScopeComplete,
    coverageComplete: COMPLETE_MODES.has(policy.mode) && requestedScopeComplete,
    smokeScopeComplete: policy.mode === 'smoke' && requestedScopeComplete,
    inventoryDeclared,
    truncated,
    unaccounted: unique,
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
  modePolicy,
  normalizeMode,
  positiveLimit,
};
