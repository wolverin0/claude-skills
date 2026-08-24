# Design System Reference

Use this file when creating or refactoring the visual foundation of a mobile product UI.

## Token map

Define tokens before styling components:

```css
:root {
  --color-brand: #ffe600;
  --color-ink: #20212b;
  --color-muted: #6d7080;
  --color-surface: #ffffff;
  --color-surface-soft: #f4f6fb;
  --color-border: rgba(32, 33, 43, 0.12);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;

  --shadow-card: 0 18px 40px rgba(18, 20, 31, 0.12);
  --shadow-soft: 0 10px 24px rgba(18, 20, 31, 0.08);
}
```

Adapt tokens to the brand; do not copy these blindly.

## Typography

For mobile product UI:
- Use 2–3 text sizes for most screens.
- Use tabular numbers for balances, metrics, and prices.
- Keep numeric content aligned and legible.
- Use strong weight only where hierarchy needs it.
- Avoid tiny secondary text below 12px.

## Component states

Every interactive component needs:
- Default.
- Pressed/active.
- Focused.
- Disabled.
- Loading.
- Error where relevant.
- Success/confirmed where relevant.

## Screen states

Every screen needs:
- Loading skeleton.
- Empty state with next action.
- Error state with retry.
- Long-content behavior.
- Offline/connection state when relevant.

## Visual direction decision

Pick one direction and commit:

- **Refined fintech:** bright brand header, rounded cards, clear numbers, tactile buttons, conservative motion.
- **Internal operator tool:** dense but calm, fast controls, restrained motion, strong error states.
- **Consumer marketplace:** image-led cards, larger typography, playful motion, stronger promos.
- **Luxury minimal:** fewer elements, high whitespace, subtle shadows, premium typography.
- **Industrial dashboard:** sharp hierarchy, data density, technical color roles, minimal decoration.

Avoid mixing multiple directions without a reason.
