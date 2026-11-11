---
name: product-ux-audit
description: "Audits application usability with a focus on tasks, interaction design and information architecture. Evaluates user journeys, duplicated actions, avoidable steps, containers (modals, side panels, dedicated pages), forms, error handling and notification or pending-work policies in operational products (ERP, CRM, dashboards). Prepares before/after visual comparisons with selectable recommendations and keeps interaction decisions in DESIGN.md."
---

# Product UX audit (`product-ux-audit`)

This skill drives a **usability audit centered on tasks, interaction design and information architecture**. Its goal is for an application to be understandable, fast and predictable for the people who use it every day, avoiding both the pile-up of redundant buttons and features and the blind simplifications that break business controls.

Always keep three distinct planes separate:

1. **Organization of the user's work:** what each role is trying to achieve, with what information, in what sequence and with what exceptions.
2. **Interaction design:** where the actions are, which container to use, when to merge or split steps, how progress is saved and how the system responds.
3. **Visual expression:** hierarchy, readability, grouping and consistency with the product's design system.

---

## Mandatory operating principles

1. **Require evidence and separate levels of certainty:** explicitly distinguish what is **verified** (observed in a browser, screenshots, traces or checked code), what is **inferred** (deduced from the structure or the domain) and what is **pending validation** (hypotheses or real-usage data not yet measured).
2. **Never invent an artificial single score:** do not summarize the audit as `"UX Score: 87/100"`. Describe concrete problems and their operational consequences (*"the filter is lost when going back"*, *"success is announced before processing finishes"*, *"the operator re-enters data the system already knows"*).
3. **Separate severity, frequency and confidence:** a failure can be very serious even if it rarely happens (e.g. confirming a payment that later fails in the background) or very frequent but low risk. Do not mix them into a single opaque label.
4. **First pass with user signals:** when auditing a navigable interface or screenshots, first try to find and understand the actions using only the signals visible to the user. Finding a feature by reading its internal name in the source code **does not prove** it is discoverable on screen.
5. **Protect what works and allow the conclusion `"keep this"`:** before proposing changes, identify which parts of the current flow already do the job well, protect permissions/approvals or provide useful contextual access. If an audit always adds new components, menus or screens, it makes the original problem worse.
6. **Do not confuse AI simulation with human validation:** an agent or a synthetic user completing a flow does not prove it is intuitive for real users. Treat synthetic walkthroughs as hypotheses and expert inspection.

---

## 8-stage audit process (plus an optional export)

### 1. Rebuild the product from people's work
Before giving opinions on buttons or screens, build a compact map of:
- **Roles and responsibilities:** who operates, who supervises, who approves.
- **Intended outcomes per role:** phrased as work goals (e.g. *"apply a partial transfer to the right invoice, leaving the outstanding balance clear"*), not as clicks in the current interface (*"open the Payments tab and tap Add"*).
- **Business objects, states and transitions:** customers, orders, invoices, payments, stock, claims, drafts, approvals.
- **Permissions, approvals and consequences:** which actions are reversible and which commit money, inventory, audit trail or third parties.
- **Work between people or outside the app:** steps that today force copying data into a spreadsheet, asking for confirmation through another channel or remembering information seen in another view.

See the methodological detail in [references/audit-method.md](references/audit-method.md).

### 2. Record the current journey before redesigning it
For each priority task, document the real journey end to end:
- Starting point and entry signals.
- Information the person needs in view to decide.
- Decisions they must make and context switches (page jumps, modals, tabs).
- Data the system already knows but forces them to retype or look up.
- How they recognize that the task is finished.
- **Exception paths:** empty state, loading, validation error, network/server failure, insufficient permissions, unsaved changes, asynchronous background operation and partial result.

### 3. Run two passes: comprehension and everyday operation
Evaluate each journey at two complementary levels (details in [references/audit-method.md](references/audit-method.md)):
- **Comprehension pass (cognitive walkthrough):**
  1. Does the person understand what they need to do at this point?
  2. Do they find the right action?
  3. Do they connect the control's label and location with the result they want?
  4. After acting, do they understand what happened and whether they moved forward?
- **Everyday-operation pass (CASTLE framework for work software):**
  - Can they process several records in a row without repeating searches?
  - Are filters, sort order, selection and scroll position kept when they come back?
  - Can they resume an interrupted task (e.g. after a phone call) without losing what was entered?
  - Do they need to memorize data from one screen to use it on another?
  - Can they resolve exceptions without restarting the whole flow?
  - Are there useful accelerators for frequent users without overloading the occasional one?

