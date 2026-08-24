#!/usr/bin/env node
'use strict';
/**
 * validate-multirole.js
 *
 * Generic multi-role validation orchestrator for the `validation` skill. It generalizes the
 * pattern that was proven on a real 10-role app: for each role declared in
 * validation.config.json `roles[]`, it
 *   1. establishes auth — a saved storage-state if present, else a UI login with per-role env
 *      credentials — and saves the storage-state for reuse;
 *   2. verifies the session actually left the login screen (no login-masquerade);
 *   3. runs the skill's per-role smoke (routes + per-route elements) via run-smoke-playwright.js;
 *   4. checks access control — every `canAccess` route must render real content, every `denied`
 *      route must be blocked; a denied route that renders real content is a CRITICAL leak;
 *   5. audits responsiveness per accessible route per breakpoint (measured, not screenshot-only);
 *   6. writes a per-role ledger + aggregate JSON/MD report and redacts credentials from artifacts.
 *
 * Credentials come ONLY from environment variables named by each role's `credentialsEnv`.
 * Nothing secret is written to config, reports, or logs.
 *
 * Usage:
 *   node validate-multirole.js --url http://127.0.0.1:PORT/ --config validation.config.json \
 *     [--out test-manifest] [--channel chrome] [--skip-smoke]
 *
 * Exit code 0 only when every role authenticated, 0 authorization leaks, 0 access failures,
 * 0 responsive high issues, and redaction is clean. Otherwise 1.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const skillDir = path.dirname(__dirname);
const { __validationResponsiveAudit } = require(path.join(skillDir, 'scripts', 'responsive-audit.js'));

const DEFAULT_BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') out.url = argv[++i];
    else if (a === '--config') out.config = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--channel') out.channel = argv[++i];
    else if (a === '--skip-smoke') out.skipSmoke = true;
    else if (a === '--help') out.help = true;
  }
  return out;
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}

async function launchResilient(chromium, channel) {
  if (channel) return chromium.launch({ channel, headless: true });
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  let lastErr;
  for (const a of attempts) {
    try { return await chromium.launch(Object.assign({ headless: true }, a)); }
    catch (e) { lastErr = e; }
  }
  throw new Error('Could not launch a browser. Run `npx playwright install chromium`, install Chrome, or pass --channel. Last error: ' + (lastErr && lastErr.message));
}

function loadChromium(configDir) {
  try {
    const { createRequire } = require('module');
    const projectRequire = createRequire(path.join(configDir, 'package.json'));
    return projectRequire('playwright').chromium;
  } catch {
    return require('playwright').chromium;
  }
}

const LOGIN_TEXT = /log\s?in|sign\s?in|iniciar sesi|contrase|password|correo/i;

function loginVisibleInBody() {
  const text = (document.body && document.body.innerText || '').toLowerCase();
  return Boolean(document.querySelector('input[type="password"]')) &&
    /log\s?in|sign\s?in|iniciar sesi|contrase|password|correo/.test(text);
}

function pageSnapshotInBody() {
  const text = document.body && document.body.innerText || '';
  const lower = text.toLowerCase();
  return {
    path: location.pathname,
    chars: text.trim().length,
    loginVisible: Boolean(document.querySelector('input[type="password"]')) &&
      /log\s?in|sign\s?in|iniciar sesi|contrase|password|correo/.test(lower),
    accessDenied: /access denied|unauthorized|no autoriz|acceso no autorizado|forbidden|\b403\b|sin permiso|no tienes (los )?permiso|not allowed|prohibido/.test(lower),
  };
}

async function uiLogin(browser, appUrl, email, password, stateFile) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(500);
  const passLoc = page.locator('input[type="password"]').first();
  let attempted = false;
  if (await passLoc.count()) {
    attempted = true;
    const emailLoc = page.locator('input[type="email"], input[name*="email" i], input[name*="correo" i], input[name*="user" i], input[id*="email" i], input[id*="user" i]').first();
    if (await emailLoc.count()) await emailLoc.fill(email);
    await passLoc.fill(password);
    const submit = page.getByRole('button', { name: /iniciar|login|sign\s?in|entrar|ingresar|acceder/i }).first();
    if (await submit.count()) await submit.click({ timeout: 10000 }).catch(() => {});
    else await passLoc.press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
  }
  const stillLogin = await page.evaluate(loginVisibleInBody).catch(() => false);
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  await ctx.storageState({ path: stateFile });
  await ctx.close();
  return { attempted, stillLogin };
}

async function auditRoleAccessAndResponsive(browser, appUrl, role, stateFile, dirs, rel, breakpoints) {
  const evid = path.join(dirs.evidence, 'roles', role.id);
  fs.mkdirSync(evid, { recursive: true });
  const routeResults = [];
  const responsiveResults = [];
  const allPaths = [...new Set([...(role.canAccess || []), ...(role.denied || [])])];

  for (const routePath of allPaths) {
    const ctx = await browser.newContext({ storageState: stateFile, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(new URL(routePath, appUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    const snap = await page.evaluate(pageSnapshotInBody);
    const shot = path.join(evid, `${slug(routePath)}-access.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    await ctx.close();

    const expected = (role.canAccess || []).includes(routePath) ? 'canAccess' : 'denied';
    let status = 'pass', severity = 'info', observed = '';
    if (expected === 'canAccess') {
      // Must render real content. Login form or a redirect away = the role cannot use a route it should.
      if (snap.loginVisible) { status = 'fail'; severity = 'critical'; observed = 'login-masquerade: a route this role should access rendered the login form despite storage-state.'; }
      else if (snap.path !== routePath) { status = 'fail'; severity = 'high'; observed = `expected access to ${routePath}, ended at ${snap.path}.`; }
      else observed = `authorized route rendered at ${snap.path}.`;
    } else {
      // Denied route: correct outcomes are redirect away, bounce to login, or an access-denied page.
      // A leak is real content rendered at the denied path.
      if (snap.loginVisible || snap.path !== routePath) observed = `denied route ${routePath} correctly blocked (ended at ${snap.path}${snap.loginVisible ? ', login' : ''}).`;
      else if (snap.accessDenied) observed = `denied route ${routePath} correctly showed an access-denied page.`;
      else if (snap.chars > 40) { status = 'fail'; severity = 'critical'; observed = `AUTHORIZATION LEAK: denied route ${routePath} rendered real content for role ${role.id}.`; }
      else observed = `denied route ${routePath} rendered no real content.`;
    }
    routeResults.push({ path: routePath, expected, status, severity, observed, finalPath: snap.path, screenshot: rel(shot) });
  }

  for (const routePath of role.canAccess || []) {
    for (const bp of breakpoints) {
      const ctx = await browser.newContext({ storageState: stateFile, viewport: { width: bp.width, height: bp.height } });
      const page = await ctx.newPage();
      await page.goto(new URL(routePath, appUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);
      const loginVisible = await page.evaluate(loginVisibleInBody).catch(() => false);
      const audit = loginVisible
        ? { bySeverity: { high: 1, medium: 0, low: 0 }, findings: [{ type: 'login-masquerade', severity: 'high', detail: 'storage-state route still shows login form' }] }
        : await page.evaluate(__validationResponsiveAudit, { mobile: bp.width < 600 });
      const shot = path.join(evid, `${slug(routePath)}-responsive-${bp.name}.png`);
      await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
      await ctx.close();
      responsiveResults.push({
        path: routePath, breakpoint: bp.name,
        bySeverity: audit.bySeverity,
        high: audit.findings.filter(f => f.severity === 'high').length,
        screenshot: rel(shot),
      });
    }
  }
  return { routeResults, responsiveResults };
}

function writeRoleConfig(config, role, dirs) {
  const roleConfig = Object.assign({}, config, {
    routes: (config.routes || []).filter(r => (role.canAccess || []).includes(r.path)),
    maxRoutes: Math.max((role.canAccess || []).length, 1),
  });
  delete roleConfig.roles;
  const file = path.join(dirs.roleConfigs, `${role.id}.json`);
  fs.mkdirSync(dirs.roleConfigs, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(roleConfig, null, 2));
  return file;
}

function runSmoke(appUrl, role, stateFile, roleConfigFile, dirs, channel, email, password) {
  const outDir = path.join(dirs.roles, role.id);
  fs.mkdirSync(outDir, { recursive: true });
  const env = Object.assign({}, process.env, { VALIDATION_EMAIL: email, VALIDATION_PASSWORD: password });
  const r = spawnSync(process.execPath, [
    path.join(skillDir, 'scripts', 'run-smoke-playwright.js'),
    '--url', appUrl, '--mode', 'standard', '--config', roleConfigFile,
    '--out', outDir, '--storage-state', stateFile, '--role', role.id, '--channel', channel || 'chrome',
  ], { cwd: dirs.root, env, encoding: 'utf8', timeout: 240000 });
  let parsed = null;
  const stdout = (r.stdout || '').trim();
  const js = stdout.indexOf('{');
  if (js >= 0) { try { parsed = JSON.parse(stdout.slice(js)); } catch {} }
  return { exitCode: r.status, parsed, outDir: path.relative(dirs.root, outDir).replace(/\\/g, '/') };
}

function writeMarkdown(report, file) {
  const L = [];
  L.push('# Multi-role validation', '');
  L.push(`Generated: ${report.generatedAt}`, `App: ${report.appUrl}`, '');
  L.push('## Summary', '');
  L.push(`- Roles configured: ${report.roles.length}`);
  L.push(`- Roles authenticated: ${report.roles.filter(r => r.authenticated).length}`);
  L.push(`- Authorization leaks: ${report.summary.authorizationLeaks}`);
  L.push(`- Access failures: ${report.summary.accessFailures}`);
  L.push(`- Responsive high issues: ${report.summary.responsiveHighIssues}`);
  L.push(`- Auth failures: ${report.summary.authFailures}`, '');
  L.push('## Role ledgers');
  for (const r of report.roles) {
    L.push('', `### ${r.id}`, '');
    L.push(`- Authenticated: ${r.authenticated ? 'yes' : 'no'}`);
    L.push(`- Storage state: ${r.stateFile || '-'}`);
    L.push(`- Can access: ${r.ledger.canAccessPassed}/${r.ledger.canAccessTotal}`);
    L.push(`- Denied blocked: ${r.ledger.deniedPassed}/${r.ledger.deniedTotal}`);
    L.push(`- Authorization leaks: ${r.ledger.authorizationLeaks}`);
    L.push(`- Responsive checks: ${r.ledger.responsivePassed}/${r.ledger.responsiveTotal}`);
    L.push(`- Skill smoke: routes ${r.ledger.smokeRoutesPassed}/${r.ledger.smokeRoutesTested}, elements ${r.ledger.smokeElementsPassed}/${r.ledger.smokeElementsTested}`);
    for (const issue of r.issues.slice(0, 10)) L.push(`  - ${issue.severity}: ${issue.message}`);
  }
  fs.writeFileSync(file, L.join('\n'));
}

function isPassingSummary(summary, redactionExitCode = 0) {
  return summary.authorizationLeaks === 0
    && summary.accessFailures === 0
    && summary.responsiveHighIssues === 0
    && summary.authFailures === 0
    && summary.smokeFailures === 0
    && redactionExitCode === 0;
}

function stamp() {
  // Date is unavailable in some runners; allow override via env, else best-effort.
  return (process.env.VALIDATION_STAMP || new Date().toISOString()).replace(/[-:]/g, '').replace(/\..+/, 'Z');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url || !args.config) {
    console.error('Usage: node validate-multirole.js --url <url> --config validation.config.json [--out test-manifest] [--channel chrome] [--skip-smoke]');
    process.exit(args.help ? 0 : 2);
  }
  const configPath = path.resolve(args.config);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const roles = config.roles || [];
  if (!roles.length) { console.error('No roles[] in config. This orchestrator is for multi-role apps; use run-smoke-playwright.js for single-role.'); process.exit(2); }

  const breakpoints = config.breakpoints || DEFAULT_BREAKPOINTS;
  const root = path.dirname(configPath);
  const outRoot = path.resolve(root, args.out || 'test-manifest');
  const dirs = {
    root,
    auth: path.join(outRoot, 'auth'),
    roles: path.join(outRoot, 'roles'),
    roleConfigs: path.join(outRoot, 'role-configs'),
    evidence: path.join(outRoot, 'evidence'),
    reports: path.join(outRoot, 'reports'),
  };
  for (const d of Object.values(dirs)) if (d !== root) fs.mkdirSync(d, { recursive: true });
  const rel = (f) => path.relative(root, f).replace(/\\/g, '/');

  const chromium = loadChromium(root);
  const browser = await launchResilient(chromium, args.channel);
  const secretValues = [];
  const roleReports = [];

  try {
    for (const role of roles) {
      const report = {
        id: role.id, label: role.label || role.id, authenticated: false, stateFile: null,
        ledger: {
          canAccessTotal: (role.canAccess || []).length, canAccessPassed: 0,
          deniedTotal: (role.denied || []).length, deniedPassed: 0, authorizationLeaks: 0,
          responsiveTotal: (role.canAccess || []).length * breakpoints.length, responsivePassed: 0,
          smokeRoutesTested: 0, smokeRoutesPassed: 0, smokeElementsTested: 0, smokeElementsPassed: 0,
          smokeExitCode: null, smokePassed: false,
        },
        accessResults: [], responsiveResults: [], issues: [],
      };

      // 1. Establish auth
      let stateFile = null;
      const savedState = role.storageState ? path.resolve(root, role.storageState) : null;
      let email = null, password = null;
      if (savedState && fs.existsSync(savedState)) {
        stateFile = savedState;
        report.authenticated = true;
      } else {
        email = role.credentialsEnv && process.env[role.credentialsEnv.email];
        password = role.credentialsEnv && process.env[role.credentialsEnv.password];
        if (!email || !password) {
          report.issues.push({ severity: 'blocked', message: `No credentials for role: set env ${role.credentialsEnv ? `${role.credentialsEnv.email}/${role.credentialsEnv.password}` : '(credentialsEnv missing in config)'} or provide storageState.` });
          roleReports.push(report);
          continue;
        }
        secretValues.push(email, password);
        stateFile = path.join(dirs.auth, `${role.id}-state.json`);
        const login = await uiLogin(browser, args.url, email, password, stateFile);
        if (login.stillLogin || !login.attempted) {
          report.issues.push({ severity: 'critical', message: login.attempted ? 'Login attempted but page stayed on the login screen (bad credentials or unmatched selectors).' : 'No login form found to authenticate this role.' });
          roleReports.push(report);
          continue;
        }
        report.authenticated = true;
      }
      report.stateFile = rel(stateFile);

      // 2. Per-role skill smoke (routes + per-route elements)
      if (!args.skipSmoke && (role.canAccess || []).length) {
        const roleConfigFile = writeRoleConfig(config, role, dirs);
        const smoke = runSmoke(args.url, role, stateFile, roleConfigFile, dirs, args.channel, email || '', password || '');
        report.ledger.smokeExitCode = smoke.exitCode;
        if (smoke.exitCode !== 0) report.issues.push({ severity: 'high', message: `Skill smoke runner exited ${smoke.exitCode}.` });
        const sum = smoke.parsed && smoke.parsed.summary;
        if (sum) {
          report.ledger.smokeRoutesTested = sum.routesTested || 0;
          report.ledger.smokeRoutesPassed = sum.routesPassed || 0;
          report.ledger.smokeElementsTested = sum.elementsTested || 0;
          report.ledger.smokeElementsPassed = sum.elementsPassed || 0;
        }
        report.ledger.smokePassed = smoke.exitCode === 0
          && Boolean(sum)
          && report.ledger.smokeRoutesTested === report.ledger.smokeRoutesPassed
          && report.ledger.smokeElementsTested === report.ledger.smokeElementsPassed + (sum && sum.elementsSkipped || 0);
        if (!report.ledger.smokePassed) report.issues.push({ severity: 'high', message: 'Per-role UI smoke did not produce an all-accounted green result.' });
      }

      // 3. Access control + responsive
      const checks = await auditRoleAccessAndResponsive(browser, args.url, role, stateFile, dirs, rel, breakpoints);
      report.accessResults = checks.routeResults;
      report.responsiveResults = checks.responsiveResults;
      report.ledger.canAccessPassed = checks.routeResults.filter(r => r.expected === 'canAccess' && r.status === 'pass').length;
      report.ledger.deniedPassed = checks.routeResults.filter(r => r.expected === 'denied' && r.status === 'pass').length;
      report.ledger.authorizationLeaks = checks.routeResults.filter(r => r.expected === 'denied' && r.status === 'fail' && r.severity === 'critical').length;
      report.ledger.responsivePassed = checks.responsiveResults.filter(r => r.high === 0).length;
      for (const r of checks.routeResults.filter(x => x.status !== 'pass')) report.issues.push({ severity: r.severity, message: `${r.path}: ${r.observed}` });
      for (const r of checks.responsiveResults.filter(x => x.high > 0)) report.issues.push({ severity: 'high', message: `${r.path} ${r.breakpoint}: ${r.high} high responsive findings.` });

      roleReports.push(report);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const summary = {
    authorizationLeaks: roleReports.reduce((s, r) => s + r.ledger.authorizationLeaks, 0),
    accessFailures: roleReports.reduce((s, r) => s + r.accessResults.filter(x => x.status !== 'pass').length, 0),
    responsiveHighIssues: roleReports.reduce((s, r) => s + r.responsiveResults.filter(x => x.high > 0).length, 0),
    authFailures: roleReports.filter(r => !r.authenticated).length,
    smokeFailures: roleReports.filter(r => (r.ledger.canAccessTotal > 0) && !r.ledger.smokePassed).length,
  };
  const report = { generatedAt: process.env.VALIDATION_STAMP || new Date().toISOString(), appUrl: args.url, config: rel(configPath), roles: roleReports, summary };
  const jsonReport = path.join(dirs.reports, `multirole-validation-${stamp()}.json`);
  const mdReport = path.join(dirs.reports, `multirole-validation-${stamp()}.md`);
  fs.writeFileSync(jsonReport, JSON.stringify(report, null, 2));
  writeMarkdown(report, mdReport);

  // Redact credentials from artifacts.
  let redaction = { exitCode: 0 };
  if (secretValues.length) {
    const r = spawnSync(process.execPath, [path.join(skillDir, 'scripts', 'redact-artifacts.js'), root, ...secretValues], { cwd: root, encoding: 'utf8', timeout: 120000 });
    redaction = { exitCode: r.status, stdout: (r.stdout || '').trim() };
  }

  const ok = isPassingSummary(summary, redaction.exitCode);
  console.log(JSON.stringify({
    ok, report: rel(jsonReport), markdown: rel(mdReport), summary,
    roleLedger: roleReports.map(r => ({
      id: r.id, authenticated: r.authenticated,
      canAccess: `${r.ledger.canAccessPassed}/${r.ledger.canAccessTotal}`,
      denied: `${r.ledger.deniedPassed}/${r.ledger.deniedTotal}`,
      leaks: r.ledger.authorizationLeaks,
      smoke: r.ledger.smokePassed ? 'pass' : 'fail',
      responsive: `${r.ledger.responsivePassed}/${r.ledger.responsiveTotal}`,
      issues: r.issues.length,
    })),
  }, null, 2));
  process.exit(ok ? 0 : 1);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

module.exports = { isPassingSummary };
