#!/usr/bin/env node
/**
 * responsive-audit.js
 *
 * Backend-agnostic responsive + layout-quality auditor for the `validation` skill.
 *
 * It does NOT just take a screenshot. It injects DOM measurements at a given
 * viewport and returns STRUCTURED findings for:
 *   - horizontal-scroll       page wider than the viewport (content overbloats screen)
 *   - mobile-scroll-container a visible nested horizontal scroller on mobile
 *   - overflow-x              a specific element extends past the right viewport edge
 *   - offscreen-left          an element is pushed off the left edge
 *   - text-clipped            text is cut off by its container (words not within margins)
 *   - element-overlap         two text/interactive elements visually collide
 *   - touch-target-small      interactive element below the mobile tap-target minimum
 *   - font-too-small          body text below a legible size on mobile
 *   - no-viewport-meta        responsive meta tag missing
 *   - sidebar-clipped         desktop/laptop sidebar clips navigation items vertically
 *   - narrow-column-waste     desktop/laptop screen scrolls vertically while leaving >52% width empty
 *   - above-the-fold-cta      compact form's primary submit/action CTA falls below viewport fold
 *   - wcag-contrast-fail      computed text-vs-background contrast ratio fails WCAG AA floor
 *
 * TWO WAYS TO USE IT:
 *
 * 1. playwright-local backend (deterministic, preferred when Playwright exists):
 *      node scripts/responsive-audit.js --url http://localhost:5173/customers \
 *        --out test-manifest/evidence/routes/customers-responsive.json
 *    Runs all standard breakpoints (mobile 375x812, tablet 768x1024, hd-laptop 1366x650,
 *    desktop 1440x900, fhd 1920x1080) and writes one JSON file with per-breakpoint findings.
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
    if (r.bottom < 0 || r.top > vh) return false;
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

  // Color & WCAG 2.1 contrast helpers (walk opaque backgrounds safely)
  function parseRgba(str) {
    if (!str || str === 'transparent') return null;
    var m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s\/]+([\d.]+))?\s*\)/i);
    if (!m) return null;
    var a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: a };
  }

  function blend(fg, bg) {
    var a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1
    };
  }

  function effectiveBg(el) {
    var layers = [];
    var cur = el;
    for (var depth = 0; cur && cur.nodeType === 1 && depth < 12; depth++) {
      var c = parseRgba(getComputedStyle(cur).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.99) break;
      }
      cur = cur.parentElement;
    }
    var base = { r: 255, g: 255, b: 255, a: 1 };
    for (var k = layers.length - 1; k >= 0; k--) {
      base = blend(layers[k], base);
    }
    return base;
  }

  function relLum(c) {
    var vals = [c.r / 255, c.g / 255, c.b / 255].map(function (v) {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2];
  }

  function contrastRatio(fg, bg) {
    var l1 = relLum(fg);
    var l2 = relLum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function isDisabledEl(el) {
    if (el.disabled) return true;
    var cur = el;
    for (var d = 0; cur && d < 4; d++) {
      if (cur.getAttribute && (cur.getAttribute('aria-disabled') === 'true' || cur.hasAttribute('disabled'))) return true;
      var op = parseFloat(getComputedStyle(cur).opacity);
      if (op < 0.75) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  // 1) Page-level horizontal overflow (content overbloats / unexpected horizontal scrollbar)
  var docW = document.documentElement.scrollWidth;
  var docH = document.documentElement.scrollHeight;
  if (docW - vw > EDGE_TOL) {
    push('horizontal-scroll', 'high', document.documentElement,
      'page scrollWidth ' + docW + 'px exceeds viewport ' + vw + 'px by ' + (docW - vw) + 'px');
  }

  // 2) Viewport meta (mobile responsiveness prerequisite)
  if (isMobile && !document.querySelector('meta[name="viewport"]')) {
    push('no-viewport-meta', 'high', null, 'no <meta name="viewport"> tag; mobile layout will not scale');
  }

  // 2b) Desktop/laptop sidebar vertical clipping check (critical on 1366x650)
  if (vw >= 1024) {
    var asides = document.querySelectorAll('aside');
    for (var si = 0; si < asides.length; si++) {
      var aside = asides[si];
      if (!visible(aside)) continue;
      var nav = aside.querySelector('nav') || aside;
      var ncs = getComputedStyle(nav);
      if (nav.scrollHeight > nav.clientHeight + 4 && /hidden|clip/.test(ncs.overflowY)) {
        push('sidebar-clipped', 'high', nav,
          'sidebar navigation scrollHeight ' + nav.scrollHeight + 'px exceeds clientHeight ' + nav.clientHeight + 'px with overflow hidden');
      }
    }
  }

  // 2c) Narrow-column waste on desktop/laptop: vertical scrolling while leaving >52% of width empty
  if (vw >= 1200 && docH > vh + 40) {
    var mainEl = document.querySelector('main') || document.body;
    var mainRect = mainEl.getBoundingClientRect();
    if (mainRect.width >= 900) {
      var cards = mainEl.querySelectorAll('form, [class*="max-w-md"], [class*="max-w-sm"], [class*="max-w-lg"]');
      var widest = 0;
      var tallestNarrow = null;
      var directKids = mainEl.children;
      for (var dk = 0; dk < directKids.length; dk++) {
        var kr = directKids[dk].getBoundingClientRect();
        if (kr.width > widest && kr.height > 80) widest = kr.width;
      }
      for (var ci = 0; ci < cards.length; ci++) {
        var cr = cards[ci].getBoundingClientRect();
        if (cr.height > vh * 0.75 && cr.width > 200 && cr.width < mainRect.width * 0.48) {
          tallestNarrow = { el: cards[ci], w: Math.round(cr.width), h: Math.round(cr.height) };
          break;
        }
      }
      if (tallestNarrow && widest < mainRect.width * 0.55) {
        push('narrow-column-waste', 'high', tallestNarrow.el,
          'content is ' + tallestNarrow.w + 'px wide (' + Math.round((tallestNarrow.w / mainRect.width) * 100) +
          '% of ' + Math.round(mainRect.width) + 'px container) while forcing ' + docH + 'px vertical scroll on ' + vw + 'x' + vh);
      }
    }
  }

  // 2d) Above-the-fold primary CTA & login-screen vertical fit on 1366x650 / 1920x1080
  if (vw >= 1200) {
    var forms = document.querySelectorAll('form');
    if (forms.length === 1) {
      var formEl = forms[0];
      var inputsCount = formEl.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
      var submitBtn = formEl.querySelector('button[type="submit"], input[type="submit"]');
      if (inputsCount > 0 && inputsCount <= 8 && submitBtn) {
        var sbr = submitBtn.getBoundingClientRect();
        if (sbr.width > 0 && sbr.height > 0 && sbr.bottom > vh + 12) {
          push('above-the-fold-cta', 'high', submitBtn,
            'compact form (' + inputsCount + ' fields) primary submit CTA bottom ' + Math.round(sbr.bottom) +
            'px falls below viewport height ' + vh + 'px');
        }
      }
      var hasPwdInput = !!formEl.querySelector('input[type="password"]');
      var hasNavShell = document.querySelectorAll('aside a, nav a').length >= 3;
      if (hasPwdInput && !hasNavShell && docH > vh + 32) {
        push('login-screen-scroll', 'high', formEl,
          'standalone login screen height ' + docH + 'px exceeds ' + vw + 'x' + vh + ' viewport; must fit without scrolling');
      }
    }
  }

  var all = document.body ? document.body.getElementsByTagName('*') : [];
  var n = Math.min(all.length, MAX_ELEMENTS);
  var candidates = []; // for overlap pass
  var contrastFindings = 0;

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

    // 7b) WCAG AA real contrast check on visible direct-text controls/labels/pills (skip disabled/gradients/images)
    if (contrastFindings < 20 && hasDirectText(el) && !isDisabledEl(el) && cs.backgroundImage === 'none') {
      var fg = parseRgba(cs.color);
      if (fg && fg.a >= 0.85) {
        var bg = effectiveBg(el);
        var effectiveFg = fg.a < 0.99 ? blend(fg, bg) : fg;
        var ratio = contrastRatio(effectiveFg, bg);
        var fSize = parseFloat(cs.fontSize) || 14;
        var fWeight = parseInt(cs.fontWeight, 10) || 400;
        var isLarge = fSize >= 18.66 || (fSize >= 14 && fWeight >= 700);
        var minReq = isLarge ? 3.0 : 4.5;
        if (ratio < 2.6) {
          contrastFindings++;
          push('wcag-contrast-fail', 'high', el,
            'severe low contrast ' + ratio.toFixed(2) + ':1 (min ' + minReq + ':1; color ' + cs.color + ' on rgb(' +
            Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + '))');
        } else if (ratio < minReq) {
          contrastFindings++;
          push('wcag-contrast-fail', 'medium', el,
            'contrast ' + ratio.toFixed(2) + ':1 below WCAG AA ' + minReq + ':1 (color ' + cs.color + ' on rgb(' +
            Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + '))');
        }
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
    docScrollHeight: docH,
    verticalRatio: +(docH / Math.max(1, vh)).toFixed(2),
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
      { name: 'hd-laptop', w: 1366, h: 650, mobile: false },
      { name: 'desktop', w: 1440, h: 900, mobile: false },
      { name: 'fhd', w: 1920, h: 1080, mobile: false }
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
        // Login-masquerade guard: avoid false-positives on authenticated settings/shift pages
        // that legitimately render a password input inside the authenticated app shell.
        if (args['storage-state']) {
          var onLogin = await page.evaluate(function () {
            var p = (location.pathname || '').toLowerCase();
            var isLoginPath = /(^|\/)(login|signin|sign-in)\/?$/.test(p);
            var hasAuthShell = !!document.querySelector('aside nav a, nav a[href*="logout"], [data-auth-shell]') ||
              document.querySelectorAll('aside a, nav a').length >= 3;
            if (hasAuthShell && !isLoginPath) return false;
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
    console.log('  [' + b.breakpoint + ' ' + b.viewport.w + 'x' + b.viewport.h + ' h=' + b.docScrollHeight + 'px] ' +
      b.findingCount + ' findings (high:' + b.bySeverity.high + ' med:' + b.bySeverity.medium + ' low:' + b.bySeverity.low + ')');
    b.findings.slice(0, 8).forEach(function (f) {
      console.log('     - ' + f.severity + ' ' + f.type + ' ' + (f.selector || '') + ' :: ' + f.detail);
    });
  });
  console.log('  high-severity total: ' + out.highSeverityTotal);
}