### 4. Evaluate redundancies with business meaning
Do not merge or remove buttons just because they have similar names. Compare each candidate action using the formula:

> **Object + operation + scope + state + permissions + consequences**

- **Legitimate contextual entry points (keep):** *"Record payment"* from an invoice (with the customer and document already defined) and *"Record payment"* from the customer record or the cash register can be two useful entry points to the same operation.
- **Real duplication (consolidate):** two different forms for the same operation with diverging validations, names or effects.
- **Distinct operations (do not mix):** do not automatically merge *void*, *delete*, *archive* and *revert* without checking their accounting, legal or state effects.
- **Low-frequency functions:** do not recommend removing periodic closings, regulatory exports or audit tools without evidence of their usage and whether they are mandatory.

### 5. Decide where actions, containers and steps go
Apply the operating rules in [references/interaction-criteria.md](references/interaction-criteria.md):
- **Placement by scope:** header/bar for the whole collection; row or detail view for one object; floating/top contextual bar when there is a multiple selection; form footer or bar for the task in progress.
- **Primary action per decision context:** avoid both filling the screen with competing primary buttons and artificially imposing "a single primary button per page" when legitimate contexts coexist. Do not hide high-frequency actions under a three-dot menu (`...`) just to tidy the table if that slows down daily work.
- **Container choice:**
  - **Inline editing:** a small adjustment that is understood next to the data.
  - **Side panel (drawer / split view):** inspect or edit a record while keeping the filtered list visible to process several consecutive cases.
  - **Modal:** a decision or short subtask that needs exclusive attention, with contained focus, a clear close and an exact return to the previous point.
  - **Dedicated page:** extensive work, multiple sections, history lookup or the need to save a draft and resume.
  - **Step-by-step flow (wizard):** a sequence with real dependencies or a guided, infrequent configuration.
- **When to merge or split steps:** merge steps that share a decision and information; keep them separate when the responsible person changes (e.g. entry vs approval), when there are irreversible consequences or when it helps to distinguish between **saving a draft** and **confirming/issuing an active entity**.

### 6. Audit feedback, errors, notifications and pending work
Apply the detailed policy in [references/notifications-and-feedback.md](references/notifications-and-feedback.md):
- Always distinguish four mechanisms: **Activity** (searchable history), **Feedback** (immediate response to the action), **Notification** (timely notice to a role) and **Pending work** (a task or exception with an owner, context, direct action and resolution state).
- **Truthful state:** never announce as successful a payment, sync or background process that can still fail; report *"Processing"* / *"Pending confirmation"* and turn the later failure into recoverable pending work.
- **Persistence proportional to the consequence:** do not use a fleeting toast as the only channel for an error that needs correction or recovery.
- **Separate states:** `read`, `dismissed` and `resolved` are different states. Marking an alert as read must never mark a reconciliation or exception as resolved.
- **Grouping:** if an integration fails across 80 records, create one grouped incident with access to the affected list instead of 80 loose notifications.

### 7. Prepare a before/after visual comparison
When the user asks to evaluate visual proposals or to compare before and after, you must follow [references/visual-comparison.md](references/visual-comparison.md):
1. **Keep a verifiable "before":** screenshots, route or reproducible reference under **equivalent conditions** (same task, same role, same data and filters, same screen size, realistic text lengths and the same edit/error/save/return states).
2. **Assign selectable IDs to each recommendation (`C01`, `C02`, `C03`...):** specify which are independent, which depend on another and which are **mutually exclusive alternatives** (e.g. `C02` dedicated page vs `C03` side panel for the same editor).
3. **Resolve conflicts before "Apply all":** if two recommendations compete over the same flow, flag the conflict explicitly and offer **recommended compatible sets** (e.g. *Set A: list flow with side panel* vs *Set B: dedicated-page flow*), in addition to the individual evaluation.
4. **Honesty of the selector and the preview:** ticking a checkbox or choosing a combination **does not allow claiming that the preview already shows that combination** if it has not been rendered yet. If it still has to be generated, label it explicitly as **`combination pending generation`** and produce it before presenting it as a result.
5. **Fidelity level:** use a static/HTML visual comparison for decisions about hierarchy, grouping and proximity of actions; propose or build a navigable prototype when the decision depends on the journey (errors, interruption, keeping filters on return, mobile adaptation).

