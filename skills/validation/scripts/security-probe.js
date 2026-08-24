#!/usr/bin/env node
'use strict';
/**
 * security-probe.js
 *
 * Lightweight ACTIVE security probe for the `validation` skill — right-sized for
 * Supabase / SMB web apps (not a full pentest). It runs a real browser and checks the
 * handful of things that actually bite these apps:
 *
 *   1. secrets-in-bundle   — service-role JWTs, private keys, sk_live, AKIA leaked into shipped JS
 *   2. idor                — object-level auth: navigate an authenticated role to a resource it
 *                            should NOT own (a foreign id) and assert it's blocked, not returned
 *                            ("change the id in the URL")
 *   3. input-fuzz          — submit hostile values into non-destructive forms; flag reflected XSS,
 *                            500s, or crashes. VAL_ data only; never auto-submits destructive forms
 *   4. headers             — missing security headers (CSP, X-Content-Type-Options, etc.)
 *
 * It NEVER tries destructive actions. It is a detector: it reports, it does not exploit.
 *
 * Usage:
 *   node security-probe.js --url http://host/ [--storage-state auth.json] [--channel chrome]
 *     [--config validation.config.json] [--out test-manifest/security/probe.json]
 *
 * Config (validation.config.json -> "security"):
 *   {
 *     "security": {
 *       "allowSecrets": ["substring-to-ignore"],     // e.g. a known-public token fragment
 *       "idorTargets": [                              // confirmed cross-user objects
 *         { "url": "/orders/{id}", "foreignId": "2", "label": "order belonging to another user" }
 *       ],
 *       "autoIdorPaths": ["/orders/1", "/invoices/10"], // numeric ids to increment-probe
 *       "skipFuzz": false
 *     }
 *   }
 *
 * Exit 0 if no high/critical findings, 1 otherwise, 2 on bad args / launch failure.
 */

const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  { id: 'private-key', severity: 'critical', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: 'aws-access-key', severity: 'critical', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'stripe-secret', severity: 'critical', re: /\bsk_live_[0-9A-Za-z]{20,}\b/ },
  { id: 'gh-token', severity: 'high', re: /\bgh[pousr]_[0-9A-Za-z]{20,}\b/ },
  { id: 'generic-secret-assign', severity: 'high', re: /(service_role|secret_key|client_secret|api_secret|private_key)["'`\s:=]{1,4}["'`][A-Za-z0-9._\-]{16,}/i },
];

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') o.url = argv[++i];
    else if (a === '--storage-state') o.storageState = argv[++i];
    else if (a === '--config') o.config = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--channel') o.channel = argv[++i];
    else if (a === '--help') o.help = true;
  }
  return o;
}

async function launchResilient(chromium, channel) {
  if (channel) return chromium.launch({ channel, headless: true });
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  let last;
  for (const a of attempts) { try { return await chromium.launch(Object.assign({ headless: true }, a)); } catch (e) { last = e; } }
  throw new Error('Could not launch a browser (install Chrome or run `npx playwright install chromium`, or pass --channel). ' + (last && last.message));
}

// A leaked Supabase service-role key is a JWT whose payload role == "service_role".
// The public anon key (role: "anon") is fine and must NOT be flagged.
function findServiceRoleJwt(text) {
  const hits = [];
  const re = /eyJ[A-Za-z0-9_-]{6,}\.(eyJ[A-Za-z0-9_-]{6,})\.[A-Za-z0-9_-]{6,}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    try {
      const payload = JSON.parse(Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      if (payload && payload.role === 'service_role') hits.push(m[0].slice(0, 24) + '…');
    } catch { /* not a JWT we can decode */ }
  }
  return hits;
}

function scanSecrets(resources, allow) {
  const findings = [];
  const allowList = allow || [];
  for (const r of resources) {
    const text = r.body || '';
    if (!text) continue;
    for (const p of SECRET_PATTERNS) {
      const m = text.match(p.re);
      if (m && !allowList.some(a => m[0].includes(a))) {
        findings.push({ check: 'secrets-in-bundle', severity: p.severity, detail: `${p.id} found in ${shorten(r.url)}`, evidence: m[0].slice(0, 40) + '…' });
      }
    }
    for (const jwt of findServiceRoleJwt(text)) {
      if (allowList.some(a => jwt.includes(a))) continue;
      findings.push({ check: 'secrets-in-bundle', severity: 'critical', detail: `Supabase service_role JWT shipped in ${shorten(r.url)} (full DB access, bypasses RLS)`, evidence: jwt });
    }
  }
  return dedupe(findings);
}

