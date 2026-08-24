#!/usr/bin/env node
/**
 * responsive-audit.js
 *
 * Backend-agnostic responsive + layout-quality auditor for the `validation` skill.
 *
 * It does NOT just take a screenshot. It injects DOM measurements at a given
 * viewport and returns STRUCTURED findings for:
 *   - horizontal-scroll      page wider than the viewport (content overbloats screen)
 *   - mobile-scroll-container a visible nested horizontal scroller on mobile
 *   - overflow-x             a specific element extends past the right viewport edge
 *   - offscreen-left         an element is pushed off the left edge
 *   - text-clipped           text is cut off by its container (words not within margins)
 *   - element-overlap        two text/interactive elements visually collide
 *   - touch-target-small     interactive element below the mobile tap-target minimum
 *   - font-too-small         body text below a legible size on mobile
 *   - no-viewport-meta       responsive meta tag missing
 *
 * TWO WAYS TO USE IT:
 *
 * 1. playwright-local backend (deterministic, preferred when Playwright exists):
 *      node scripts/responsive-audit.js --url http://localhost:5173/customers \
 *        --out test-manifest/evidence/routes/customers-responsive.json
 *    Runs all standard breakpoints and writes one JSON file with per-breakpoint findings.
 *
 * 2. Any other backend (agent-browser, playwright-mcp, chrome-mcp, browser-harness):
 *    Read this file, take the exported AUDIT_SOURCE string, and inject it through the
 *    backend's evaluate primitive AFTER you have set the viewport, e.g.:
 *      <evaluate> ( __AUDIT_SOURCE__ + "\n;return __validationResponsiveAudit({mobile:true});" )
 *    The function is pure browser-side JS (no Node, no deps) and returns the same shape.
 *
 * Exit code (CLI mode): 0 if no high-severity findings at any breakpoint, 1 otherwise.
 */

'use strict';

/* ----------------------------------------------------------------------------
 * The injected browser-side auditor. Pure DOM. No external references.
 * Keep this self-contained: its .toString() is what gets injected.
 * -------------------------------------------------------------------------- */
