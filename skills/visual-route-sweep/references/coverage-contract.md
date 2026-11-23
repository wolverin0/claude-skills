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

### Review budget: batch through subagents

Light/dark x desktop/tablet/mobile is six images per route, so the orchestrating
thread must not open them itself:

1. Split the screenshot queue into batches: one route family, or at most about
   24 images, per batch. Never split one route's six cells across batches.
2. Give each batch to a review subagent with the image paths, the expected
   route/role/theme/viewport of each image, and the checklist above. The
   subagent opens every image in its batch.
3. The subagent returns only JSON lines, one per image, and nothing else:

   ```json
   {"route": "/orders", "viewport": "mobile", "theme": "dark", "role": "admin",
    "image": "<path>", "sha256": "<hash>", "verdict": "pass|fail|blocked",
    "issues": [{"severity": "high|medium|low", "kind": "clipped-control|contrast|overflow|empty-state|error-state|overlay|other",
                "detail": "<one sentence>", "where": "<region or selector>"}]}
   ```

4. The orchestrator merges the lines into the ledger, checks that every
   expected route x role x theme x viewport cell has exactly one line, and
   reopens a single image only to confirm a disputed `fail`.
5. Without subagents, review the batches one after another and keep only the
   JSON lines between batches. A batch that was not reviewed counts as
   `blocked`, never as `pass`.
