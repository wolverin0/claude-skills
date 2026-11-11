# Feel-20: UX "feel" details checklist

Source: a 20-item UX "feel" list. The original prompt was: "check this app for these 20 details,
add any missing, say what changed". Keep the 20 items as written; the right-hand columns say where
each one is detected and who knows how to add it.

Design skills referenced (read them, do not copy their text here):
`impeccable` (commands `animate`, `harden`, `typeset`, `adapt`, `optimize`), `emil-design-eng`
(motion and press-feel decisions), `frontendgame` (`references/interaction-patterns.md`).

| # | Detail | Detected by | How to add |
|---|--------|-------------|------------|
| 1 | Skeleton loaders instead of spinners | Q1-Q3 state inventory (`skeleton` vs `spinner`) | `impeccable harden` (loading states) |
| 2 | Optimistic updates (UI changes before the server answers) | Q8 `optimistic` row | `impeccable harden`; keep the rollback path (playbook B10) |
| 3 | Command menu (cmd+K) | Q8 `cmdk` row | `frontendgame` interaction-patterns |
| 4 | Keyboard shortcut hints | Q8 `cmdk` row (`<kbd`) | `frontendgame` interaction-patterns |
| 5 | Undo toasts instead of "are you sure" pop-ups | Q8 `undo` rows | `impeccable harden` + `emil-design-eng` (toast motion) |
| 6 | Stale-while-revalidate (cached data, background refresh) | audit-domain-05 Q7 `dedupe` row (`staleTime`, `useSWR`) | `impeccable optimize` |
| 7 | Pre-rendering for the pages people open most | audit-domain-05 Q2 cache inventory (`revalidate`, SSG) | framework docs (Next `generateStaticParams`/ISR); `impeccable optimize` |
| 8 | Blurred image placeholders while images load | Q8 `blur` row | `impeccable optimize` |
| 9 | View transitions between pages | Q8 `view-transition` row | `impeccable animate`; `emil-design-eng` |
| 10 | Swipe-to-dismiss sheets on mobile | manual: `rg -n "vaul|Drawer|BottomSheet|onPanEnd|drag=\"y\""` | `impeccable adapt`; `frontendgame` interaction-patterns |
| 11 | Animations you can interrupt mid-way | manual: transitions driven by keyframes vs CSS transitions/springs; `rg -n "@keyframes|animation:"` on state changes | `emil-design-eng` |
| 12 | Predictive back gestures | manual, native/PWA only: `rg -n "OnBackPressedCallback|enableOnBackInvokedCallback|popstate"` | `impeccable adapt` (android reference) |
| 13 | Tap targets bigger than the icon | Q8 `tap-target` row | `impeccable adapt`, `harden` |
| 14 | Safe-area insets for notches and home bars | Q8 `safe-area` row | `impeccable adapt` |
| 15 | One-time code autofill | Q8 `otp` row | `impeccable harden` (forms) |
| 16 | Tabular numbers (prices, counters do not jiggle) | Q8 `tabular-nums` row | `impeccable typeset` |
| 17 | Balanced headlines, no single word on the last line | Q8 `text-wrap` row | `impeccable typeset` |
| 18 | Smooth continuous corners | Q8 `squircle` row | `impeccable polish`; progressive enhancement only |
| 19 | Idempotency keys so a double tap never charges twice | audit-domain-05/payments review: `rg -n "Idempotency-Key|idempotency_key"` on every POST that charges or sends | backend change, not a design skill |
| 20 | Safe triangle so submenus do not close when the mouse cuts across | Q8 `safe-triangle` row | `frontendgame` interaction-patterns; Radix/Floating UI `safePolygon` |

Items 1, 6, 7, 10, 11, 12 and 19 are detected outside the Q8 block (column 3); the audit report
lists them under their own domain instead of repeating the finding here.
