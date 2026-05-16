#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

function parseArgs(argv) {
  const args = { mode: 'smoke' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--config') args.config = argv[++i];
    else if (a === '--mode') args.mode = argv[++i];
    else if (a === '--max-routes') args.maxRoutes = Number(argv[++i]);
    else if (a === '--max-elements') args.maxElements = Number(argv[++i]);
    else if (a === '--headed') args.headed = true;
    else if (a === '--help') args.help = true;
  }
  return args;
}

function usage() {
  console.log(`Usage: node run-smoke-playwright.js --url <url> [--mode smoke|standard|exhaustive] [--out test-manifest] [--config validation.config.json] [--max-routes 6] [--max-elements 0] [--headed]\n\nAuth env vars:\n  VALIDATION_EMAIL\n  VALIDATION_PASSWORD\n  VALIDATION_SECRET\n`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.url) {
  usage();
  process.exit(args.help ? 0 : 1);
}

const root = process.cwd();
function loadConfig(configArg) {
  const candidates = configArg ? [configArg] : ['validation.config.json'];
  for (const candidate of candidates) {
    const file = path.resolve(root, candidate);
    if (!fs.existsSync(file)) continue;
    try {
      return { path: file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch (err) {
      console.error(`Invalid validation config ${file}: ${err.message}`);
      process.exit(1);
    }
  }
  return { path: null, data: {} };
}

const loadedConfig = loadConfig(args.config);
const config = loadedConfig.data || {};

let chromium;
let playwrightSource = 'project';
try {
  const projectRequire = createRequire(path.join(root, 'package.json'));
  ({ chromium } = projectRequire('playwright'));
} catch (err) {
  try {
    ({ chromium } = require('playwright'));
    playwrightSource = 'script';
  } catch (fallbackErr) {
    console.error('Missing playwright dependency. Install playwright in the target project or beside this script.');
    console.error(`Project lookup: ${err.message}`);
    console.error(`Script lookup: ${fallbackErr.message}`);
    process.exit(1);
  }
}

const out = path.resolve(root, args.out || 'test-manifest');
const evidence = path.join(out, 'evidence');
const dirs = {
  routes: path.join(evidence, 'routes'),
  elements: path.join(evidence, 'elements'),
  flows: path.join(evidence, 'flows'),
  reports: path.join(out, 'reports'),
};
for (const dir of [out, evidence, ...Object.values(dirs)]) fs.mkdirSync(dir, { recursive: true });

const started = new Date();
const stamp = started.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const statePath = path.join(out, 'validation-state.json');
const reportPath = path.join(dirs.reports, `validation-${stamp}.html`);
const email = process.env.VALIDATION_EMAIL;
const password = process.env.VALIDATION_PASSWORD;
const secretValues = [
  email,
  password,
  process.env.VALIDATION_SECRET,
  ...(Array.isArray(config.redactValues) ? config.redactValues : []),
].filter(Boolean);
const appUrl = new URL(args.url).toString();

function modeDefaultMaxRoutes(mode) {
  if (mode === 'exhaustive') return 80;
  if (mode === 'standard') return 30;
  return 6;
}

function modeDefaultMaxElements(mode) {
  if (mode === 'exhaustive') return 40;
  if (mode === 'standard') return 12;
  return 0;
}

args.maxRoutes = Number.isFinite(args.maxRoutes) ? args.maxRoutes : Number(config.maxRoutes || modeDefaultMaxRoutes(args.mode));
args.maxElements = Number.isFinite(args.maxElements) ? args.maxElements : Number(config.maxElements || modeDefaultMaxElements(args.mode));

function rel(p) { return path.relative(root, p).replace(/\\/g, '/'); }
function reportHref(relPath) { return path.relative(dirs.reports, path.resolve(root, relPath)).replace(/\\/g, '/'); }
function redactString(value) {
  let text = String(value ?? '');
  for (const secret of secretValues) {
    if (secret && String(secret).length >= 4) text = text.split(String(secret)).join('[redacted]');
  }
  return text;
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function slug(s) {
  return String(s || 'root')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'root';
}
function sameOriginHref(href, base) {
  try {
    const u = new URL(href, base);
    const b = new URL(base);
    return u.origin === b.origin ? u : null;
  } catch {
    return null;
  }
}

const ignorePatterns = [
  /ResizeObserver loop/i,
  /favicon\.ico/i,
  /DevTools/i,
  /React DevTools/i,
  ...(Array.isArray(config.ignoreConsolePatterns) ? config.ignoreConsolePatterns.map(p => new RegExp(p, 'i')) : []),
];
function ignoredMessage(text) { return ignorePatterns.some(r => r.test(text || '')); }
function normalizeConsoleText(text) {
  return redactString(text)
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{20,}\b/gi, '<uuid>')
    .replace(/\s+/g, ' ')
    .slice(0, 400);
}
function rootCauseForIssue(issue) {
  const text = String(issue.text || '');
  if (/PGRST202|function .*not found|schema cache/i.test(text) && /function|rpc|get_/i.test(text)) return 'db-rpc-missing';
  if (/PGRST|schema cache|foreign key relationship/i.test(text)) return 'db-schema';
  if (/status of 5\d\d|HTTP 5\d\d/i.test(text)) return 'server-error';
  if (/status of 4\d\d|HTTP 4\d\d/i.test(text)) return 'client-or-permission-error';
  if (issue.type === 'pageerror') return 'runtime-exception';
  if (issue.type === 'warning') return 'browser-warning';
  return 'other-runtime';
}
function classifyConsole(messages, pageErrors) {
  const grouped = new Map();
  for (const msg of messages) {
    if (!['error', 'warning'].includes(msg.type)) continue;
    if (ignoredMessage(msg.text)) continue;
    const normalized = normalizeConsoleText(msg.text);
    const key = `${msg.type}:${normalized}`;
    const existing = grouped.get(key) || { type: msg.type, text: normalized, count: 0, urls: new Set() };
    existing.count++;
    if (msg.url) existing.urls.add(msg.url);
    grouped.set(key, existing);
  }
  for (const err of pageErrors) {
    const normalized = normalizeConsoleText(err.message || err.stack);
    const key = `pageerror:${normalized}`;
    const existing = grouped.get(key) || { type: 'pageerror', text: normalized, count: 0, urls: new Set() };
    existing.count++;
    if (err.url) existing.urls.add(err.url);
    grouped.set(key, existing);
  }
  const issues = [...grouped.values()].map(v => ({
    type: v.type,
    text: v.text,
    count: v.count,
    urls: [...v.urls].map(redactString),
    severity: /PGRST|schema cache|server responded with a status of (4|5)\d\d|Failed to load resource|pageerror/i.test(v.text) ? 'high' : (v.type === 'warning' ? 'medium' : 'low'),
  }));
  return issues.map(issue => ({ ...issue, rootCause: rootCauseForIssue(issue), source: 'app' }));
}

function classifyNetwork(events) {
  const grouped = new Map();
  for (const event of events) {
    if (ignoredMessage(event.url)) continue;
    const normalizedUrl = redactString(event.url || '').replace(/\?.*$/, '?<query>');
    const key = `${event.status}:${event.method}:${event.resourceType}:${normalizedUrl}`;
    const existing = grouped.get(key) || {
      type: 'network',
      status: event.status,
      statusText: event.statusText,
      method: event.method,
      resourceType: event.resourceType,
      url: normalizedUrl,
      count: 0,
    };
    existing.count++;
    grouped.set(key, existing);
  }
  return [...grouped.values()].map(issue => ({
    ...issue,
    text: `HTTP ${issue.status} ${issue.method} ${issue.url}`,
    severity: issue.status >= 500 ? 'high' : (issue.status >= 400 ? 'medium' : 'low'),
    rootCause: rootCauseForIssue({ text: `HTTP ${issue.status}`, type: 'network' }),
    source: 'app',
  }));
}

function makeState() {
  const defaultBreakpoints = args.mode === 'smoke'
    ? [
        { name: 'mobile', width: 375, height: 812 },
        { name: 'desktop', width: 1440, height: 900 },
      ]
    : [
        { name: 'mobile', width: 375, height: 812 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'laptop', width: 1024, height: 768 },
        { name: 'desktop', width: 1440, height: 900 },
      ];
  return {
    version: '3.0',
    session: {
      id: `val-${stamp}`,
      appUrl,
      backend: 'playwright-local',
      backendDetail: `playwright-${playwrightSource}`,
      mode: args.mode,
      authMode: email && password ? 'env-credentials' : 'none-or-manual',
      configPath: loadedConfig.path ? rel(loadedConfig.path) : null,
      status: 'in_progress',
      currentPhase: 'discover',
      startedAt: started.toISOString(),
      lastUpdatedAt: started.toISOString(),
      completedAt: null,
      contextResets: 0,
    },
    config: {
      breakpoints: Array.isArray(config.breakpoints) && config.breakpoints.length ? config.breakpoints : defaultBreakpoints,
      ignoreConsolePatterns: ignorePatterns.map(String),
      destructiveActions: 'skip',
      maxRoutes: args.maxRoutes,
      maxElements: args.maxElements,
      allowedAccessDeniedPaths: Array.isArray(config.allowedAccessDeniedPaths) ? config.allowedAccessDeniedPaths : [],
    },
    preflight: { passed: false, serverStatus: 'unknown', loadTimeMs: null, authRequired: false, console: [], errors: [], blockers: [] },
    discovery: { completedAt: null, routes: [], elements: [], flows: [] },
    queues: { routes: [], elements: [], flows: [] },
    results: { routes: {}, elements: {}, flows: {} },
    cleanup: { attempted: false, itemsFound: 0, itemsDeleted: 0, itemsFailed: 0, failures: [] },
    summary: {
      routesTested: 0, routesPassed: 0, routesFailed: 0, routesSkipped: 0,
      elementsTested: 0, elementsPassed: 0, elementsFailed: 0, elementsSkipped: 0,
      flowsTested: 0, flowsPassed: 0, flowsFailed: 0, flowsSkipped: 0,
      issues: 0, consoleErrors: 0, groupedConsoleIssues: 0, networkFailures: 0, rootCauseGroups: {},
    },
    report: { path: null, generatedAt: null, partial: true },
    runner: { failures: [] },
  };
}

const state = makeState();
function save() {
  state.session.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

async function bodyText(page) {
  return page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
}

async function snapshotPage(page, file) {
  const data = {
    url: redactString(page.url()),
    title: redactString(await page.title().catch(() => '')),
    text: redactString((await bodyText(page)).slice(0, 8000)),
    interactive: await page.locator('button, a, input, select, textarea, [role="button"]').evaluateAll(els => els.slice(0, 120).map((el, i) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const visible = style.visibility !== 'hidden'
        && style.display !== 'none'
        && rect.width > 0
        && rect.height > 0
        && rect.bottom > 0
        && rect.right > 0
        && rect.top < window.innerHeight
        && rect.left < window.innerWidth;
      return {
        index: i,
        tag: el.tagName,
        role: el.getAttribute('role'),
        href: el.getAttribute('href'),
        type: el.getAttribute('type'),
        visible,
        text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim(),
      };
    })).then(items => items.map(item => ({
      ...item,
      href: redactString(item.href || ''),
      text: redactString(item.text || ''),
    }))).catch(err => [{ error: redactString(err.message) }]),
  };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}

async function tryLogin(page) {
  const text = await bodyText(page);
  const looksLikeLogin = /correo|email|contrase|password|iniciar sesi|login/i.test(text);
  state.preflight.authRequired = looksLikeLogin;
  if (!looksLikeLogin || !email || !password) return { attempted: false, passed: !looksLikeLogin, reason: looksLikeLogin ? 'credentials-not-provided' : 'not-login' };

  await page.screenshot({ path: path.join(dirs.elements, 'login-before-fill.png') }).catch(() => {});
  const emailLocator = page.getByRole('textbox', { name: /correo|email/i }).first();
  const passwordLocator = page.getByRole('textbox', { name: /contrase|password/i }).first();
  await emailLocator.fill(email);
  await passwordLocator.fill(password);
  await page.getByRole('button', { name: /iniciar sesi|login|sign in|entrar/i }).first().click();
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const post = await bodyText(page);
  const stillLogin = /inicie sesi|correo|contrase|password/i.test(post) && /login/i.test(page.url());
  return { attempted: true, passed: !stillLogin, url: page.url(), stillLogin };
}

function discoverRoutes(snapshot, currentUrl) {
  const base = currentUrl;
  const seen = new Map();
  seen.set(new URL(base).pathname || '/', { id: slug(new URL(base).pathname || 'home'), path: new URL(base).pathname || '/', source: 'browser-current', access: 'protected', priority: 'critical', status: 'pending' });
  const configuredRoutes = Array.isArray(config.routes) ? config.routes : [];
  for (const route of configuredRoutes) {
    if (!route || !route.path) continue;
    seen.set(route.path, {
      id: route.id || slug(route.path),
      path: route.path,
      label: route.label || route.path,
      source: 'config',
      access: route.access || 'protected',
      priority: route.priority || 'normal',
      expected: route.expected,
      allowAccessDenied: !!route.allowAccessDenied,
      status: 'pending',
    });
  }
  for (const item of snapshot.interactive || []) {
    if (item.tag !== 'A' || !item.href) continue;
    const u = sameOriginHref(item.href, base);
    if (!u) continue;
    const pathOnly = u.pathname || '/';
    if (seen.has(pathOnly)) continue;
    const label = item.text || pathOnly;
    const priority = /inicio|dashboard|socios|cajas|proveedores|stock|perfil/i.test(label) ? 'critical' : 'normal';
    seen.set(pathOnly, { id: slug(pathOnly), path: pathOnly, label, source: 'browser-link', access: 'protected', priority, status: 'pending' });
  }
  return [...seen.values()].slice(0, args.maxRoutes);
}

function accessDeniedAllowed(route) {
  if (route.allowAccessDenied) return true;
  return state.config.allowedAccessDeniedPaths.includes(route.path);
}

async function checkRoute(page, route, consoleStart, errorsStart, networkStart) {
  const url = new URL(route.path, appUrl).toString();
  const routeId = route.id || slug(route.path);
  const beforeConsole = consoleStart().length;
  const beforeErrors = errorsStart().length;
  const beforeNetwork = networkStart().length;
  let status = 'pass';
  let severity = 'info';
  let observed = '';
  const screenshots = [];
  const snapshots = [];
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);
    for (const bp of state.config.breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(300);
      const shot = path.join(dirs.routes, `${routeId}-${bp.name}.png`);
      await page.screenshot({ path: shot });
      screenshots.push(rel(shot));
    }
    const snapFile = path.join(dirs.routes, `${routeId}-snapshot.json`);
    const snap = await snapshotPage(page, snapFile);
    snapshots.push(rel(snapFile));
    const overflow = await page.evaluate(() => ({ bodyScrollWidth: document.body.scrollWidth, innerWidth: window.innerWidth, hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth }));
    const blank = !snap.text || snap.text.trim().length < 5;
    const unauthorized = /acceso no autorizado|no tienes los permisos/i.test(snap.text || '');
    observed = `Route rendered ${snap.text.trim().length} chars; mobile overflow=${overflow.hasHorizontalOverflow}.`;
    if (blank || overflow.hasHorizontalOverflow || (unauthorized && !accessDeniedAllowed(route))) {
      status = 'fail';
      severity = blank ? 'critical' : unauthorized ? 'high' : 'medium';
      observed += blank ? ' Page appears blank.' : unauthorized ? ' Access denied page shown after navigating from visible app navigation.' : ' Horizontal overflow detected.';
    } else if (unauthorized) {
      observed += ' Access denied page matched configured expectation.';
    }
  } catch (err) {
    status = 'fail';
    severity = 'critical';
    observed = `Route check failed: ${err.message}`;
  }
  const consoleIssues = classifyConsole(consoleStart().slice(beforeConsole), errorsStart().slice(beforeErrors));
  const networkIssues = classifyNetwork(networkStart().slice(beforeNetwork));
  if (consoleIssues.some(i => i.severity === 'high') || networkIssues.some(i => i.severity === 'high')) {
    status = 'fail';
    severity = severity === 'critical' ? 'critical' : 'high';
    observed += ` Console/API issues: ${consoleIssues.length} console grouped, ${networkIssues.length} network grouped.`;
  } else if (networkIssues.length) {
    observed += ` Network warnings: ${networkIssues.length} grouped.`;
  }
  return {
    id: routeId,
    type: 'route',
    status,
    severity,
    expected: route.expected || `Route ${route.path} should render without blocking console/API errors or mobile overflow.`,
    observed,
    source: status === 'fail' ? 'app' : 'app',
    evidence: { screenshots, snapshots, console: consoleIssues, errors: [], network: networkIssues, notes: [] },
    rationale: status === 'pass' ? 'Route rendered with required visual/runtime evidence.' : 'Route violated smoke validation gates.',
  };
}

function isDestructiveLabel(label) {
  return /delete|remove|borrar|eliminar|cerrar sesi|logout|sign out|pagar|cobrar|guardar|save|submit|enviar|confirmar|aprobar|rechazar/i.test(label || '');
}

function safeElementCandidates(elements) {
  const seen = new Set();
  return elements.filter(item => {
    if (item.visible === false) return false;
    const label = String(item.label || '').trim();
    if (!label || item.destructive || isDestructiveLabel(label)) return false;
    const key = `${item.route}:${item.type}:${label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (item.type === 'a') return true;
    if (item.type === 'button') {
      if (/^cerrar\b|^close\b|^x$/i.test(label)) return false;
      return /abrir|mas|más|ver|configurar|settings|filtro|filtrar|buscar|search|menu|menú/i.test(label);
    }
    return false;
  }).slice(0, args.maxElements);
}

async function checkElement(page, item, consoleStart, errorsStart, networkStart) {
  const beforeConsole = consoleStart().length;
  const beforeErrors = errorsStart().length;
  const beforeNetwork = networkStart().length;
  const elementId = item.id || slug(`${item.route}-${item.type}-${item.label}`);
  const screenshots = [];
  const snapshots = [];
  let status = 'pass';
  let severity = 'info';
  let observed = '';
  try {
    const url = new URL(item.route || '/', appUrl).toString();
    const desktop = state.config.breakpoints.find(bp => bp.name === 'desktop') || state.config.breakpoints[state.config.breakpoints.length - 1] || { width: 1440, height: 900 };
    await page.setViewportSize({ width: desktop.width, height: desktop.height });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    const beforeUrl = page.url();
    const beforeText = (await bodyText(page)).slice(0, 4000);
    const preShot = path.join(dirs.elements, `${elementId}-before.png`);
    await page.screenshot({ path: preShot }).catch(() => {});
    screenshots.push(rel(preShot));

    let locator;
    if (item.type === 'a') locator = page.getByRole('link', { name: item.label }).first();
    else if (item.type === 'button') locator = page.getByRole('button', { name: item.label }).first();
    else locator = page.locator(item.type).filter({ hasText: item.label }).first();

    let count = await locator.count().catch(() => 0);
    if (!count) {
      const mobile = state.config.breakpoints.find(bp => bp.name === 'mobile') || { width: 375, height: 812 };
      await page.setViewportSize({ width: mobile.width, height: mobile.height });
      await page.waitForTimeout(300);
      count = await locator.count().catch(() => 0);
    }
    if (!count) {
      return {
        id: elementId,
        type: 'element',
        status: 'runner-fail',
        severity: 'info',
        source: 'runner',
        expected: `${item.type} "${item.label}" should be locatable with an accessible selector.`,
        observed: 'Element was discovered earlier but could not be resolved with a fresh accessible locator.',
        evidence: { screenshots, snapshots, console: [], errors: [], network: [], notes: ['stale-or-ambiguous-discovery'] },
        rationale: 'Runner could not verify product behavior with reliable evidence.',
      };
    }

    const href = item.type === 'a' ? (item.href || await locator.getAttribute('href').catch(() => null)) : null;
    const targetUrl = href ? new URL(href, beforeUrl).toString() : null;
    const targetPath = targetUrl ? new URL(targetUrl).pathname : null;
    const currentPath = new URL(beforeUrl).pathname;
    await locator.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    const afterText = (await bodyText(page)).slice(0, 4000);
    const postShot = path.join(dirs.elements, `${elementId}-after.png`);
    await page.screenshot({ path: postShot }).catch(() => {});
    screenshots.push(rel(postShot));
    const snapFile = path.join(dirs.elements, `${elementId}-after-snapshot.json`);
    await snapshotPage(page, snapFile);
    snapshots.push(rel(snapFile));

    const urlChanged = page.url() !== beforeUrl;
    const textChanged = afterText !== beforeText;
    const dialogVisible = await page.locator('[role="dialog"], dialog, [data-state="open"]').count().catch(() => 0);
    if (urlChanged || textChanged || dialogVisible > 0) {
      observed = `Action changed observable state: urlChanged=${urlChanged}, textChanged=${textChanged}, dialogOrOpenState=${dialogVisible > 0}.`;
    } else if (item.type === 'a' && targetPath === currentPath) {
      observed = 'Same-route navigation link remained stable with no runtime issues.';
    } else {
      status = 'fail';
      severity = 'medium';
      observed = 'Action completed but no observable URL, text, dialog, or open-state change was detected.';
    }
  } catch (err) {
    status = 'runner-fail';
    severity = 'info';
    observed = `Element check could not verify behavior: ${redactString(err.message)}`;
  }

  const consoleIssues = classifyConsole(consoleStart().slice(beforeConsole), errorsStart().slice(beforeErrors));
  const networkIssues = classifyNetwork(networkStart().slice(beforeNetwork));
  if (status === 'pass' && (consoleIssues.some(i => i.severity === 'high') || networkIssues.some(i => i.severity === 'high'))) {
    status = 'fail';
    severity = 'high';
    observed += ` Runtime issues after action: ${consoleIssues.length} console grouped, ${networkIssues.length} network grouped.`;
  }
  return {
    id: elementId,
    type: 'element',
    status,
    severity,
    source: status === 'runner-fail' ? 'runner' : 'app',
    expected: `${item.type} "${item.label}" should produce an observable non-destructive outcome.`,
    observed,
    evidence: { screenshots, snapshots, console: consoleIssues, errors: [], network: networkIssues, notes: [] },
    rationale: status === 'pass' ? 'Element interaction produced observable evidence.' : 'Element interaction did not satisfy validation gates.',
  };
}

function recomputeSummary() {
  const routes = Object.values(state.results.routes);
  const elements = Object.values(state.results.elements);
  const flows = Object.values(state.results.flows);
  state.summary.routesTested = routes.length;
  state.summary.routesPassed = routes.filter(r => r.status === 'pass').length;
  state.summary.routesFailed = routes.filter(r => r.status === 'fail').length;
  state.summary.routesSkipped = routes.filter(r => r.status === 'skip').length;
  state.summary.elementsTested = elements.length;
  state.summary.elementsPassed = elements.filter(r => r.status === 'pass').length;
  state.summary.elementsFailed = elements.filter(r => r.status === 'fail').length;
  state.summary.elementsSkipped = elements.filter(r => r.status === 'skip' || r.status === 'runner-fail').length;
  state.summary.flowsTested = flows.length;
  state.summary.flowsPassed = flows.filter(r => r.status === 'pass').length;
  state.summary.flowsFailed = flows.filter(r => r.status === 'fail').length;
  state.summary.flowsSkipped = flows.filter(r => r.status === 'skip').length;
  const allResults = [...routes, ...elements, ...flows];
  const consoleIssues = allResults.flatMap(r => r.evidence?.console || []);
  const networkIssues = allResults.flatMap(r => r.evidence?.network || []);
  state.summary.groupedConsoleIssues = consoleIssues.length;
  state.summary.consoleErrors = consoleIssues.reduce((sum, i) => sum + (i.count || 1), 0);
  state.summary.networkFailures = networkIssues.length;
  state.summary.rootCauseGroups = [...consoleIssues, ...networkIssues].reduce((acc, issue) => {
    const key = issue.rootCause || 'unknown';
    acc[key] = (acc[key] || 0) + (issue.count || 1);
    return acc;
  }, {});
  state.summary.issues = state.summary.routesFailed + state.summary.elementsFailed + state.summary.groupedConsoleIssues + state.summary.networkFailures;
}

function writeReport() {
  const routes = Object.values(state.results.routes);
  const elements = Object.values(state.results.elements);
  const failed = [...routes, ...elements].filter(r => r.status === 'fail');
  const runner = [...routes, ...elements].filter(r => r.status === 'runner-fail' || r.status === 'skip');
  const rootCauseRows = Object.entries(state.summary.rootCauseGroups || {}).sort((a, b) => b[1] - a[1]);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Validation ${esc(stamp)}</title><style>
body{font-family:system-ui,Segoe UI,sans-serif;margin:24px;line-height:1.45;color:#111827}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.card{border:1px solid #ddd;border-radius:8px;padding:12px;background:#fff}.pass{color:#057a35}.fail{color:#b42318}.skip,.runner-fail{color:#6b7280}.warning{color:#9a5b00}img{max-width:420px;border:1px solid #ddd;border-radius:6px;margin:6px}pre{background:#f6f6f6;padding:12px;border-radius:6px;white-space:pre-wrap;overflow:auto}section{margin-top:24px}.badge{font-weight:700}
</style></head><body>
<h1>Validation Report</h1>
<p><b>App:</b> ${esc(state.session.appUrl)}<br><b>Backend:</b> ${esc(state.session.backend)} ${esc(state.session.backendDetail || '')}<br><b>Mode:</b> ${esc(state.session.mode)}<br><b>Generated:</b> ${esc(state.report.generatedAt || new Date().toISOString())}</p>
<div class="grid"><div class="card"><b>Routes</b><br>${state.summary.routesPassed}/${state.summary.routesTested} passed</div><div class="card"><b>Elements</b><br>${state.summary.elementsPassed}/${state.summary.elementsTested} passed</div><div class="card"><b>Route Failures</b><br>${state.summary.routesFailed}</div><div class="card"><b>Runtime Groups</b><br>${state.summary.groupedConsoleIssues} console / ${state.summary.networkFailures || 0} network</div></div>
<section><h2>Root Causes</h2>${rootCauseRows.length ? `<ul>${rootCauseRows.map(([name, count]) => `<li><b>${esc(name)}</b>: ${esc(count)}</li>`).join('')}</ul>` : '<p>No grouped runtime failures.</p>'}</section>
<section><h2>App Failures</h2>${failed.length ? `<ul>${failed.map(i => `<li class="${esc(i.status)}"><b>${esc(i.id)}</b>: ${esc(i.observed)}</li>`).join('')}</ul>` : '<p class="pass">No verified app failures.</p>'}</section>
<section><h2>Runner/Skipped Checks</h2>${runner.length ? `<ul>${runner.map(i => `<li><b>${esc(i.id)}</b>: ${esc(i.observed)}</li>`).join('')}</ul>` : '<p>None.</p>'}</section>
<section><h2>Routes</h2>${routes.map(r => `<h3 class="${esc(r.status)}">${esc(r.id)}: ${esc(r.status)}</h3><p><b>Expected:</b> ${esc(r.expected)}<br><b>Observed:</b> ${esc(r.observed)}<br><b>Rationale:</b> ${esc(r.rationale)}</p>${(r.evidence?.screenshots || []).map(s => `<figure><img src="${esc(reportHref(s))}"><figcaption>${esc(s)}</figcaption></figure>`).join('')}${(r.evidence?.console || []).length ? `<h4>Console/API</h4><pre>${esc(JSON.stringify(r.evidence.console, null, 2))}</pre>` : ''}${(r.evidence?.network || []).length ? `<h4>Network</h4><pre>${esc(JSON.stringify(r.evidence.network, null, 2))}</pre>` : ''}`).join('')}</section>
<section><h2>Elements</h2>${elements.map(r => `<h3 class="${esc(r.status)}">${esc(r.id)}: ${esc(r.status)}</h3><p>${esc(r.observed)}</p>${(r.evidence?.screenshots || []).map(s => `<figure><img src="${esc(reportHref(s))}"><figcaption>${esc(s)}</figcaption></figure>`).join('')}${(r.evidence?.console || []).length ? `<h4>Console/API</h4><pre>${esc(JSON.stringify(r.evidence.console, null, 2))}</pre>` : ''}${(r.evidence?.network || []).length ? `<h4>Network</h4><pre>${esc(JSON.stringify(r.evidence.network, null, 2))}</pre>` : ''}`).join('')}</section>
<section><h2>State</h2><p><code>${esc(rel(statePath))}</code></p></section>
</body></html>`;
  fs.writeFileSync(reportPath, html);
}

(async () => {
  const browser = await chromium.launch({ headless: !args.headed });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleMessages = [];
  const pageErrors = [];
  const networkEvents = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: redactString(msg.text()), url: redactString(page.url()) }));
  page.on('pageerror', err => pageErrors.push({ message: redactString(err.message), stack: redactString(err.stack), url: redactString(page.url()) }));
  page.on('response', response => {
    const status = response.status();
    if (status < 400) return;
    networkEvents.push({
      url: redactString(response.url()),
      status,
      statusText: response.statusText(),
      method: response.request().method(),
      resourceType: response.request().resourceType(),
      pageUrl: redactString(page.url()),
    });
  });
  const getConsole = () => consoleMessages;
  const getErrors = () => pageErrors;
  const getNetwork = () => networkEvents;

  try {
    const t0 = Date.now();
    await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);
    state.preflight.serverStatus = 'responding';
    state.preflight.loadTimeMs = Date.now() - t0;
    state.preflight.passed = true;
    await page.screenshot({ path: path.join(dirs.routes, 'preflight-desktop.png') }).catch(() => {});
    save();

    const loginResult = await tryLogin(page);
    state.results.elements.login = {
      id: 'login',
      type: 'element',
      status: loginResult.passed ? 'pass' : (loginResult.attempted ? 'fail' : 'skip'),
      severity: loginResult.passed ? 'info' : 'critical',
      expected: 'Authenticated apps should accept provided valid credentials and leave the login screen.',
      observed: loginResult.attempted ? (loginResult.passed ? `Login succeeded; current URL ${page.url()}.` : `Login attempted but still on login screen; URL ${page.url()}.`) : `Login not attempted: ${loginResult.reason}.`,
      evidence: {
        screenshots: [rel(path.join(dirs.elements, 'login-before-fill.png'))].filter(p => fs.existsSync(path.join(root, p))),
        snapshots: [],
        console: [],
        errors: [],
        notes: [],
      },
      rationale: loginResult.passed ? 'Post-submit UI changed away from login.' : 'Authentication was not verified.',
    };
    save();

    const postSnapFile = path.join(dirs.routes, 'post-auth-discovery.json');
    const snap = await snapshotPage(page, postSnapFile);
    const routes = discoverRoutes(snap, page.url());
    state.discovery.routes = routes;
    state.discovery.elements = (snap.interactive || []).map(item => ({
      id: `post-auth-${item.tag?.toLowerCase() || 'el'}-${item.index}`,
      route: new URL(page.url()).pathname || '/',
      type: (item.tag || 'element').toLowerCase(),
      label: item.text || item.href || '',
      href: item.href || null,
      visible: item.visible !== false,
      expectedBehavior: item.tag === 'A' ? 'navigates' : item.tag === 'BUTTON' ? 'action' : 'input-or-other',
      destructive: /delete|remove|borrar|eliminar/i.test(item.text || ''),
      status: 'pending',
    }));
    state.discovery.completedAt = new Date().toISOString();
    state.queues.routes = routes.map(r => r.id);
    save();

    for (const route of routes) {
      const result = await checkRoute(page, route, getConsole, getErrors, getNetwork);
      state.results.routes[result.id] = result;
      state.queues.routes = state.queues.routes.filter(id => id !== result.id);
      recomputeSummary();
      save();
    }

    const elementCandidates = safeElementCandidates(state.discovery.elements);
    state.queues.elements = elementCandidates.map(e => e.id);
    save();
    for (const element of elementCandidates) {
      const result = await checkElement(page, element, getConsole, getErrors, getNetwork);
      state.results.elements[result.id] = result;
      state.queues.elements = state.queues.elements.filter(id => id !== element.id);
      recomputeSummary();
      save();
    }

    recomputeSummary();
    state.session.currentPhase = 'report';
    state.session.status = 'completed';
    state.session.completedAt = new Date().toISOString();
    state.report.path = rel(reportPath);
    state.report.generatedAt = new Date().toISOString();
    state.report.partial = false;
    writeReport();
    save();
    await browser.close();
    console.log(JSON.stringify({ ok: true, state: rel(statePath), report: rel(reportPath), summary: state.summary }, null, 2));
  } catch (err) {
    state.runner.failures.push({ message: err.message, stack: err.stack });
    state.session.status = 'failed';
    state.session.currentPhase = 'test';
    save();
    await browser.close().catch(() => {});
    console.error(err);
    process.exit(1);
  }
})();
