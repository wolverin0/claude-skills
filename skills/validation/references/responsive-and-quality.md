# Responsive & Layout-Quality Verification

Screenshots alone do not prove an app is responsive. A breakpoint "passes" only when the
page was **measured** and produced no high-severity layout defects. This reference defines
how to measure and how to turn measurements into verdicts.

This is the part the validation skill exists to enforce: *the words stay within the margins,
nothing overflows the viewport, nothing overlaps, nothing is clipped, targets are tappable.*

## The auditor

`scripts/responsive-audit.js` injects DOM measurements at a viewport and returns structured
findings. It is pure browser-side JS with no dependencies, so every backend can run it.

Finding types:

| Type | Severity | Means |
| --- | --- | --- |
| `horizontal-scroll` | high | Page is wider than the viewport (content overbloats the screen) |
| `mobile-scroll-container` | high | A visible nested container requires sideways scrolling on mobile; reflow it unless an intentionally reviewed carousel opts in with `data-validation-horizontal-scroll="allow"` |
| `overflow-x` | high | A specific element extends past the right viewport edge |
| `no-viewport-meta` | high | Missing `<meta name="viewport">`; mobile layout will not scale |
| `offscreen-left` | medium | An element is pushed off the left edge |
| `text-clipped` | medium | Text is cut off by its container (words not within margins) |
| `element-overlap` | medium | Two text/interactive elements visually collide |
| `touch-target-small` | medium | Interactive target below the tap-target minimum (mobile) |
| `font-too-small` | low | Body text below the legibility floor (mobile) |

Thresholds (override via `validation.config.json` → `responsive`):

- tap-target minimum: 44 CSS px (WCAG 2.5.5 / Apple HIG)
- mobile font floor: 12 CSS px
- edge tolerance: 2 px (sub-pixel rounding)

## How to run it per backend

**playwright-local** (deterministic, preferred when Playwright is installed):

```bash
node path/to/scripts/responsive-audit.js \
  --url http://localhost:5173/customers \
  --storage-state test-manifest/auth/admin-state.json \
  --out test-manifest/evidence/routes/admin/customers-responsive.json
```

Runs all four standard breakpoints and writes one JSON file. Exit code is 1 if any breakpoint has
a high-severity finding, 3 if a storage-state was supplied but the page still shows a login form
(auth not established — see `references/auth.md`).

**For any protected app, `--storage-state` is required** — without it the auditor navigates a
fresh anonymous context per breakpoint and audits only the login screen. Establish auth first
(per role), save the storage-state, then pass it here. Run once per role for multi-role apps.

**agent-browser / playwright-mcp / chrome-mcp / browser-harness** (injection path):

1. Set the viewport for the breakpoint (resize).
2. Read `scripts/responsive-audit.js` and take the exported `AUDIT_SOURCE` string (the
   `__validationResponsiveAudit` function body).
3. Inject and call it through the backend's evaluate primitive, after the page is stable:

   ```js
   // pseudo: backend.evaluate(<AUDIT_SOURCE> + "\nreturn __validationResponsiveAudit({mobile:true});")
   ```

   Pass `{mobile:true}` for the 375px breakpoint, `{mobile:false}` otherwise.
4. Save the returned JSON to `test-manifest/evidence/routes/{routeId}-responsive-{breakpoint}.json`.

Run it at **every** breakpoint the mode requires — not just one. The same defect often
appears only at mobile or only at desktop.

## Finding → verdict mapping

Per breakpoint, after capturing the screenshot:

- **Any `high` finding → the route fails the responsive gate** (`fail`, severity high).
  Record the specific selector and measured numbers as evidence — never "looks off".
- **`medium` findings → route is `warning`** unless config marks the route exempt. List each.
- **`low` findings → recorded as info**, do not fail by themselves.
- **Zero findings at a breakpoint → that breakpoint passes the responsive gate**, but the
  route still needs the screenshot analyzed and console/errors checked (see evidence-rules).

`element-overlap` is intentionally conservative (only flags >55% box intersection of
non-positioned, non-ancestor pairs). Treat a single overlap as `warning` and confirm against
the screenshot before escalating; treat clustered overlaps as a real `fail`.

Always cross-check one high-severity finding against its screenshot before reporting, so a
measurement bug never ships as an app bug. If the screenshot contradicts the measurement,
classify the failure source as `runner`, not `app` (see evidence-rules).

## Best-practices / accessibility checklist

These run from evidence the skill already collects (the accessibility snapshot every backend
captures) plus a few targeted `evaluate` checks. They are concrete and checkable — not "looks
accessible". Run them once per route at the desktop breakpoint unless noted.

Automatable from the accessibility snapshot:

- [ ] Exactly one `<h1>`/top-level heading; heading levels do not skip (h1→h3 with no h2).
- [ ] Every image has a non-empty `alt` (or explicit `alt=""` for decorative).
- [ ] Every form input has an associated label (label/`aria-label`/`aria-labelledby`).
- [ ] Buttons and links have a discernible accessible name (not empty, not "button").
- [ ] No positive `tabindex` values (`tabindex="1"+`), which break focus order.
- [ ] Page has a `<title>` and a `lang` attribute on `<html>`.

Targeted checks (one small `evaluate` each, mobile breakpoint for the first two):

- [ ] No `font-size` below the floor on body text (already covered by `font-too-small`).
- [ ] All interactive targets meet the tap minimum (already covered by `touch-target-small`).
- [ ] Focus is visible: after Tab, the focused element has a visible outline/ring.
- [ ] Color contrast: sample primary text vs background; flag computed contrast < 4.5:1 for
      normal text. Report as `warning`, since automated contrast sampling is approximate.

Record each checklist item as pass/fail with the specific offending selector(s) in evidence.
A route is not "production quality" if it fails structural a11y items, even when it renders.

## Config

```json
{
  "responsive": {
    "touchMin": 44,
    "minFont": 12,
    "failOn": ["high"],
    "warnOn": ["medium"],
    "exemptRoutes": ["/print-view"],
    "exemptFindingTypes": []
  }
}
```

- `failOn` / `warnOn` choose which severities gate the verdict.
- `exemptRoutes` skip the responsive gate (e.g. intentional fixed-width print pages).
- `exemptFindingTypes` suppress a specific finding type app-wide (use sparingly, document why).
