# Integration with `DESIGN.md` and complementary tools

A UX audit loses its value if, in the next session, another agent adds unnecessary modals, duplicated buttons or toasts for critical errors again. This document defines how to keep the decisions in `DESIGN.md` and how to combine `product-ux-audit` with other skills or tools when they are available.

---

## 1. Persistent governance with `DESIGN.md` (Google/Stitch format)

The [`google-labs-code/design.md`](https://github.com/google-labs-code/design.md) project from **Google/Stitch** proposes combining **structured tokens (YAML)** with **criteria and explanations in prose (Markdown)**. The tokens fix concrete values (colors, typography, spacing); the prose documents the intent, the hierarchy and the behavior expected by code agents.

### Which interaction decisions to put in `DESIGN.md`
Besides the visual identity, `DESIGN.md` must record the **interaction decisions agreed for the product**, especially in operational applications (ERP, CRM, POS):

| Area | Which rule to document | Why record the reason |
|---|---|---|
| **Actions and scope** | Where the collection, row/detail, bulk and form actions live; how the main verbs are named. | Prevents future features from adding loose buttons in arbitrary places. |
| **Containers (Modal / Panel / Page)** | When inline editing, side panel, modal or dedicated page is appropriate in this product. | Stops complex forms from being stuffed into modals or new pages from being opened for micro-actions. |
| **Context continuity** | Which parameters must be preserved when navigating and going back (e.g. `location_id`, active store, search filters). | Prevents regressions where an adjustment or a cancel sends the user back to the wrong default location. |
| **Saving and confirmation** | The difference between a draft, a direct adjustment and a confirmed/issued operation. | Protects against destructive or accounting actions run without clear context. |
| **Errors and feedback** | Where validation errors, calculation warnings (e.g. discounts in returns) and background states are shown. | Avoids fleeting toasts for errors that require action, and false premature success messages. |
| **Notifications and pending items** | Which events go to the history, which notify and which create pending work with an owner and resolution state. | Keeps the operator's attention clean and separates *read* from *resolved*. |

**Always include the operational reason for each rule.** For example:

> *The filtered list is kept when editing or cancelling a stock adjustment (`location_id`) because the operator audits a whole branch in one go; losing the location on return introduces data-entry errors in the wrong branch.*

---

## 2. Working cycle with `DESIGN.md` during the audit

Always follow this four-step cycle:

1. **Read what exists first:** before auditing or proposing changes, read `DESIGN.md` (and `PRODUCT.md` or equivalent domain documents if they exist in the repository), as well as inspecting the real components and screens.
2. **Record discrepancies precisely:** if `DESIGN.md` says one thing and the application does another, do not automatically assume which one is wrong. Classify the discrepancy as:
   - *Implementation deviation:* the current rule is correct but a screen breaks it.
   - *Outdated documentation:* the product evolved with valid reasoning and the document has yet to reflect it.
   - *Incomplete transition:* the old and the new pattern coexist mid-migration.
3. **Separate current rules from pending proposals:**
   - While the user is reviewing before/after comparisons or choosing between `C01`, `C02`, `C03`, **the current `DESIGN.md` must not present as an active rule an alternative that is only being explored**.
   - Any change to the document tied to recommendations not yet implemented must be clearly labeled **`Proposal pending implementation (linked to Cxx)`**.
4. **Update after implementing and verifying:** once the chosen change is implemented, verified in a browser (desktop, tablet and mobile, with no horizontal overflow or console/network errors) and approved, update `DESIGN.md` as a current rule.

### Scope of the `design.md` utilities (`lint`, `diff`, `export`)
The command-line tools of the `design.md` ecosystem help validate the file structure, token references, documentary contrast and textual differences between versions of the document (`diff`). **A clean linter or documentary `diff` result does not replace the visual comparison of the rendered screens or the interactive verification of the journey.**

---

## 3. Relationship with other skills and complementary tools

`product-ux-audit` is **self-sufficient in its method and criteria**: it does not require other skills to be installed in order to run a full audit, prepare before/after comparisons or update `DESIGN.md`.

However, when the user's environment already has the following tools or skills, you can use them selectively according to the stage of the work:

| Project / Tool | Complementary role within the process | Operational caution |
|---|---|---|
| **Design with Intent (`ghaida/intent`)** | Its `evaluate`, `journey` and `organize` modules add depth for breaking down journeys across roles and information architecture. | Use it as an analytical input; always keep this skill's evidence requirements and `C01..Cn` identification. |
| **Impeccable (`pbakaus/impeccable`)** | Operations such as `shape`, `critique`, `distill`, `clarify` and `document` (generating `DESIGN.md` / `PRODUCT.md`), plus its `live` and `generate` modes to explore visual variants. Optional official install: `npx impeccable install`. | In Impeccable, `audit` is mainly technical (a11y/perf/responsive) while `critique` and `distill` are the ones relevant to UX. **Important:** accepting a variant in `live`/`generate` can write directly into the source code; during a comparison phase use it on a copy, worktree or preview branch. |
| **UI UX Pro Max (`ui-ux-pro-max`)** | A lookup library for specific patterns of forms, tables, accessibility and component states. | It does not replace task analysis and does not by itself justify merging or removing business functions. |
| **Emil Design Engineering (`emil-design-eng`)** | Refining tactile response, micro-interactions, transitions and the perception of fluidity **after** deciding which buttons exist and where they go. | Do not use animations to disguise a journey with redundant steps. |
| **Taste Skill / Frontend Design** | Aesthetic direction, typography, composition and visual identity when the assignment includes redesigning the style or a commercial surface. | In an operational ERP/CRM, task clarity and useful density take precedence over promotional impact. |
| **Playwright (CLI / real browser) + `axe-core`** | Run the real journeys as a user, capture equivalent screenshots in multiple viewports, measure horizontal overflow, check console/network and run deterministic accessibility checks with `axe-core`. | `axe-core` detects programmatic accessibility problems but does not evaluate whether the business flow makes sense; both levels are complementary. |

> **Transparency rule:** mentioning or recommending an add-on never equals assuming it is already installed or run in the current environment. Always check which tools are really available before invoking them.