function __validationResponsiveAudit(opts) {
  opts = opts || {};
  var TOUCH_MIN = opts.touchMin || 44;       // CSS px, Apple HIG / WCAG 2.5.5 floor
  var MIN_FONT = opts.minFont || 12;         // CSS px, mobile legibility floor
  var EDGE_TOL = 2;                          // px tolerance for sub-pixel rounding
  var isMobile = !!opts.mobile;
  var MAX_FINDINGS = opts.maxFindings || 250;
  var MAX_ELEMENTS = opts.maxElements || 4000;

  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var findings = [];

  function push(type, severity, el, detail) {
    findings.push({ type: type, severity: severity, selector: el ? shortSelector(el) : null, detail: detail });
  }

  function shortSelector(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.id) return '#' + el.id;
    var parts = [];
    var node = el;
    for (var depth = 0; node && node.nodeType === 1 && depth < 4; depth++) {
      var part = node.tagName.toLowerCase();
      var cls = (node.getAttribute && node.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)[0];
      if (cls) part += '.' + cls;
      parts.unshift(part);
      if (node.id) { parts[0] = '#' + node.id; break; }
      node = node.parentElement;
    }
    return parts.join('>');
  }

  function visible(el) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (r.bottom < 0 || r.top > vh) return false; // below/above fold is fine, only need in-view-ish
    return true;
  }

  function hasDirectText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim().length > 1) return true;
    }
    return false;
  }

  function isInteractive(el) {
    var tag = el.tagName;
    if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
    var role = el.getAttribute && el.getAttribute('role');
    if (role && /button|link|menuitem|tab|checkbox|switch/.test(role)) return true;
    if (el.hasAttribute && el.hasAttribute('onclick')) return true;
    return false;
  }

  function clipsContent(cs) {
    return /hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflow);
  }

  // 1) Page-level horizontal overflow (content overbloats / unexpected horizontal scrollbar)
  var docW = document.documentElement.scrollWidth;
  if (docW - vw > EDGE_TOL) {
    push('horizontal-scroll', 'high', document.documentElement,
      'page scrollWidth ' + docW + 'px exceeds viewport ' + vw + 'px by ' + (docW - vw) + 'px');
  }

  // 2) Viewport meta (mobile responsiveness prerequisite)
  if (isMobile && !document.querySelector('meta[name="viewport"]')) {
    push('no-viewport-meta', 'high', null, 'no <meta name="viewport"> tag; mobile layout will not scale');
  }

  var all = document.body ? document.body.getElementsByTagName('*') : [];
  var n = Math.min(all.length, MAX_ELEMENTS);
  var candidates = []; // for overlap pass

  for (var i = 0; i < n; i++) {
    var el = all[i];
    if (!visible(el)) continue;
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);

    // Nested horizontal scrolling on mobile is still an unusable responsive
    // layout for tables/forms. Carousels must opt in explicitly after review.
    if (isMobile && /auto|scroll/.test(cs.overflowX) &&
        el.scrollWidth > el.clientWidth + EDGE_TOL &&
        el.getAttribute('data-validation-horizontal-scroll') !== 'allow') {
      push('mobile-scroll-container', 'high', el,
        'nested horizontal scrollWidth ' + el.scrollWidth + 'px exceeds clientWidth ' +
        el.clientWidth + 'px; reflow content or explicitly approve a reviewed carousel');
    }

    // 3) Element extends past the right edge of the viewport (out of margin)
    if (r.right > vw + EDGE_TOL && r.left >= -EDGE_TOL && r.left < vw && (r.right - r.left) <= vw) {
      // only flag elements that themselves overflow, not huge wrappers clipped by ancestor scroll
      if (!clipsContentAncestor(el)) {
        push('overflow-x', 'high', el, 'element right edge ' + Math.round(r.right) + 'px past viewport ' + vw + 'px');
      }
    }

    // 4) Element pushed off the left edge
    if (r.left < -EDGE_TOL && r.right > 0) {
      push('offscreen-left', 'medium', el, 'element left edge ' + Math.round(r.left) + 'px is off-screen');
    }

    // 5) Text clipped by its own container (words not within margins)
    if (hasDirectText(el) && clipsContent(cs) && el.scrollWidth > el.clientWidth + EDGE_TOL) {
      push('text-clipped', 'medium', el,
        'text scrollWidth ' + el.scrollWidth + 'px clipped by container clientWidth ' + el.clientWidth + 'px');
    }

    // 6) Mobile tap-target floor
    if (isMobile && isInteractive(el) && (r.width < TOUCH_MIN || r.height < TOUCH_MIN)) {
      push('touch-target-small', 'medium', el,
        'interactive target ' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px below ' + TOUCH_MIN + 'px minimum');
    }

    // 7) Mobile legibility floor
    if (isMobile && hasDirectText(el)) {
      var fs = parseFloat(cs.fontSize);
      if (fs && fs < MIN_FONT) {
        push('font-too-small', 'low', el, 'font-size ' + fs + 'px below ' + MIN_FONT + 'px legibility floor');
      }
    }

    if ((hasDirectText(el) || isInteractive(el)) && cs.position !== 'fixed' && cs.position !== 'absolute') {
      candidates.push({ el: el, r: r });
    }
    if (findings.length >= MAX_FINDINGS) break;
  }

  function clipsContentAncestor(el) {
    var p = el.parentElement;
    for (var d = 0; p && d < 6; d++) {
      var pcs = getComputedStyle(p);
      if (/auto|scroll|hidden|clip/.test(pcs.overflowX)) return true;
      p = p.parentElement;
    }
    return false;
  }

  // 8) Overlap detection — conservative to avoid false positives.
  // Bucket by row so this stays near-linear; only flag leaf-ish, non-positioned,
  // non-ancestor pairs whose intersection covers >55% of the smaller box.
  if (findings.length < MAX_FINDINGS) {
    var buckets = {};
    for (var c = 0; c < candidates.length; c++) {
      var key = Math.floor(candidates[c].r.top / 24);
      (buckets[key] = buckets[key] || []).push(candidates[c]);
      (buckets[key - 1] = buckets[key - 1] || []).push(candidates[c]);
    }
    var seen = {};
    var overlapCount = 0;
    for (var bk in buckets) {
      var grp = buckets[bk];
      for (var a = 0; a < grp.length; a++) {
        for (var b = a + 1; b < grp.length; b++) {
          if (overlapCount >= 30) break;
          var A = grp[a], B = grp[b];
          if (A.el === B.el) continue;
          if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
          var ix = Math.max(0, Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left));
          var iy = Math.max(0, Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top));
          var inter = ix * iy;
          if (inter <= 0) continue;
          var areaA = A.r.width * A.r.height, areaB = B.r.width * B.r.height;
          var smaller = Math.min(areaA, areaB);
          if (smaller > 0 && inter / smaller > 0.55) {
            var dedupe = shortSelector(A.el) + '|' + shortSelector(B.el);
            if (seen[dedupe]) continue;
            seen[dedupe] = true;
            overlapCount++;
            push('element-overlap', 'medium', A.el,
              'overlaps ' + shortSelector(B.el) + ' by ' + Math.round((inter / smaller) * 100) + '% of smaller box');
          }
        }
      }
    }
  }

  var bySeverity = { high: 0, medium: 0, low: 0 };
  findings.forEach(function (f) { if (bySeverity[f.severity] != null) bySeverity[f.severity]++; });

  return {
    url: location.href,
    viewport: { w: vw, h: vh },
    mobile: isMobile,
    docScrollWidth: docW,
    findingCount: findings.length,
    bySeverity: bySeverity,
    findings: findings
  };
}

