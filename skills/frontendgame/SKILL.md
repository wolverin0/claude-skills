---
name: frontendgame
description: PRIMARY skill for BUILDING or REDESIGNING app/product UI — the default entry point whenever the user starts a new interface or wants to improve/rework an existing one. Create, critique, reverse-engineer, and implement premium mobile-first product interfaces with advanced UX patterns, design-system discipline, and motion engineering. Use whenever the user asks to build/make/design/redesign/improve a UI, screen, page, dashboard, or component — app UI, mobile dashboards, fintech-style screens, screenshot-to-code, interaction design, scroll animations, sticky card stacks, animated tabs, bottom navigation, React/Next.js frontend, React Native/Expo, Flutter — or wants to avoid generic AI-looking UI. Strongly prefer this skill when screenshots or references are provided. For deep animation-feel work call emil-design-eng, for auditing an existing UI call impeccable, for palettes/fonts/style references call ui-ux-pro-max.
---

# Endgame Mobile Product Design

Use this skill to turn vague UI taste into concrete, buildable product design. The goal is not “pretty screens.” The goal is production-grade mobile interfaces with clear hierarchy, intentional visual language, accessible behavior, and motion that explains state instead of decorating randomly.

## Operating mode

Start by classifying the task:

| User intent | Do this |
|---|---|
| Screenshot/reference analysis | Name the patterns, explain the behavior, map them to components, then provide implementation prompts. Read `references/reverse-engineering.md` and `references/interaction-patterns.md` when needed. |
| Greenfield screen/app | Define product type, audience, visual direction, component architecture, design tokens, then implement. Read `references/design-system.md` and stack-specific guidance. |
| Existing UI redesign | Audit hierarchy, spacing, typography, interaction states, mobile ergonomics, and code structure before changing visuals. |
| Motion/interaction implementation | Decide if motion should exist, select animation primitives, define timing/easing/spring values, and implement with stack-appropriate APIs. Read `references/motion-engineering.md`. |
| “Prompt my AI/Codex/Claude” request | Give exact copy-paste prompts with named patterns, state transitions, stack requirements, QA criteria, and failure modes to avoid. |

Always preserve user constraints: stack, framework, existing codebase, target platform, brand, deadline, and whether the deliverable is analysis, a prompt, or working code.

## First response behavior

For design or screenshot tasks, open with one line:

`Reading this as: [product type] for [audience], with [visual language], using [interaction/motion strategy].`

Then identify the named patterns. Do not describe everything as “modern UI.” Use real names such as collapsing header, morphing search bar, sticky card stack, animated segmented control, swipeable pager, floating action button, bottom navigation, safe-area-aware shell, shared element transition, pull-to-refresh, gesture-driven sheet, skeleton state, and empty state.

## Product design workflow

1. **Infer the product context.** Identify user, job-to-be-done, density level, primary action, and trust requirements.
2. **Choose a visual language.** Commit to a coherent direction: refined fintech, utilitarian internal tool, editorial marketplace, playful consumer app, luxury minimal, industrial dashboard, etc. Intentionality matters more than intensity.
3. **Define the interaction architecture.** Name the navigation model, scroll behavior, tab behavior, cards, sheets, forms, feedback states, and loading states.
4. **Create design tokens before screens.** Define color roles, spacing scale, type scale, radius scale, shadow/elevation, motion durations, easing/spring presets, icon style, and component variants.
5. **Implement reusable components.** Prefer `MobileShell`, `SafeAreaHeader`, `CollapsingHeader`, `MorphingSearchBar`, `AnimatedSegmentedTabs`, `StickyCardStack`, `BalanceCard`, `PromoCard`, `BottomNav`, `FloatingActionButton`, `SkeletonCard`, `EmptyState`, and `ErrorState`.
6. **Add real states.** Include loading, empty, error, success, disabled, active/pressed, focus, overflow, and small-screen behavior.
7. **QA for feel.** Test scroll, tap, keyboard, reduced motion, safe-area padding, touch target size, and layout at common mobile widths.

## Mobile-first rules

- Respect top and bottom safe areas.
- Use touch targets of at least 44px.
- Keep bottom navigation to 3–5 primary items with labels.
- Use `100dvh` on mobile web instead of `100vh` when appropriate.
- Avoid nested scroll containers unless the interaction requires them.
- Keep primary actions thumb-reachable when possible.
- Preserve scroll position after back navigation.
- Do not hide important controls behind the gesture bar or floating action button.
- Do not use horizontal scrolling unless it is an intentional carousel, tab row, or pager.

