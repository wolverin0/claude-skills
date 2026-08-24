# Stack Recipes

Use this file when implementing the same product interaction in different frameworks.

## Next.js / React / Tailwind / Framer Motion

Best for mobile PWAs, dashboards, SaaS apps, and fast iteration.

Recommended primitives:
- CSS variables for design tokens.
- Tailwind for layout if already in the project.
- Framer Motion / Motion for state-driven motion.
- CSS `position: sticky` for simple sticky card stacks.
- `useScroll` / `useTransform` for scroll-linked motion when using Motion.
- `requestAnimationFrame` scroll listeners only when framework primitives are not available.
- `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

Implementation notes:
- Use `min-h-[100dvh]` or CSS `min-height: 100dvh`.
- Keep scroll container clear; avoid nested scrolling unless required.
- Use semantic buttons and `aria-selected` for tabs.
- Prefer transform-based animation.

## React Native / Expo / Reanimated

Best for native-feeling mobile apps and advanced gestures.

Recommended primitives:
- `react-native-reanimated` for scroll/gesture-linked values.
- `useSharedValue`, `useAnimatedScrollHandler`, `useAnimatedStyle`, `interpolate`, `Extrapolation.CLAMP`.
- `react-native-gesture-handler` for sheets and swipes.
- `react-native-safe-area-context` for safe areas.
- `react-native-pager-view` or horizontal `FlatList` for swipeable tabs.
- FlashList for large lists.

Implementation notes:
- Do not use React state updates for every scroll frame.
- Keep heavy image processing off the JS thread.
- Use native driver/Reanimated worklets for scroll-linked motion.
- Use `accessibilityRole`, `accessibilityLabel`, and `accessibilityState`.

## Flutter

Best when building a native app with slivers and custom scroll behavior.

Recommended primitives:
- `CustomScrollView`.
- `SliverAppBar`.
- `SliverPersistentHeader`.
- `SliverList`.
- `PageView` and `TabController`.
- `AnimatedBuilder` or `ValueListenableBuilder` for controlled motion.
- `SafeArea` for device insets.

Implementation notes:
- Use slivers for collapsing headers and sticky sections.
- Keep expensive painting isolated with `RepaintBoundary`.
- Test scroll physics on real devices.

## Plain HTML / CSS / JavaScript

Best for prototypes, embedded widgets, or no-framework pages.

Recommended primitives:
- CSS custom properties for tokens.
- `position: sticky` for stacks and headers.
- `IntersectionObserver` for reveal triggers.
- Web Animations API for programmatic transitions.
- `requestAnimationFrame` for scroll interpolation.

Implementation notes:
- Avoid heavy scroll event handlers.
- Never use `transition: all`.
- Scope styles to components.
- Add keyboard support for tabs and buttons.
