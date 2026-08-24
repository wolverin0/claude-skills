# Interaction Patterns Reference

Use this file when the task involves naming or implementing mobile interaction patterns from screenshots, fintech apps, dashboards, or mobile PWAs.

## Collapsing Header + Morphing Search Bar

Also called: animated sticky header, scroll-linked header, large-title collapse, morphing search field.

Use when a screen starts with brand/navigation content but needs a compact search/header after scrolling.

Behavior:
- Initial state: tall branded header, often with greeting, account actions, search shortcut, notifications, and a large content card overlapping the header.
- Scroll progress 0→1: header height collapses, non-essential controls fade or translate away, search control expands into a full-width rounded input.
- Final state: compact sticky/fixed header with search accessible.
- The content below should not jump; reserve space or use transforms intentionally.

Implementation recipe:
- Use one scroll container.
- Track scrollY and clamp progress across a short range, usually 0–120px or 0–160px.
- Interpolate height, opacity, translateY, scale, border-radius, and search width.
- Use transforms and opacity where possible.
- Keep compact header above content with z-index.
- Respect safe-area top padding.

Prompt fragment:

```text
Implement a scroll-linked collapsing header with a morphing search bar. Initial header is tall and branded; as scrollY moves from 0 to 140, interpolate header height, search width/position, greeting opacity, and icon opacity. Final state is a compact sticky search bar. Avoid layout jumps, use transforms/opacity, respect safe-area top padding, and include reduced-motion behavior.
```

## Sticky Card Stack

Also called: scroll-stacked cards, card pile, overlapping sticky cards, sticky deck.

Use for promotional cards, onboarding stories, feature cards, offer cards, or narrative mobile sections.

Behavior:
- Cards are large rounded rectangles with imagery and text overlay.
- Each card becomes sticky near the top.
- Later cards scroll over earlier cards.
- Earlier cards remain partially visible, creating a pile.
- Optional: previous cards scale down slightly or dim very subtly.

Web implementation:
- Use `position: sticky` on each card.
- Use `top: calc(var(--header-height) + index * var(--stack-gap))`.
- Use increasing z-index for later cards.
- Use negative margin or reduced section spacing to create overlap.
- Put cards in a parent tall enough for the sticky sequence.

React Native implementation:
- Use Reanimated scrollY interpolation.
- Compute each card's translateY and scale from its index and scroll position.
- Use absolute positioning only inside a measured stack container.
- Avoid excessive shadows on Android.

Prompt fragment:

```text
Build a StickyCardStack where each promo card sticks near the top as the next card scrolls over it. Keep a 20–32px strip of the previous card visible. Use increasing z-index, sticky top offsets, consistent 28px border radius, overflow hidden, and optional scale down to 0.97 for cards behind. Scrolling must continue normally after the stack ends.
```

## Animated Segmented Control

Also called: sliding tab indicator, pill tabs, animated tabs, swipeable segmented control.

Use for small sets of mutually exclusive modes such as Pesos / Dólares / Reservas.

Behavior:
- Active tab has a rounded pill/indicator background.
- On tap, indicator slides smoothly under the selected tab.
- Content can slide horizontally like a pager.
- Swipes and taps stay synchronized.

Implementation recipe:
- Use equal-width tabs when possible; otherwise measure each tab and animate indicator width and x-position.
- Animate transform rather than layout when possible.
- Use spring for a tactile pill indicator.
- Use a horizontal pager when content changes are spatial.
- Keep accessible labels and selected state.

Prompt fragment:

```text
Create an animated segmented control with three tabs. The active pill should slide, not instantly jump. Animate translateX and width. Sync tab press with a horizontal pager/swipe gesture. Use spring or 220ms ease-out motion. Include aria-selected / accessibilityState selected and keyboard/focus support on web.
```

## Bottom Navigation + Floating Action Button

Use for mobile apps with 3–5 top-level destinations and one central action.

Rules:
- Keep labels visible.
- Use safe-area bottom padding.
- Central FAB must not hide critical content.
- Active state must be obvious through icon, label, and indicator.
- Avoid more than one primary floating action.

## Gesture-Driven Bottom Sheet

Use for details, filters, quick actions, or contextual editing.

Rules:
- Define snap points.
- Make drag interruptible.
- Use velocity threshold for open/close decisions.
- Add a backdrop that responds to progress.
- Include keyboard behavior for forms.
- Add reduced-motion fallback.

## Shared Element Transition

Use when an item opens into a detail screen and spatial continuity matters.

Rules:
- Match source and destination geometry.
- Keep duration short.
- Do not use if it delays frequent navigation.
- Provide fallback when shared element tooling is unavailable.
