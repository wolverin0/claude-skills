# Component, state & edge-case checks for UX audits

Concrete, falsifiable checks to run during Journey Recording (Stage 2), Everyday-Operation Pass (Stage 3), Container/Control Review (Stage 5) and Feedback/Error Audit (Stage 6). Load this file when inspecting forms, tables, bulk selection, mobile viewports, loading states, breadcrumbs, shortcuts or operational KPIs.

> **Precedence rule:** Operational rules in [audit-method.md](audit-method.md), [interaction-criteria.md](interaction-criteria.md) and [notifications-and-feedback.md](notifications-and-feedback.md) **always win**. Never hide a high-frequency daily row action under `...` or force `"one primary button per page"` across independent work contexts just to tidy a screen.

---

## 1. Forms, controls & mutation safety

### Validation timing & layout stability
- **Scold on blur, forgive live:** validate a field `onBlur` (never on the first keystroke); once a field is in error, switch that field to live `onChange` so the red state clears immediately as the user fixes it.
- **Zero submit jump (`CLS`):** reserve message height below inputs (or anchor an Error Summary at the top) so validation messages never push the Submit button down.
- **Visible labels & dark autofill:** keep `<label>` visible outside the input (never placeholder-only), style `:autofill` for dark themes and verify focus ring contrast (`>=3:1`) plus icon+text error signaling (never color alone).

### Submit button & double-submit protection
- **No silent disabled submit:** check and record the product's explicit rule—either keep Submit active, validate on click and focus the first invalid field, OR if disabled by policy, display the exact reason right beneath it. Never leave a muted/disabled button with zero explanation.
- **Idempotent async submit:** preserve the exact button width during loading (`0px` shift), guard the handler with an `inFlight` lock and `Idempotency-Key`, and re-enable only after a real response resolves.

### Specialized inputs & autosave
- **Numeric codes & OTP:** use `inputmode="numeric" pattern="[0-9]*"` (never `type="number"`, which strips leading zeros or scrolls); model OTP as one string across slots with `autocomplete="one-time-code"` and a resend cooldown (`~30s`).
- **Passwords & cards:** always allow `paste` (and password managers), show requirements/strength live while typing; format cards `4-4-4-4` preserving caret position and detect brand from digit 1 while validating `onBlur`.
- **Autosave & offline integrity:** debounce writes (`~800ms`), expose an honest state indicator (`Typing / Saving / Saved / Offline / Error`), queue offline edits FIFO, guard against silent multi-tab overwrite and warn before closing with unsaved edits. Never display `"Saved"` while edits sit unconfirmed locally.
- **Inline editing:** keep exact typography, font size and padding between display and edit states (`CLS 0.000`), support `Enter` (commit) / `Escape` (cancel), and require explicit `Edit` confirmation (not 1-click inline) when typos carry financial, stock or billing risk.

### Selection controls
- **Pick by consequence & cardinality:**
  - `Switch` for instant state changes without a Save button; `Checkbox` when changes wait for `Save` (use JS `el.indeterminate = true` for partial parent selection).
  - `Radio` for `<=5` mutually exclusive options (`Dropdown` above `5`; add inline search `>10` and virtualization `>100`); `Segmented control` for `2–4` compact visible options.
- **Full-row target:** wrap `<label>` around the full row (`min-height: 44px`), never leaving only a `16px` checkbox/radio box clickable.

---

## 2. Loading thresholds, Optimistic UI & destructive friction

### Latency ladder
- `<300ms`: render **no** loader (prevent skeleton/spinner flicker).
- `>300ms` with known layout: render a **content-aware skeleton** matching the final avatar/rows/blocks with `0` layout jump on hydration.
- `<3s` with unknown duration: local spinner inside the container/control (never freeze the whole page).
- `>3s` measurable work (imports, uploads, reports): real progress bar (`%` + ETA/speed where available).

### Optimistic UI vs Truthful State
- Allow immediate optimistic updates (`<400ms` perceived response + clear rollback on failure) **only** on cheap, reversible actions (likes, bookmarks, status toggles, renames).
- **Forbid Optimistic UI** on payments, stock adjustments, invoices, permissions or irreversible commits: show processing state and update only after real server confirmation (`200 OK`), creating recoverable pending work if async fails.

