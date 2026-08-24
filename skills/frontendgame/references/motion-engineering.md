# Motion Engineering Reference

Use this file for animation, gesture, and scroll-linked implementation decisions.

## Motion decision framework

Before writing animation code, answer:

1. Should this animate at all?
2. What does the animation explain?
3. How often will the user see it?
4. Is it interruptible?
5. Can it be done with transform/opacity?
6. What is the reduced-motion alternative?

Good reasons to animate:
- Preserve spatial continuity.
- Explain state change.
- Confirm touch/click input.
- Prevent abrupt layout changes.
- Connect a gesture to an object.
- Highlight a rare, meaningful moment.

Bad reasons:
- The screen feels empty.
- Modern apps animate.
- It looks cool but repeats constantly.
- The animation hides slow code.

## Timing presets

Use tokens instead of random durations:

```css
:root {
  --motion-press: 120ms;
  --motion-fast: 180ms;
  --motion-standard: 240ms;
  --motion-slow: 360ms;
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
```

Guidelines:
- Press feedback: 80–160ms.
- Dropdowns/popovers: 150–250ms.
- Header morphs and tab indicators: 180–350ms.
- Drawers/sheets: 250–500ms.
- Keep repeated UI transitions under 300ms.

## Properties to animate

Prefer:
- `transform`
- `opacity`
- CSS variables that feed transforms
- compositor-friendly filters only when necessary

Avoid unless justified:
- `width`, `height`, `top`, `left`, `margin`, `padding`
- heavy shadows during scroll
- animating large blurred backgrounds on low-end devices
- `transition: all`

## Scroll-linked motion

For scroll-linked UI, use a progress value:

```ts
const progress = clamp(scrollY / 140, 0, 1)
```

Then derive all animated values from that progress. This keeps coordinated elements synchronized.

Examples:
- Header height: 180 → 88.
- Search width: 48 → container width - 32.
- Search translateY: 36 → 0.
- Greeting opacity: 1 → 0.
- Card shadow: medium → low.

## Reduced motion

When reduced motion is enabled:
- Skip decorative transitions.
- Keep instant state changes readable.
- Preserve essential visibility changes.
- Do not remove important feedback entirely; replace movement with opacity or state styling.

Web:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

React Native:
- Check accessibility reduce motion setting when possible.
- Shorten or disable non-essential Reanimated transitions.

## Debugging animation feel

Test at normal speed and 3x slower. Look for:
- Elements starting from the wrong transform origin.
- Opacity and transform out of sync.
- Layout jumps during sticky transitions.
- Header overlays intercepting touches.
- Jank during fast scroll.
- Broken state when animation is interrupted mid-flight.
