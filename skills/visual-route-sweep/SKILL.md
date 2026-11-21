---
name: visual-route-sweep
description: "Inventory every safe visual route, capture authenticated light/dark desktop/tablet/mobile screenshots, detect responsive and browser-runtime failures, semantically review every image, and optionally remediate and rerun. Use when the user asks to screenshot or visually audit all endpoints without running the complete battle-test security, CRUD, and architecture cycle."
---

# Visual Route Sweep

Run a fail-closed visual matrix without claiming the application is fully battle-tested.

## Invocation

```text
$visual-route-sweep <url>
$visual-route-sweep <url> --fix
$visual-route-sweep --resume
```

`--fix` authorizes owned UI/runtime remediation and exact-build reruns. It does not authorize
deployment unless the user separately requested deployment. Use credentials only through environment
variables or an existing saved browser state.

## Contract

1. Record repository SHA, running image/revision, URL, auth method, roles, themes, and viewports.
2. Inventory runtime routes plus reachable same-origin links. Classify every route as tested,
   nonvisual, destructive, superseded, unresolved-dynamic, or quarantined with a reason.
3. Authenticate before protected routes. A login page, error page, blank page, or fixture is not proof.
4. Capture viewport and full-page screenshots for every safe resolved route (plus stateful/modal
   working views that redirect when preconditions aren't met) at **5 viewports**: `1366x650` (14" HD
   laptop / plant monitor), `1440x900` (desktop), `1920x1080` (FHD), `768x1024` (tablet), and
   `375x812` (mobile), in light and dark themes when supported.
5. Record HTTP status, final URL, console errors, page errors, failed requests, bad responses,
   screenshot failures, document width/height, and responsive findings for every matrix cell.
6. Use `../validation/scripts/responsive-audit.js` (which checks horizontal overflow, mobile nested
   scroll, clipped sidebars, narrow-column width waste, below-the-fold compact form CTAs, and WCAG AA
   computed contrast). On mobile, nested horizontal scrolling is a high finding unless a semantically
   reviewed carousel explicitly has `data-validation-horizontal-scroll="allow"`. Tables and forms may
   not opt out.
7. Actually inspect **100% of required screenshots** for apps with `<= 30` routes (`1366x650`,
   `768x1024`, and `375x812` — never sample or equate capture with review). Record both per-route and
   **cross-page consistency / Anti-Slop** findings (uniform headers, card surfaces, single brand accent,
   useful non-redundant dashboard).
8. With `--fix`, work in an isolated worktree, remediate findings, test, deploy only when authorized,
   and rerun against the exact candidate build until green or honestly blocked.
9. Write an append-only route ledger and JSON/HTML report with exact evidence paths and unresolved
   dynamic routes. Never fabricate representative records.

Read [the coverage contract](references/coverage-contract.md) before discovery.

## Verdict

The strongest verdict is `VISUAL ROUTE SWEEP GREEN`. It requires zero application-owned browser
errors, zero unaccounted safe routes, zero high responsive findings, and completed screenshot review
on the exact candidate build. It never means security, CRUD, data integrity, or full battle-test green.