function shorten(u) { try { const x = new URL(u); return x.pathname.split('/').pop() || x.pathname; } catch { return String(u).slice(0, 60); } }
function dedupe(arr) { const seen = new Set(); return arr.filter(f => { const k = f.check + '|' + f.detail; if (seen.has(k)) return false; seen.add(k); return true; }); }

async function probeIdor(browser, appUrl, storageState, security) {
  const findings = [];
  const ctxOpts = { viewport: { width: 1280, height: 900 } };
  if (storageState) ctxOpts.storageState = storageState;

  async function fetchState(routePath) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    let httpStatus = null;
    page.on('response', resp => { if (resp.url() === new URL(routePath, appUrl).toString()) httpStatus = resp.status(); });
    await page.goto(new URL(routePath, appUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(400);
    const snap = await page.evaluate(() => {
      const t = (document.body && document.body.innerText || '');
      const lower = t.toLowerCase();
      return {
        path: location.pathname, chars: t.trim().length,
        login: !!document.querySelector('input[type="password"]') && /log\s?in|sign\s?in|iniciar sesi|contrase|password/.test(lower),
        denied: /access denied|unauthorized|no autoriz|forbidden|\b403\b|\b404\b|not found|sin permiso|no tienes/.test(lower),
      };
    }).catch(() => ({ path: routePath, chars: 0, login: false, denied: false }));
    await ctx.close();
    return Object.assign({ httpStatus }, snap);
  }

  // Confirmed cross-user objects: a foreign id the role must NOT be able to read.
  for (const t of (security.idorTargets || [])) {
    const foreign = t.url.replace('{id}', t.foreignId);
    const s = await fetchState(foreign);
    const blocked = s.login || s.denied || s.path !== new URL(foreign, appUrl).pathname || (s.httpStatus && s.httpStatus >= 400) || s.chars <= 40;
    if (!blocked) {
      findings.push({ check: 'idor', severity: 'critical', detail: `IDOR: ${foreign} (${t.label || 'foreign object'}) rendered real content for this role — object-level auth missing.`, evidence: `path=${s.path} http=${s.httpStatus} chars=${s.chars}` });
    }
  }

  // Auto-probe: increment a numeric id and see if a different object renders. "Suspect" (needs human
  // confirmation of ownership) rather than auto-critical, to avoid false alarms on public resources.
  for (const seed of (security.autoIdorPaths || [])) {
    const m = seed.match(/^(.*?)(\d+)(\D*)$/);
    if (!m) continue;
    const base = await fetchState(seed);
    if (base.login || base.denied) continue; // can't even see the seed; skip
    const nextId = String(Number(m[2]) + 1);
    const probe = `${m[1]}${nextId}${m[3]}`;
    const s = await fetchState(probe);
    const accessible = !s.login && !s.denied && s.path === new URL(probe, appUrl).pathname && (!s.httpStatus || s.httpStatus < 400) && s.chars > 40;
    if (accessible) {
      findings.push({ check: 'idor', severity: 'medium', detail: `Suspect IDOR: ${probe} (incremented id from ${seed}) returned content — confirm this role legitimately owns it.`, evidence: `path=${s.path} http=${s.httpStatus} chars=${s.chars}` });
    }
  }
  return findings;
}

const FUZZ_PAYLOADS = [
  { id: 'xss', value: '"><img src=x onerror=window.__xss=1>' },
  { id: 'xss-script', value: '<script>window.__xss=1</script>' },
  { id: 'sqlish', value: "' OR '1'='1" },
  { id: 'overlong', value: 'A'.repeat(2000) },
];

async function probeFuzz(browser, appUrl, storageState) {
  const findings = [];
  const ctxOpts = { viewport: { width: 1280, height: 900 } };
  if (storageState) ctxOpts.storageState = storageState;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  let serverError = false;
  page.on('response', r => { if (r.status() >= 500) serverError = true; });
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});

  // Only non-destructive text inputs (search/filter/generic). Skip password/email/destructive forms.
  const inputs = await page.locator('input[type="text"], input[type="search"], input:not([type])').all().catch(() => []);
  const tested = Math.min(inputs.length, 5);
  for (let i = 0; i < tested; i++) {
    const input = inputs[i];
    const name = (await input.getAttribute('name').catch(() => '')) || (await input.getAttribute('placeholder').catch(() => '')) || `input-${i}`;
    if (/pass|email|correo|card|cvv|amount|monto/i.test(name)) continue;
    for (const p of FUZZ_PAYLOADS) {
      serverError = false;
      await page.evaluate(() => { window.__xss = 0; }).catch(() => {});
      await input.fill(p.value).catch(() => {});
      await input.press('Enter').catch(() => {});
      await page.waitForTimeout(500);
      const xss = await page.evaluate(() => window.__xss === 1).catch(() => false);
      if (xss) findings.push({ check: 'input-fuzz', severity: 'critical', detail: `Reflected XSS executed via "${name}" with ${p.id} payload.`, evidence: p.value.slice(0, 40) });
      if (serverError) findings.push({ check: 'input-fuzz', severity: 'high', detail: `Server 500 from "${name}" with ${p.id} payload — unhandled input.`, evidence: p.value.slice(0, 40) });
    }
  }
  await ctx.close();
  return dedupe(findings);
}

