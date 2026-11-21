# Visual Route Sweep Coverage Contract

## Required Matrix (5 Real-World Viewports)

- **HD Laptop / 14" Plant Monitor (MANDATORY):** `1366x650` (1366x768 minus OS taskbar + browser chrome — catches clipped sidebars, below-the-fold CTAs, and oversized cards that look fine on 1440x900/2K monitors)
- **Desktop:** `1440x900`
- **Full HD:** `1920x1080`
- **Tablet:** `768x1024` (or `820x1180`)
- **Mobile:** `375x812` (narrow phone floor — catches tap-target, wrapping, and nested horizontal scroll failures)
- **Themes:** light and dark when supported
- **Evidence:** viewport screenshot plus full-page screenshot per matrix cell

## Route Accounting & Stateful / Modal Surfaces

Every discovered GET route must be one of: `tested`, `nonvisual`, `destructive`, `superseded`,
`unresolved-dynamic`, or `quarantined`. Dynamic routes need a real safe representative discovered from
the running application; never invent IDs. A coverage cap makes the run incomplete.

Routes gated by runtime workflow preconditions (for example, an operator production screen that
redirects to shift-start unless a shift is active) and high-risk interactive modals (approvals,
deviations, deletions, settings) MUST also be captured explicitly (using safe test state or non-mutating
preview/route stubs) so the real working surface is visually verified rather than only the redirect.

## Mobile, Tablet & Short-Desktop Rules

- `documentElement.scrollWidth` must not exceed the viewport at any breakpoint.
- On mobile, visible nested containers also must not require horizontal scrolling. Reflow tables into
  labeled rows/cards, prioritize columns, or stack controls. Only a reviewed intentional carousel may
  opt in with `data-validation-horizontal-scroll="allow"`; tables, forms, dialogs, and navigation
  cannot opt out.
- On `1366x650` and `1920x1080`:
  - Sidebars must not clip navigation items vertically (`sidebar-clipped`).
  - Compact forms (login, shift-start, single-task operator cockpits) must keep their primary input and
    submit CTA above the fold (`above-the-fold-cta`) and must not force vertical scrolling inside a
    narrow `< 48%`-width column that wastes >50% of desktop space (`narrow-column-waste`).
- Computed text-vs-background contrast must pass WCAG AA (`wcag-contrast-fail`: >= 4.5:1 normal text,
  >= 3.0:1 large/bold text) across buttons, badges, status pills, alerts, and inputs.

## Runtime Rule

Fail on application-owned console errors, page errors, unexpected failed requests, HTTP `4xx/5xx`,
blank/error/login captures, screenshot failures, or exact-build identity mismatch. Isolate and report
third-party telemetry noise rather than hiding it.

## Semantic Review & Cross-Page Anti-Slop Consistency

- **100% Inspection Rule (`<= 30` routes):** When an app has 30 or fewer routes, EVERY SINGLE route
  screenshot at `1366x650`, `768x1024`, and `375x812` MUST be directly inspected visually (opening the
  image files — never sampling or assuming green from scripts alone).
- Review **within each page:** text contrast, broken dark/light pills, hierarchy, clipped controls,
  empty/error/loading states, fixed overlays, tables/cards, pagination, and destructive actions.
- Review **across all pages (Cross-Page & Anti-Slop Consistency):**
  - Consistent header structure (`<PageHeader>` icon, title, subtitle, actions alignment).
  - Consistent card/surface palette and single disciplined brand accent (flag generic "AI slop" dark
    blue + rainbow icon grids or mismatched dark/light cards across sibling routes).
  - Real operational utility on Home/Dashboard views (flag dashboards that merely duplicate sidebar links).
