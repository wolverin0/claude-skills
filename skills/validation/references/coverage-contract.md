# Coverage Contract

The point of validation is to test the app the way a human would walk it: **every** route,
**every** modal, **every** button, **every** CRUD operation, and in exhaustive mode every backend
API endpoint — not a sample. This reference defines what "complete coverage" means and how to
prove it.

Sampling is allowed only in `smoke` mode. In `standard` and `exhaustive`/`human` modes, the
skill must enumerate the full surface and account for every item (tested, skipped-with-reason,
or quarantined). An empty issue list on a large app with most elements untested is a failed
run, not a clean one.

There are no implicit route or element caps in standard/exhaustive. An explicit cap is allowed for
diagnosis, but it sets `discovery.truncation` and makes certification incomplete. The inventory is
complete only after code scan and runtime crawl are reconciled and `validation.config.json` records
`inventoryComplete: true`.

## What must be enumerated

During discovery, build a complete inventory from BOTH code scan and runtime crawl, then
reconcile them. Code scan finds things the crawl cannot reach (modals behind permissions,
routes not yet linked); the crawl finds things the code scan misses (dynamic routes).

### Routes — every endpoint
- React: `Route path`, `createBrowserRouter`.
- Next.js: `app/**/page.*`, `pages/**/*`.
- Vue/Nuxt: `createRouter` routes array, `pages/**/*.vue`.
- Plus every internal `href` and programmatic `navigate(...)` target seen in the running app.
- Record dynamic routes (`/user/:id`) once, with a sample concrete instance to test.

### Modals / dialogs — every overlay
Code-scan for them so a modal counts even if no obvious button opens it:
- Glob: `**/*Dialog.*`, `**/*Modal.*`, `**/*Sheet.*`, `**/*Drawer.*`, `**/*Popover.*`.
- Grep: `DialogContent`, `AlertDialog`, `Modal`, `role="dialog"`, `aria-modal`.
- Classify each by name: `Create*`→create, `Edit*`/`Update*`→edit, `View*`/`Details*`→view,
  `Delete*`/`Confirm*`→confirmation.
- Link each to the route/component that imports it and to its trigger button when findable.
- A modal that is enumerated but never reachable in the run is `skip` with reason
  `unreachable-trigger` — it still appears in the report so the gap is visible.

### Interactive elements — every button, link, input, select, toggle
Discovered at runtime per route from the accessibility snapshot (see DISCOVER phase §4).
Every meaningful element gets a row in the inventory with an expected behavior.

### CRUD modules — every data module
Identify each module that has list + create/edit/delete (Customers, Products, Invoices, ...).
For each module, the create→read→update→delete cycle is a first-class flow, not optional.
Use `VAL_`-prefixed data so created records are identifiable and cleaned up.

### API endpoints — every backend method/path (exhaustive)
Enumerate framework routers, server handlers, RPCs, edge functions, and generated API schemas.
Record method, path, access class, owning file, destructive flag, and a safe expected response.
Exercise read-only endpoints and auth/method contracts. Mutation endpoints may use only isolated
`VAL_` data; otherwise record `skip` with `destructive-unapproved`. Browser network calls support
the inventory but do not replace the code scan because unvisited endpoints would disappear.

## The completeness gap report

After discovery, print and save a gap report so coverage is auditable:

```text
=== COVERAGE INVENTORY ===
Routes:   42 found (38 code, 31 crawl, 27 both)  |  reachable: 39  unreachable: 3
Modals:   17 found (code scan)                   |  trigger known: 14  unreachable: 3
Elements: 261 discovered across reachable routes
CRUD modules: 6 (customers, products, invoices, expenses, providers, categories)
API endpoints: 31 (18 read-only, 13 mutation)
```

After testing, print the coverage ledger:

```text
=== COVERAGE LEDGER ===
Routes:   39/39 tested,  0 untested,  3 skipped(unreachable)
Modals:   14/17 exercised, 3 skipped(unreachable-trigger)
Elements: 248/261 exercised, 9 skipped(destructive), 4 skipped(runner)
CRUD:     6/6 modules — C:6 R:6 U:5 D:6  (products UPDATE failed)
API:      31/31 accounted — 22 exercised, 9 skipped(destructive-unapproved)
```

Any item that is neither tested nor explicitly skipped-with-reason is an **incomplete run**.
Do not report completion while the untested count is nonzero without a documented reason.

Every route × breakpoint screenshot also requires a semantic review record written after the image
was opened. DOM measurements and pixel diffs support that review; they do not replace it.
For role/theme variants, inventory each route × breakpoint × role × supported theme cell. The
final gate verifies the screenshot still exists, its SHA-256 matches the reviewed bytes, and source
SHA/build identity matches the externally declared target in config or certification arguments.
Any routes/elements declared in config must also appear in discovery before completion. Five distinct observations cover hierarchy, density,
alignment, proportion, and visible states; human inspection supplies the judgment.

## Coverage by mode

| Mode | Routes | Elements | Modals | CRUD | API endpoints |
| --- | --- | --- | --- | --- | --- |
| `smoke` | critical + changed | key actions only | create/confirm only | none | observed failures only |
| `standard` | all reachable | all non-destructive | all reachable | one create+delete per module | observed failures only |
| `exhaustive` / `human` | all (incl. unreachable noted) | all, incl. forms | all, incl. code-only | full C-R-U-D per module | every declared method/path |

In `exhaustive`/`human` mode the run must assert the ledger: every enumerated, reachable,
non-destructive element was exercised. If the queue empties with reachable items untested,
the run is `incomplete`, not `complete`.

## Destructive safety

Destructive actions (delete, pay, charge, approve, reject, sign out, send) are only executed
when they target `VAL_` data created in this run, or the user approved destructive validation.
Otherwise mark `skip` with reason `destructive-unapproved`. This is a safety boundary, not a
coverage gap — but it is still listed in the ledger so the human can approve a deeper pass.

## Visual matrix and review batching

Standard and exhaustive modes capture every route at each configured viewport (`hd-laptop` 1366x650
is mandatory), in light and dark when the app supports both. A route is not visually covered until
its screenshot is opened and recorded with `record-visual-review.js`.

- Short-desktop and mobile rules (sidebar clipping, above-the-fold CTA, narrow-column waste, nested
  horizontal scroll, WCAG AA contrast) are measured by `scripts/responsive-audit.js`; do not re-judge them by eye.
- Cross-page consistency (Anti-Slop): one `<PageHeader>` structure, one card surface palette, one
  brand accent, and a home or dashboard that does more than repeat the sidebar links.

### Review budget

Light/dark x six viewports is up to twelve images per route, so the orchestrating thread must not
open them itself:

1. Split the screenshot queue into batches: one route family, or at most about 24 images per batch.
   Never split one route's cells across batches.
2. Give each batch to a review subagent with the image paths and the expected route, role, theme and
   viewport of each image. The subagent opens every image in its batch.
3. The subagent returns only JSON lines, one per image, with `route`, `viewport`, `theme`, `role`,
   `image`, `sha256`, `verdict` (`pass|fail|blocked`) and `issues[]`, and nothing else.
4. The orchestrator merges the lines into the ledger, checks that every expected route x role x theme x
   viewport cell has exactly one line, and reopens a single image only to confirm a disputed `fail`.
5. Without subagents, review the batches one after another and keep only the JSON lines between batches.
   A batch that was not reviewed counts as `blocked`, never as `pass`.