### Friction proportional to cost
- **Reversible actions:** execute directly with soft-delete (trash retention) + `Undo` toast (`5–10s`) instead of repetitive `"Are you sure?"` modals.
- **Irreversible/destructive actions:** isolate at the bottom (`Danger Zone`), keep a strict red budget (`1` destructive emphasis per view), name the exact verb/object (`"Delete draft"`, never `"Yes"`), and require type-to-confirm or hold only when truly irreversible.

---

## 3. Tables, bulk selection, real-data stress & touch (`375px`)

### Data tables & narrow viewports
- **Alignment & empty cells:** right-align numbers with `tabular-nums` (pin currency symbols left so decimals line up), left-align text, show `—` instead of blank empty cells, and pick deliberate row density (`40 / 48 / 56px`; reserve zebra stripes for wide `>=12`-col tables).
- **Context on scroll:** keep header and identity column `position: sticky` on wide horizontal tables.
- **Mobile/narrow collapse (`<640px` / `@container <700px`):** restack multi-column rows into 2-line cards prioritizing identity, key metric and status (with expand/sheet for secondary details) instead of horizontal page overflow.

### Bulk selection
- **Tri-state header:** header checkbox supports `empty / partial / checked` (clicking `partial` selects all).
- **Scope clarity & persistence:** name the true matching count (`"Select all 247 matching"`), support `Shift+click` ranges, keep `selectedIds` in state across page changes, and echo the count on bulk buttons (`"Delete 247"`).

### Real-data stress fixtures
Test every row, card, badge and cell against 3 edge fixtures: **`empty`**, **`1 char`**, and **`40 chars + emoji`**:
- Put `min-width: 0` on flex children that must truncate (`text-overflow: ellipsis`).
- Middle-truncate filenames, emails and paths so extensions/domains remain visible (`...pdf`).
- Apply `overflow-wrap: anywhere` on unbroken URLs, hashes and IDs.

### Touch, hover & resizable panes
- **Separate hover from touch:** gate hover-only effects inside `@media (hover: hover)` and **never hide primary actions behind hover**.
- **Hit targets:** require `>=44×44pt` (iOS) / `>=48×48dp` (Android) / web floor `24×24 CSS px` (aim `44px`) using button padding (`20px` icon + `12px` padding) rather than oversized icons; keep `~8px` gap between small neighbors with zero overlap.
- **Mobile inputs & fixed bars:** use `font-size >= 16px` on mobile inputs (prevents iOS auto-zoom), respect bottom `safe-area` + scroll padding so fixed action bars never cover the last row.
- **Resizable split panes:** use a `1px` visual divider with a `>=12px` grab area, clamp between `min` and `max`, snap cleanly to closed (never leave unusable `44px` slivers), cover iframes with a drag overlay and lock `body { cursor: col-resize }`.

---

## 4. Navigation continuity, shortcuts, copy & operational KPIs

- **Breadcrumbs:** link every level except the current page (which matches the page title); fold middle levels into a menu past `4` levels while keeping both ends (`Home / ... / Invoices / INV-2041`); provide a `>=44px` parent back link on mobile.
- **Shortcuts & `Cmd+K`:** display shortcuts right-aligned in menu rows (matching tooltips) and suppress single-key shortcuts while typing; in `Cmd+K`, populate empty state with recent commands, use an inline spinner (never freeze the screen) and let `Escape` step back one submenu level.
- **Trees & Search:** indent trees `16px`/level with vertical guide lines, implement `role="tree"` arrow keys and load lazy children with local skeleton rows (never lock the whole tree); in search zero-results, always provide recovery queries/filters instead of a dead end.
- **Scroll & Copy:** preserve/restore `scrollY` on back navigation and add `scroll-margin-top` under sticky headers; on copy buttons, flip immediately to a check (`~2s` reset), copy raw unformatted values, announce `"Copied"` via `aria-live="polite"` and keep a fallback for non-secure origins.
- **Operational charts & KPI rows:** start bar axes at `0`, cap pie charts and line series at `<=5` (`>5` → sortable table), cap KPI rows at `<=4` cards (`1` number per card), **apply red/alert color only to the outlier** that needs attention, name the comparison period on every delta (`7d`), keep units on values and show progress against target where a goal exists.