/* Source string for injection by non-Node backends. */
var AUDIT_SOURCE = __validationResponsiveAudit.toString();

module.exports = { __validationResponsiveAudit: __validationResponsiveAudit, AUDIT_SOURCE: AUDIT_SOURCE };

/* ----------------------------------------------------------------------------
 * CLI runner (playwright-local backend). Only runs when invoked directly and
 * Playwright is installed in the target project.
 * -------------------------------------------------------------------------- */
if (require.main === module) {
  (async function main() {
    var args = parseArgs(process.argv.slice(2));
    if (!args.url) {
      console.error('Usage: node responsive-audit.js --url <url> [--out file.json] [--mobile-only] [--json] [--channel chrome] [--storage-state auth.json]');
      process.exit(2);
    }

    var chromium;
    try {
      chromium = require('playwright').chromium;
    } catch (e) {
      console.error('playwright not installed in this project. Use the injection path with another backend.');
      console.error('Read AUDIT_SOURCE from this file and inject __validationResponsiveAudit({mobile:bool}) after setting the viewport.');
      process.exit(2);
    }

    var breakpoints = [
      { name: 'mobile', w: 375, h: 812, mobile: true },
      { name: 'tablet', w: 768, h: 1024, mobile: false },
      { name: 'laptop', w: 1024, h: 768, mobile: false },
      { name: 'desktop', w: 1440, h: 900, mobile: false }
    ];
    if (args['mobile-only']) breakpoints = breakpoints.filter(function (b) { return b.mobile; });

    // Authenticated runs: load a saved Playwright storageState so protected apps are audited
    // logged in, not on the login screen. Without it, a protected app audits only its login page.
    var fsMod = require('fs');
    var ctxBase = {};
    if (args['storage-state']) {
      if (!fsMod.existsSync(args['storage-state'])) {
        console.error('storage-state file not found: ' + args['storage-state']);
        process.exit(2);
      }
      ctxBase.storageState = args['storage-state'];
    }

    var browser = await launchChromium(chromium, args.channel);
    var results = [];
    var loginMasquerade = false;
    try {
      for (var i = 0; i < breakpoints.length; i++) {
        var bp = breakpoints[i];
        var ctxOpts = Object.assign({}, ctxBase, { viewport: { width: bp.w, height: bp.h } });
        var ctx = await browser.newContext(ctxOpts);
        var page = await ctx.newPage();
        await page.goto(args.url, { waitUntil: 'networkidle', timeout: 30000 }).catch(function () {});
        await page.waitForTimeout(600);
        // Login-masquerade guard: if a storage-state was supplied (i.e. we expect to be
        // authenticated) but the page still shows a login form, the audit is meaningless.
        if (args['storage-state']) {
          var onLogin = await page.evaluate(function () {
            var t = (document.body && document.body.innerText || '').toLowerCase();
            var hasPwd = !!document.querySelector('input[type="password"]');
            return hasPwd && /log\s?in|sign\s?in|iniciar sesi|contrase|password/.test(t);
          }).catch(function () { return false; });
          if (onLogin) loginMasquerade = true;
        }
        var res = await page.evaluate(__validationResponsiveAudit, { mobile: bp.mobile });
        res.breakpoint = bp.name;
        results.push(res);
        await ctx.close();
      }
    } finally {
      await browser.close();
    }

    if (loginMasquerade) {
      console.error('AUTH ERROR: storage-state supplied but page still shows a login form. ' +
        'The session is not authenticated — re-establish auth before auditing protected routes.');
      process.exit(3);
    }

    var highTotal = results.reduce(function (s, r) { return s + r.bySeverity.high; }, 0);
    var out = { url: args.url, generatedAt: new Date().toISOString(), highSeverityTotal: highTotal, breakpoints: results };

    if (args.out) {
      var fs = require('fs');
      var path = require('path');
      fs.mkdirSync(path.dirname(args.out), { recursive: true });
      fs.writeFileSync(args.out, JSON.stringify(out, null, 2));
    }
    if (args.json || !args.out) {
      console.log(JSON.stringify(out, null, 2));
    } else {
      printSummary(out);
    }
    process.exit(highTotal > 0 ? 1 : 0);
  })().catch(function (e) { console.error(e); process.exit(2); });
}

