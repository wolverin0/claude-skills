# Accessibility, Data Viz, Onboarding, Conversion, Ethics & Workflow (`@designmotionhq`)

Covers **15 canonical rules**: Accessibility (`3`), Data Viz (`2`), Onboarding & Empty States (`3`), Conversion & Pricing (`4`), Ethics & UX Psychology (`2`), Pre-code Workflow (`1`).

---

## 1. Accessibility (`A1–A3`)

1. **`contraste-wcag` (Measured WCAG contrast):** Never trust the eye test (light gray `~2:1` vanishes in sunlight). Enforce `>=4.5:1` for body text and **placeholders**, `>=3:1` for large text (`24px` or `19px` bold), icons, and input borders. Use solid theme grays rather than transparent black (`rgba`), and place a dark scrim behind text on photography measured at the **brightest spot** (`4.3:1 -> 6.6:1`). *(Conflict noted: `DfuDHh3h14c` exempts disabled buttons/logos; `DbvCsRetjhR` demands `4.5:1` on disabled too.)*
2. **`targets-fitts-touch` (Fitts's Law & touch ergonomics):** Size hit targets to `>=44×44pt` (iOS HIG) / `>=48×48dp` (Material); on web meet WCAG 2.2 AA (`2.5.8`) floor `24×24 CSS px` and aim for `44px` (`2.5.5`). Grow the hit box with button padding (`20px` icon + `12px + 12px = 44px`), never overlap hit areas, keep `~8px` gap between small neighbors, gate hover styles inside `@media (hover: hover)`, expand touch controls via `@media (pointer: coarse)`, and **never** hide primary actions behind hover (`12% -> 34%` tap rate; `9.6s -> 3.5s`).
3. **`foco-teclado-skip` (Keyboard focus & skip links):** Style `:focus-visible` with a `2px` high-contrast ring + offset (visible on Tab, silent on mouse click), keep DOM order equal to visual order, trap focus inside open modals returning it to the trigger on close, and provide a `Skip to main content` link at the top of long headers (`40` links skipped).

---

## 2. Data Visualization (`V1–V2`)

1. **`graficos-honestos` (Honest charts & data-ink):** Always start bar chart axes at `0` (line charts may omit `0` if clearly labeled), cap pie charts and line series at `<=5` (`>5` -> sortable table), highlight `1` key series with accent and mute the rest gray, label lines directly at the end (no separate legend box), annotate key peaks, strip chartjunk (`28%` initial data-ink), and tune aspect ratio near `45°` slopes.
2. **`kpi-rows` (KPI rows):** Cap at `<=4` cards per row (`1` number per card), color **only** the outlier metric that needs attention (`1` red at a time, never color every delta), state the comparison period on every delta (`7d`), keep units on values rather than labels, and show progress against goal (`48 / 60 k`, `80%`) next to the metric.

---

## 3. Onboarding, Empty States & Permissions (`O1–O3`)

1. **`empty-states` (4 empty-state types):** Design all 4 variants distinctly (`First run`, `No results`, `Error`, `Filtered out`) with illustration, human tone, and an actionable primary CTA (never generic `"Try refreshing"`).
2. **`onboarding-funcional` (Tour-free first-run & Notion blank canvas):** Skip multi-slide welcome tours (`3 screens · 0 read`): ask at most `1` upfront question before showing the app, open into a `3`-step checklist with step 1 already ticked (`1/3`), put a creation CTA in the empty list, allow max `1` thumb-zone coach mark (`>3` tooltips go unread), and keep `Skip` in a consistent corner saving progress. In blank editable docs: autofocus the title with `0` secondary chrome until hover, show a subtle `/` hint that vanishes on typing, keep placeholder noticeably pale, and fold starter templates on the first keystroke.
3. **`permisos-just-in-time` (Just-in-time permissions):** Request `1` OS permission at a time only when the user taps the feature needing it (never 3 cold asks at launch), precede the system dialog with your own benefit card (`"Get a reminder at 8 pm"`), and show a direct link to OS Settings whenever previously denied.

---

## 4. Conversion, Pricing, Checkout & Landings (`P1–P4`)

1. **`pricing-psicologia` (Clean pricing & behavioral framing):** Elevate `1` target middle tier with `1` `Most popular` badge (`0` badges on other cards), `1` solid filled CTA + `2` outlined buttons, diff-only bullet lists (`"Everything in Starter, plus:"` in 3 lines instead of 12 repeated checks), and express annual savings in money (`Save $98 / year` or `Save $240/year`) over `-17%`. Leverage anchoring (crossed-out `$49 -> $29/mo`, `+30%`) and asymmetric decoy tiers (`Basic $8 / Pro $14 / Premium $16`, shifting `20% -> 60%`).
2. **`checkout-stripe` (High-trust checkout):** Pin order summary next to the form with total echoed on the Pay button, place 1-tap wallets (`Apple Pay / Google Pay`) above card fields, detect card brand on digit 1, validate `onBlur`, and stack fields in `1` single vertical column with top labels (`7` eye jumps -> `1` line).
3. **`billing-zonas` (5-zone Billing page):** Order Billing top-to-bottom by user urgency: (1) Next charge amount + date first, (2) Payment method + pre-expiry warning before failure, (3) Invoices table (date first, ID last), (4) Plan change showing exact proration before confirming, and (5) `Cancel subscription` as a plain bottom text link (neither buried 3 menus deep nor a screaming red alarm).
4. **`landing-anti-slop` (Anti-AI-slop landing page):** Replace vague AI headlines (`"Supercharge your workflow with AI"`) with a concrete value prop (what + who), remove decorative background purple blobs putting color only on product + `1` primary CTA + `1` text link (not two `50%/50%` buttons), swap unverifiable `"10,000+ users"` claims for `1` real quote with name + role + unit-bearing metric, and show an annotated real product screenshot instead of 3 generic adjective cards.

---

## 5. Ethics & UX Psychology (`E1–E2`)

1. **`anti-dark-patterns` (Ethical UX):** Never use *Confirm Shaming* on reject buttons, never hide shipping/service/tax fees until checkout (*Hidden Costs*: `29€ -> 47€`), make cancellation as easy as signup (no 8-step `14-day` *Roach Motel*), avoid exploiting variable rewards/artificial streaks, and provide conscious exit pauses (`0.5s–3s` / batch limits) when healthy usage matters.
2. **`psicologia-memoria-ux` (Cognitive laws):** Apply *Serial Position* U-curve (`88%` start / `12%` middle / `78%` end recall) by placing primary items at ends; apply ethical *Zeigarnik* (`60%–80%` / `1–2` remaining items) strictly on user-chosen goals; design *Peak-End* (`58/100` cold vs `94/100` joyful ending) with an intentional delight peak and polished completion state.

---

## 6. Pre-code Workflow (`W1`)

1. **`flujo-spec-design-md` (Intent spec & domain `DESIGN.md`):** Before coding screens, write a `SPEC.md` anchored to user intent, operator questions, and worst possible mistake (`3–5` task columns instead of `9–12` raw DB columns, `1` primary action, all `6` states `Loading/Empty/Error/Success/Offline/Partial`). Author a product-specific `DESIGN.md` from its physical world (e.g. brewery tank stencil `Big Shoulders`, surf club printed tide table avoiding red for non-error weather forecasts and reserving plum for missing instructors/boards), turn static mocks into interactive prototypes before validating, and review diffs for state regressions and third button styles.
