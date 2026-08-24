#!/usr/bin/env node
'use strict';
/**
 * visual-regression.js
 *
 * Catches UI regressions across runs — "the fix broke the layout". It captures a screenshot per
 * route × breakpoint. Baselines are written only with explicit --update; compare mode fails when a
 * baseline is missing and flags routes whose layout changed beyond a threshold.
 *
 * No native image dependencies: decoding + diffing happen inside the browser via <canvas>, so it
 * runs anywhere Playwright + Chrome runs. Run authenticated (per role) with --storage-state.
 *
 * Usage:
 *   # First run (or after an intended UI change) — write/update baselines:
 *   node visual-regression.js --url http://host/ --config validation.config.json --update
 *   # Later runs — compare against baseline:
 *   node visual-regression.js --url http://host/ --config validation.config.json \
 *     --storage-state test-manifest/auth/admin-state.json --threshold 0.2 --channel chrome
 *
 * Baselines live under <out>/baseline/<key>.png ; current + diff under <out>/visual/.
 * Exit 1 if any regression over threshold (compare mode); 0 otherwise; 2 on bad args.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
];

function parseArgs(argv) {
  const o = { threshold: 0.2 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') o.url = argv[++i];
    else if (a === '--config') o.config = argv[++i];
    else if (a === '--storage-state') o.storageState = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--channel') o.channel = argv[++i];
    else if (a === '--threshold') o.threshold = Number(argv[++i]);
    else if (a === '--tol') o.tol = Number(argv[++i]);
    else if (a === '--role') o.role = argv[++i];
    else if (a === '--update') o.update = true;
    else if (a === '--help') o.help = true;
  }
  return o;
}

async function launchResilient(chromium, channel) {
  if (channel) return chromium.launch({ channel, headless: true });
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  let last;
  for (const a of attempts) { try { return await chromium.launch(Object.assign({ headless: true }, a)); } catch (e) { last = e; } }
  throw new Error('Could not launch a browser (install Chrome / `npx playwright install chromium`, or pass --channel). ' + (last && last.message));
}

// Decode both PNGs into canvases in-page and diff pixel arrays. Returns changed-pixel count,
// percentage, bounding box of changes, and whether dimensions differ.
async function diffInPage(page, baselineBuf, currentBuf, tol) {
  const a = 'data:image/png;base64,' + baselineBuf.toString('base64');
  const b = 'data:image/png;base64,' + currentBuf.toString('base64');
  return page.evaluate(async ({ a, b, tol }) => {
    function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
    const ia = await load(a), ib = await load(b);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const mk = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = mk(ia), db = mk(ib);
    let changed = 0, minx = w, miny = h, maxx = 0, maxy = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > tol || Math.abs(da[i + 1] - db[i + 1]) > tol || Math.abs(da[i + 2] - db[i + 2]) > tol || Math.abs(da[i + 3] - db[i + 3]) > tol) {
        changed++; const p = (i / 4) | 0; const x = p % w, y = (p / w) | 0;
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    }
    const total = w * h;
    return { w, h, changed, total, pct: total ? (changed / total) * 100 : 0, bbox: changed ? { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 } : null, sizeChanged: ia.width !== ib.width || ia.height !== ib.height };
  }, { a, b, tol });
}

function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'home'; }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) { console.error('Usage: node visual-regression.js --url <url> [--config c] [--storage-state f] [--update] [--threshold 0.2] [--channel chrome]'); process.exit(args.help ? 0 : 2); }
  let config = {};
  if (args.config) {
    if (!fs.existsSync(args.config)) { console.error('config not found: ' + args.config); process.exit(2); }
    try { config = JSON.parse(fs.readFileSync(args.config, 'utf8')); }
    catch (error) { console.error('invalid config: ' + error.message); process.exit(2); }
  }
  if (args.storageState && !fs.existsSync(args.storageState)) { console.error('storage-state not found: ' + args.storageState); process.exit(2); }

  const root = args.config ? path.dirname(path.resolve(args.config)) : process.cwd();
  const outRoot = path.resolve(root, args.out || 'test-manifest');
  const rolePart = args.role ? `${args.role}/` : '';
  const baselineDir = path.join(outRoot, 'baseline', rolePart);
  const currentDir = path.join(outRoot, 'visual', rolePart);
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.mkdirSync(currentDir, { recursive: true });

  const routes = (config.routes && config.routes.length) ? config.routes.map(r => ({ id: r.id || slug(r.path), path: r.path })) : [{ id: 'home', path: '/' }];
  const breakpoints = config.breakpoints || DEFAULT_BREAKPOINTS;
  const tol = args.tol != null ? args.tol : 12; // per-channel 0-255 tolerance for anti-aliasing noise

  let chromium;
  try { chromium = require('playwright').chromium; } catch { console.error('playwright not installed.'); process.exit(2); }
  const browser = await launchResilient(chromium, args.channel);
  const results = [];
  let regressions = 0, newBaselines = 0, missingBaselines = 0;

  try {
    // A blank page used only as the canvas host for diffing.
    const diffCtx = await browser.newContext();
    const diffPage = await diffCtx.newPage();
    await diffPage.goto('about:blank');

    const ctxOpts = {};
    if (args.storageState) ctxOpts.storageState = args.storageState;

    for (const route of routes) {
      for (const bp of breakpoints) {
        const key = `${slug(route.id)}-${bp.name}`;
        const ctx = await browser.newContext(Object.assign({}, ctxOpts, { viewport: { width: bp.width, height: bp.height } }));
        const page = await ctx.newPage();
        await page.goto(new URL(route.path, args.url).toString(), { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(500);
        const currentBuf = await page.screenshot({ fullPage: true }).catch(() => null);
        await ctx.close();
        if (!currentBuf) { results.push({ key, error: 'screenshot failed' }); continue; }

        const baselinePath = path.join(baselineDir, `${key}.png`);
        const currentPath = path.join(currentDir, `${key}.png`);
        fs.writeFileSync(currentPath, currentBuf);

        if (args.update) {
          fs.writeFileSync(baselinePath, currentBuf);
          newBaselines++;
          results.push({ key, baseline: 'written', regression: false });
          continue;
        }
        if (!fs.existsSync(baselinePath)) {
          missingBaselines++;
          regressions++;
          results.push({ key, regression: true, error: 'baseline-missing', current: path.relative(root, currentPath).replace(/\\/g, '/') });
          continue;
        }
        const baselineBuf = fs.readFileSync(baselinePath);
        const d = await diffInPage(diffPage, baselineBuf, currentBuf, tol);
        const regression = d.sizeChanged || d.pct > args.threshold;
        if (regression) regressions++;
        results.push({ key, regression, pct: Number(d.pct.toFixed(3)), sizeChanged: d.sizeChanged, bbox: d.bbox, baseline: path.relative(root, baselinePath).replace(/\\/g, '/'), current: path.relative(root, currentPath).replace(/\\/g, '/') });
      }
    }
    await diffCtx.close();
  } finally {
    await browser.close().catch(() => {});
  }

  const out = { url: args.url, mode: args.update ? 'update' : 'compare', threshold: args.threshold, newBaselines, missingBaselines, regressions, results };
  if (args.out) { const f = path.join(outRoot, 'visual', `visual-regression-${args.role || 'all'}.json`); fs.writeFileSync(f, JSON.stringify(out, null, 2)); }
  console.log(JSON.stringify(out, null, 2));
  process.exit(!args.update && regressions > 0 ? 1 : 0);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(2); });
module.exports = { diffInPage };