/**
 * Launch resilient to environments without Playwright's bundled Chromium.
 * Order: explicit --channel, then bundled Chromium, then system Chrome/Edge channels.
 * Many machines (e.g. dev Windows boxes) have Chrome but never ran `playwright install`.
 */
async function launchChromium(chromium, channel) {
  if (channel) return chromium.launch({ channel: channel, headless: true });
  var attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  var lastErr;
  for (var i = 0; i < attempts.length; i++) {
    try {
      var opts = Object.assign({ headless: true }, attempts[i]);
      return await chromium.launch(opts);
    } catch (e) { lastErr = e; }
  }
  throw new Error('Could not launch a browser. Run `npx playwright install chromium`, install Chrome, or pass --channel. Last error: ' + (lastErr && lastErr.message));
}

function parseArgs(argv) {
  var out = {};
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a.indexOf('--') === 0) {
      var key = a.slice(2);
      if (i + 1 < argv.length && argv[i + 1].indexOf('--') !== 0) { out[key] = argv[++i]; }
      else { out[key] = true; }
    }
  }
  return out;
}

function printSummary(out) {
  console.log('Responsive audit: ' + out.url);
  out.breakpoints.forEach(function (b) {
    console.log('  [' + b.breakpoint + ' ' + b.viewport.w + 'x' + b.viewport.h + '] ' +
      b.findingCount + ' findings (high:' + b.bySeverity.high + ' med:' + b.bySeverity.medium + ' low:' + b.bySeverity.low + ')');
    b.findings.slice(0, 8).forEach(function (f) {
      console.log('     - ' + f.severity + ' ' + f.type + ' ' + (f.selector || '') + ' :: ' + f.detail);
    });
  });
  console.log('  high-severity total: ' + out.highSeverityTotal);
}