### 8. Document in `DESIGN.md` and verify the implementation
To prevent future AI-driven changes from degrading the flow again, integrate the decisions with `DESIGN.md` following [references/design-md-integrations.md](references/design-md-integrations.md):
1. **Read what exists:** review `DESIGN.md`, `PRODUCT.md` (if present), tokens, components and the real screens.
2. **Record discrepancies:** if `DESIGN.md` states a rule and the app does something else, classify whether it is an implementation deviation, outdated documentation or an incomplete transition.
3. **Separate current rules from proposals:** while alternatives are being compared, `DESIGN.md` keeps the current rules. Recommendations under review, or chosen but not yet implemented, are marked as **proposals pending implementation**.
4. **Add with an explicit reason:** once the change is implemented and verified, update `DESIGN.md` explaining **what is done and why** (e.g. *"The list is kept while editing because the task requires reviewing several records in a row; when editing requires history and resumption, a dedicated page is used"*).

### 9. Export the chosen changes (only if an orchestrator or the user asks)
When this audit feeds another process (for example `/battle-test --ux`), close it with an export; if nobody asked for it, do not do it. What goes in is decided by the operator: present the `C01..Cn` table and the compatible sets from stage 7 and wait for their choice (a single pause). If there is no tool to ask, write the decision as pending in GATED and stop.
1. **Ids with the `UX-` prefix** (`H03` → `UX-H03`, `C02` → `UX-C02`) to avoid clashing with the hard-stops `H1..H11` of other audits and with the `T##` of `TRACKS.md`. The prefix is applied only on export: the templates keep numbering `H01`, `C01`.
2. **`TRACKS.md`** (worktree root), `## AUTO` section: one item per finding resolved by the chosen `Cnn`, in the format of [template 7](references/templates.md). The `T##` in `TRACKS.md` is its own: do not mix it with the `T01` of the audited tasks. Order: respect the dependencies between `Cnn`; never two mutually exclusive alternatives.
3. **`ux-findings.json`** (worktree root): the acceptance criterion of each item (role, route, steps, observable result and what is kept), with the keys of template 7.
4. **What was not chosen** goes to `## GATED` in `TRACKS.md` and to `gated.json` with `needs` = `operator decision`.
5. `TRACKS.md` and `ux-findings.json` are working artifacts: they are not committed.
6. Each item may name in `skill` which design skill fits, according to [references/design-md-integrations.md](references/design-md-integrations.md), always as "if installed".
7. `DESIGN.md` is not touched here: it remains stage 8, after implementing and verifying.

---

## Deliverables and templates

Use the structures in [references/templates.md](references/templates.md) to present the result:
- **Map of tasks, roles and current journey** (including exceptions).
- **Evaluation of duplicated or conflicting actions.**
- **Prioritized findings** (with Task/role, Evidence, Consequence, Severity/Frequency/Confidence, Proposed change, What to keep, Risk/trade-off and Acceptance criterion).
- **Table of selectable recommendations (`C01..Cn`) and compatible sets** for before/after comparison.
- **Notification and pending-work policy sheet** (when it applies to ERP/CRM/operations).
- **Proposal or update of `DESIGN.md`** distinguishing current vs proposed state.
- **Export to `TRACKS.md` and `ux-findings.json`** of the chosen `Cnn` (only if an orchestrator or the user asks for it).

---

## Supporting documents map

Load only the reference files needed for the current assignment:

- [references/audit-method.md](references/audit-method.md) — Task analysis, cognitive walkthrough, heuristics, the CASTLE framework, semantic detection of redundancies and the order of minimal intervention.
- [references/interaction-criteria.md](references/interaction-criteria.md) — Rules for placing actions by scope, choosing between inline/side panel/modal/page/steps, handling drafts and evaluating new features.
- [references/notifications-and-feedback.md](references/notifications-and-feedback.md) — Separation between activity, feedback, notification and pending work; interruption matrix; approval sheet and accessibility of status messages.
- [references/visual-comparison.md](references/visual-comparison.md) — Before/after comparison protocol under equivalent conditions, selectable recommendations, conflict handling and honest previews.
- [references/design-md-integrations.md](references/design-md-integrations.md) — Governance with `DESIGN.md` (Google/Stitch format) and selective use of optional add-ons (Design with Intent, Impeccable, UI UX Pro Max, Emil Design Eng, Taste, Playwright, axe-core).
- [references/templates.md](references/templates.md) — Ready-made templates to document findings, before/after comparisons, notification sheets and `DESIGN.md` rules.
- [references/sources.md](references/sources.md) — Methodological sources, design-system guides and reference projects used.
