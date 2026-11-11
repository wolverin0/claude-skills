#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { evaluateCoverage, expectedVisualReviews, imagePath } = require('./validation-contract');

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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderReport(state, config, stateFile, coverage) {
  const reportDir = path.join(path.dirname(stateFile), 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `validation-final-${state.session.id || 'current'}.html`);
  const image = screenshot => {
    const file = imagePath(screenshot, { stateFile, projectRoot: state.session?.projectRoot });
    if (!file || !fs.existsSync(file)) return '<span>Image missing</span>';
    const href = path.relative(reportDir, file).replace(/\\/g, '/');
    return `<figure><img src="${escapeHtml(href)}" alt="Validation screenshot"><figcaption>${escapeHtml(screenshot)}</figcaption></figure>`;
  };
  const visual = expectedVisualReviews(state, config).map(cell => {
    const review = state.results?.visualReviews?.[cell.id];
    const observations = review?.analysis && typeof review.analysis === 'object'
      ? Object.entries(review.analysis).map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('')
      : '<dt>Analysis</dt><dd>Pending or invalid</dd>';
    return `<article><h3>${escapeHtml(cell.id)} — ${escapeHtml(review?.status || 'missing')}</h3>${image(review?.screenshot)}<dl>${observations}</dl></article>`;
  }).join('');
  const elements = Object.entries(state.results?.elements || {}).map(([id, result]) =>
    `<article><h3>${escapeHtml(id)} — ${escapeHtml(result.status)}</h3><p><b>Expected:</b> ${escapeHtml(result.expected)}</p><p><b>Observed:</b> ${escapeHtml(result.observed)}</p>${(result.evidence?.screenshots || []).map(image).join('')}</article>`).join('');
  const rows = ['routes', 'modals', 'flows', 'crud', 'api'].map(name =>
    `<section><h2>${escapeHtml(name)}</h2>${Object.entries(state.results?.[name] || {}).map(([id, result]) =>
      `<p>${escapeHtml(id)}: ${escapeHtml(result.status)} — expected ${escapeHtml(result.expected)}; observed ${escapeHtml(result.observed)}</p>`).join('')}</section>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Validation final</title><style>body{font:16px/1.5 system-ui;max-width:1100px;margin:2rem auto;padding:0 1rem;color:#17202a}article{border:1px solid #ccd3d9;padding:1rem;margin:1rem 0}img{max-width:100%;max-height:520px}figure{margin:1rem 0}dt{font-weight:bold;margin-top:.5rem}dd{margin-left:0}pre{white-space:pre-wrap}</style></head><body><h1>Validation final</h1><p>URL ${escapeHtml(state.session.appUrl)} · source ${escapeHtml(state.session.sourceSha)} · build ${escapeHtml(state.session.buildId)} · mode ${escapeHtml(state.session.mode)} · status ${escapeHtml(state.session.status)}</p><h2>Coverage and health</h2><pre>${escapeHtml(JSON.stringify(coverage, null, 2))}</pre><h2>Visual reviews</h2>${visual}<h2>Elements</h2>${elements}${rows}</body></html>`;
  fs.writeFileSync(reportFile, html);
  state.report = { path: reportFile, generatedAt: new Date().toISOString(), partial: !coverage.certifiable };
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
  const coverage = evaluateCoverage(state, config, { stateFile });
  state.coverage = coverage;
  state.session.coverageComplete = coverage.coverageComplete;
  state.session.smokeScopeComplete = coverage.smokeScopeComplete;
  // Accounting is independent of product health. Final certification is a separate gate.
  state.session.status = coverage.requestedScopeComplete ? 'in_progress' : 'incomplete';
  state.session.currentPhase = coverage.requestedScopeComplete ? 'certify' : 'test';
  state.session.lastUpdatedAt = new Date().toISOString();
  writeAtomic(stateFile, state);
  console.log(JSON.stringify(coverage, null, 2));
  process.exit(coverage.requestedScopeComplete ? 0 : 1);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

module.exports = { renderReport };