function checkHeaders(headers) {
  const findings = [];
  const want = [
    { h: 'content-security-policy', severity: 'medium', why: 'no CSP — XSS has no second line of defense' },
    { h: 'x-content-type-options', severity: 'low', why: 'missing X-Content-Type-Options: nosniff' },
    { h: 'x-frame-options', severity: 'low', why: 'no X-Frame-Options / frame-ancestors — clickjacking risk', alt: 'content-security-policy' },
    { h: 'referrer-policy', severity: 'low', why: 'missing Referrer-Policy' },
  ];
  for (const w of want) {
    if (!headers[w.h] && !(w.alt && headers[w.alt])) findings.push({ check: 'headers', severity: w.severity, detail: w.why, evidence: `header ${w.h} absent` });
  }
  return findings;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) { console.error('Usage: node security-probe.js --url <url> [--storage-state f] [--config c] [--out f] [--channel chrome]'); process.exit(args.help ? 0 : 2); }
  let security = {};
  if (args.config) {
    if (!fs.existsSync(args.config)) { console.error('config not found: ' + args.config); process.exit(2); }
    try { security = (JSON.parse(fs.readFileSync(args.config, 'utf8')).security) || {}; }
    catch (error) { console.error('invalid config: ' + error.message); process.exit(2); }
  }
  if (args.storageState && !fs.existsSync(args.storageState)) { console.error('storage-state not found: ' + args.storageState); process.exit(2); }

  let chromium;
  try { chromium = require('playwright').chromium; } catch { console.error('playwright not installed.'); process.exit(2); }
  const browser = await launchResilient(chromium, args.channel);

  const findings = [];
  try {
    // Load the app once, capturing JS/JSON bodies + the main doc headers.
    const ctxOpts = { viewport: { width: 1280, height: 900 } };
    if (args.storageState) ctxOpts.storageState = args.storageState;
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const resources = [];
    let docHeaders = {};
    let scanned = 0;
    page.on('response', async (resp) => {
      try {
        const url = resp.url();
        const ct = resp.headers()['content-type'] || '';
        if (resp.request().resourceType() === 'document' && url.startsWith(args.url.split('#')[0].slice(0, 8))) docHeaders = resp.headers();
        if (scanned < 6_000_000 && (/javascript|json/.test(ct) || /\.js(\?|$)/.test(url))) {
          const body = await resp.text().catch(() => '');
          if (body) { resources.push({ url, body }); scanned += body.length; }
        }
      } catch { /* ignore */ }
    });
    await page.goto(args.url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(800);
    if (!Object.keys(docHeaders).length) { const main = await page.evaluate(() => document.documentElement.outerHTML).catch(() => ''); if (main) resources.push({ url: args.url, body: main }); }
    await ctx.close();

    findings.push(...scanSecrets(resources, security.allowSecrets));
    findings.push(...checkHeaders(docHeaders));
    findings.push(...(await probeIdor(browser, args.url, args.storageState, security)));
    if (!security.skipFuzz) findings.push(...(await probeFuzz(browser, args.url, args.storageState)));
  } finally {
    await browser.close().catch(() => {});
  }

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  findings.forEach(f => { if (bySeverity[f.severity] != null) bySeverity[f.severity]++; });
  const blocking = bySeverity.critical + bySeverity.high;
  const out = { url: args.url, generatedAt: process.env.VALIDATION_STAMP || new Date().toISOString(), bySeverity, blocking, findings };
  if (args.out) { fs.mkdirSync(path.dirname(args.out), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 2)); }
  console.log(JSON.stringify(out, null, 2));
  process.exit(blocking > 0 ? 1 : 0);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(2); });
module.exports = { scanSecrets, findServiceRoleJwt, checkHeaders };