## Motion rules

Motion earns its place by doing one of these jobs: preserving spatial continuity, showing state change, confirming input, preventing jarring layout changes, explaining hierarchy, or making a gesture feel physically connected.

Avoid animation when the user will trigger the action constantly, when it delays keyboard-driven workflows, or when the only reason is “looks cool.” Prefer transforms and opacity over expensive layout animation. Respect reduced-motion preferences.

Default timing:

| Interaction | Default |
|---|---:|
| Press feedback | 80–160ms |
| Small UI transitions | 150–250ms |
| Header morph / tab indicator | 180–350ms |
| Sheets / drawers | 250–500ms |
| Stagger between list items | 30–60ms |

Default easing:

- Entering UI: strong ease-out.
- Moving/morphing UI: ease-in-out or spring.
- Gesture-driven UI: interruptible spring.
- Constant motion: linear.
- Avoid ease-in for normal UI because it feels delayed.

Read `references/motion-engineering.md` for detailed implementation guidance.

## Stack selection

When the stack is known, use the relevant recipe in `references/stack-recipes.md`.

| Stack | Preferred approach |
|---|---|
| Next.js / React web | Tailwind or CSS variables for tokens, Framer Motion/Motion for state-driven transitions, CSS sticky for stacked cards, safe-area CSS env vars. |
| React Native / Expo | Reanimated for scroll/gesture-driven motion, Gesture Handler, Safe Area Context, PagerView/FlashList as needed. |
| Flutter | CustomScrollView, SliverAppBar, SliverPersistentHeader, PageView, AnimatedBuilder, safe areas. |
| Plain HTML/CSS/JS | CSS custom properties, sticky positioning, WAAPI or requestAnimationFrame for scroll-linked behavior. |

If the user only wants a prompt for a coding agent, still include the stack-specific implementation constraints.

## Anti-slop constraints

Avoid:

- Generic purple gradients on white backgrounds.
- Random glassmorphism everywhere.
- Three equal cards because the model had no idea.
- Desktop layouts squeezed into mobile.
- `transition: all`.
- Unlabeled icon-only controls.
- Placeholder-only form labels.
- Tiny text or tiny tap targets.
- Inconsistent radius, shadow, spacing, or icon styles.
- Fake interactions that visually imply behavior but do not work.
- Placeholder comments like “implement logic here.”

Prefer:

- A clear conceptual direction.
- Reusable tokens and components.
- One memorable interaction per screen, not animation everywhere.
- Strong hierarchy in the first 3 seconds.
- Specific implementation details: offsets, z-index, sticky top, interpolation ranges, spring/timing values, safe-area padding, and reduced-motion behavior.

## Pattern cookbook summary

Use `references/interaction-patterns.md` for full recipes. The most common mobile product patterns are:

- **Collapsing header + morphing search bar:** large branded header compresses while search expands/sticks.
- **Sticky card stack:** promotional cards become sticky, overlap, and pile while scrolling.
- **Animated segmented control:** active pill slides smoothly; content can move with a horizontal pager.
- **Swipeable pager tabs:** tab press and swipe gesture remain synchronized.
- **Bottom navigation + central FAB:** primary nav stays safe-area aware; central action must not block content.
- **Gesture-driven sheet:** bottom sheet responds to drag, velocity, snap points, and backdrop state.

## Output formats

### For screenshot/reference analysis

Use this structure:

1. `Reading this as...`
2. `Patterns I see` — pattern names and what each does.
3. `How to implement it` — stack-specific recipe.
4. `Prompt to paste into your coding AI` — exact prompt.
5. `QA checklist` — what to verify on device.

### For implementation tasks

Use this structure:

1. `Reading this as...`
2. Component plan.
3. Design tokens.
4. Code.
5. Device QA checklist.

### For redesign/audit tasks

Use this structure:

1. Current UI diagnosis.
2. Visual direction decision.
3. Component/system changes.
4. Interaction/motion changes.
5. Implementation plan.
6. QA checklist.

## Quality checklist

Before finalizing any answer or code, verify:

- The design has one coherent product personality.
- Hierarchy is obvious in the first viewport.
- Motion explains state or position.
- Tap targets are comfortable.
- Scroll interactions do not jump.
- Safe-area padding is handled.
- Reduced-motion behavior exists for motion-heavy screens.
- Loading, empty, error, disabled, focus, active, and overflow states are considered.
- Visual tokens are consistent.
- The code is componentized and production-oriented.
- The result would not look like a default AI dashboard template.
