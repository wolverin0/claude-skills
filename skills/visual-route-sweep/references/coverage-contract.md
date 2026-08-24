# Visual Route Sweep Coverage Contract

## Required Matrix

- Desktop: `1440x900`
- Tablet: `820x1180`
- Mobile: `390x844` (add `375x812` when the product targets narrow phones)
- Themes: light and dark when supported
- Evidence: viewport screenshot plus full-page screenshot per matrix cell

## Route Accounting

Every discovered GET route must be one of: tested, nonvisual, destructive, superseded,
unresolved-dynamic, or quarantined. Dynamic routes need a real safe representative discovered from
the running application; never invent IDs. A coverage cap makes the run incomplete.

## Mobile Rule

`documentElement.scrollWidth` must not exceed the viewport. Visible nested containers also must not
require horizontal scrolling. Reflow tables into labeled rows/cards, prioritize columns, or stack
controls. Only a reviewed intentional carousel may opt in with
`data-validation-horizontal-scroll="allow"`; tables, forms, dialogs, and navigation cannot opt out.

## Runtime Rule

Fail on application-owned console errors, page errors, unexpected failed requests, HTTP `4xx/5xx`,
blank/error/login captures, screenshot failures, or exact-build identity mismatch. Isolate and report
third-party telemetry noise rather than hiding it.

## Semantic Review

Inspect every screenshot or every screenshot in a documented repeated-layout family. Review text
contrast, hierarchy, clipped controls, empty/error/loading states, fixed overlays, tables/cards,
pagination, destructive actions, and whether the page remains understandable without sideways scroll.
