---
name: designmotion-ui
description: Apply the exact UI/UX, layout, typography, color, motion, micro-interaction, form, navigation, accessibility, data-viz, onboarding, pricing, and anti-dark-pattern rules distilled exclusively from @designmotionhq (89 canonical rules across 147 UI/UX posts). Use when designing, implementing, reviewing, or de-AI-ifying web/mobile UI components and screens strictly according to @designmotionhq guidance.
---

# DesignMotion UI Systems (`designmotion-ui`)

Distills **exclusively** the 89 canonical UI/UX rules (147 UI/UX posts; 4 out-of-scope CS algorithm posts excluded) from `@designmotionhq`, with exact CSS values, timing thresholds, state machines, optical geometry formulas, and documented contradictions preserved as explicit choices.

## Workflow

1. **Resolve the 4 open tensions before writing code:** `@designmotionhq` intentionally contains competing schools across reels/carousels. Pick one side explicitly per project instead of blending both (full list of 11 corpus tensions in [references/tensions-and-visual-index.md](references/tensions-and-visual-index.md)):
   - **Density:** Airy cards (`28–40px` padding, `16–22px` gap, `1.6` leading) vs. Linear-precision (`13px` text, `32px` rows, `0` shadows, `4px` grid).
   - **Submit disabled state:** Live button focusing first error on click vs. disabled button explaining why right beneath it vs. disabled until valid (`:has(:invalid)`).
   - **Dark-mode elevation:** Lighter stepped surfaces + `1px` white alpha hairline (`box-shadow: none`) vs. colored multi-layer brand glow + 3D perspective.
   - **Motion feel:** Spring/overshoot (`0.95 -> 1.05`, `250ms` in / `150ms` out) vs. dry snappy Linear motion (`80ms` hover, `<=150ms` max, `0` overshoot).

2. **Pre-code intent & `DESIGN.md` (*Rule Zero*):**
   - Before writing JSX/HTML, extract existing tokens first (*Rule Zero*: map values to nearest existing tokens rather than inventing new hex/spacing values) and lock 4 axes: **Type, Color, Space, Finish** (borders OR shadows OR flat—never all three).
   - Anchor `DESIGN.md` to the product's real physical world (domain display font, single accent reserved for the critical action/status, domain-specific components, consistent in light and dark).
   - Define user intent, primary action (`1` main CTA), minimal columns (`3–5`, not `9–12` raw DB columns), and all **6 states** upfront: `Loading`, `Empty`, `Error`, `Success`, `Offline`, `Partial`.

3. **Load only the reference file(s) needed for the current task:**

| Task / UI Surface | Load reference | Canonical rules covered |
| --- | --- | --- |
| Layout, spacing, grids, radii, optical math, icons, modern CSS, text hardening, `375px` mobile, tables, chat/calendar/avatars/fintech, typography, color/OKLCH/dark mode/shadows, motion/View Transitions | [references/layout-type-color-motion.md](references/layout-type-color-motion.md) | 32 rules (`L1–L20`, `T1–T2`, `C1–C6`, `M1–M4`) |
| Loading/skeletons/Optimistic UI, toasts/undo/delete, gestures/Kanban/DnD/voice, inputs/validation/buttons/autosave/OTP/passwords/cards/pickers/inline-edit, nav/tabs/chips/Cmd+K/shortcuts/breadcrumbs/sheets/trees/settings | [references/components-forms-nav.md](references/components-forms-nav.md) | 42 rules (`MI1–MI15`, `F1–F15`, `N1–N12`) |
| WCAG contrast, touch targets (`44px`/`24px`), keyboard focus, charts & KPI rows, empty states/onboarding/permissions, pricing/checkout/billing/landings, anti-dark-patterns & UX psychology, pre-code spec workflow | [references/a11y-data-onboarding-conversion-ethics.md](references/a11y-data-onboarding-conversion-ethics.md) | 15 rules (`A1–A3`, `V1–V2`, `O1–O3`, `P1–P4`, `E1–E2`, `W1`) |
| All 11 documented contradictions & before/after visual pair index (`referencias/`) | [references/tensions-and-visual-index.md](references/tensions-and-visual-index.md) | Conflict matrix + 89 visual pairs |

4. **Verify against real-data stress fixtures before finishing:** Always check `empty`, `1 char`, and `40 chars + emoji` across `375px` mobile and desktop, verify all 6 component states, and confirm `@media (hover: hover)` vs `@media (pointer: coarse)`.
