# Screenshot Reverse Engineering Protocol

Use this file when the user provides screenshots, app references, Dribbble shots, videos, or asks “what is this called?”

## Steps

1. Identify the product category and audience.
2. Split the screen into zones: status/header, nav, primary content, secondary content, fixed controls, gestures.
3. Name each interaction pattern using industry terms.
4. Describe the start state, transition state, and end state.
5. Extract reusable components.
6. Map patterns to implementation primitives for the user's stack.
7. Give a copy-paste prompt for the coding agent.
8. Add a QA checklist for device testing.

## Motion extraction template

For each motion pattern, capture:

- Trigger: scroll, tap, swipe, drag, page load, route change.
- Start state: size, position, opacity, z-index, content visibility.
- During state: interpolation range, easing/spring, sticky/fixed behavior.
- End state: final layout and interaction availability.
- Edge cases: fast scroll, reverse scroll, interrupted tap, reduced motion, small screen.

## Component extraction template

List components like this:

| Component | Responsibility | Important props |
|---|---|---|
| `CollapsingHeader` | Converts large branded header to compact search header | `scrollY`, `title`, `actions`, `searchPlaceholder` |
| `AnimatedSegmentedTabs` | Shows tab modes with sliding pill and pager sync | `tabs`, `activeIndex`, `onChange` |
| `StickyCardStack` | Creates stacked promo/story cards | `cards`, `stickyTop`, `overlap`, `scaleStep` |

## Prompt quality rules

Good prompts include:
- Pattern names.
- Scroll/tap/swipe triggers.
- Start, transition, and end states.
- Component names.
- Stack-specific APIs.
- QA requirements.
- Anti-patterns to avoid.

Bad prompts say:
- “Make it like this app.”
- “Modern and smooth.”
- “Add animations.”
- “Make it premium.”

Translate vague taste into concrete mechanics.
