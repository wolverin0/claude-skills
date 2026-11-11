# Operational templates for audit, comparison and governance

Use these templates to structure the deliverables of `product-ux-audit` in a clear, verifiable and directly actionable way.

---

## 1. Map of tasks, roles and current journey

```markdown
### Map of audited tasks

| Task ID | Role | Real goal of the work | Current entry point | Data needed to decide | Current steps / context switches | What happens on error, interruption or return | Evidence status |
|---|---|---|---|---|---|---|---|
| T01 | Warehouse operator | Correct an item's stock in a specific branch and keep controlling that same branch. | `/inventory/stock` with a location filter. | Active location, current stock at that location, reason for the adjustment. | 1) Filter location → 2) Search product → 3) Go to Adjustment → 4) Back to the list. | Evaluate whether `location_id` is kept when entering the adjustment and when tapping Cancel/Save. | Verified / Inferred / Pending |
```

---

## 2. Semantic evaluation of potentially duplicated actions

```markdown
### Analysis of actions that are candidates to consolidate or keep

| Action / Control | Current location | Object + Operation | Scope | Initial → final state | Permissions / Role | Business consequences | Verdict (`Keep both entry points` / `Consolidate into one flow` / `Separate by distinct effect`) |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | Collection / Object / Selection / Form | ... | ... | ... | ... |
```

---

## 3. Prioritized finding sheet

```markdown
### [H01] Concrete title of the observed problem

- **Task and role affected:** [E.g. T01 — Branch operator / Returns handling]
- **Evidence:** [Route, screenshot, selector, code fragment or exact reproduced sequence]
- **Concrete consequence:** [What error, rework, loss of context or false confirmation the user suffers]
- **Prioritization breakdown:**
  - **Severity:** High / Medium / Low — [why]
  - **Frequency:** Continuous (per batch) / Daily / Occasional — [why]
  - **Confidence:** Verified / Inferred / Pending validation
- **Proposed change (`recommendation ID`):** [E.g. `C01` — exact description of the minimal intervention]
- **What works well and must be kept:** [Controls, approvals, validations or contextual entry points that must NOT be broken]
- **Risk or trade-off of the change:** [What cost or side effect to watch for]
- **Verifiable acceptance criterion:** [Exact steps to consider the finding resolved in a browser and in tests]
```

---

## 4. Matrix of selectable recommendations and before/after comparison

```markdown
### Selectable recommendations (`C01..Cn`)

| ID | Recommendation | Findings it resolves | Type of change | Relationship / Dependencies | Conflict with another proposal | Preview status |
|---|---|---|---|---|---|---|
| C01 | ... | H01 | Continuity / Context | Independent | None | Generated / Combination pending generation |
| C02 | ... | H02 | Container (Dedicated page) | Independent | Incompatible alternative to `C03` | Generated / Combination pending generation |
| C03 | ... | H02 | Container (Side panel) | Independent | Incompatible alternative to `C02` | Generated / Combination pending generation |
| C04 | ... | H03 | Feedback / In-context warning | Compatible with `C02` and `C03` | None | Generated / Combination pending generation |

### Compatible sets to decide (when "Apply all" has mutually exclusive alternatives)

- **Original (Before):** baseline captured under equivalent conditions (same role, data, filters and viewports).
- **Recommended Set A (`C01 + C02 + C04`):** [When it makes sense to choose this direction and what it prioritizes].
- **Recommended Set B (`C01 + C03 + C04`):** [When it makes sense to choose this direction and what it prioritizes].
- **User's custom combination:** [State which IDs were selected and whether the preview is already rendered or is a **`combination pending generation`**].
```

---

## 5. Sheet for evaluating or designing a notification / pending work

```markdown
### Notification or operational exception sheet

- **Trigger event:** ...
- **Category:** Activity (history) / Immediate feedback / Notification to a role / Pending work with an owner
- **Recipient role and reason:** ...
- **Direct action it enables:** ...
- **Consequence if ignored:** ...
- **Attention window:** Immediate / Within the shift / Daily / Periodic
- **Location and persistence:** Inline in context / Banner / Notification center / Pending-work inbox
- **Grouping rule (for repeated or mass events):** ...
- **Differentiation of states:**
  - *Read:* ...
  - *Dismissed (if applicable):* ...
  - *Resolved (closing condition):* ...
- **Accessibility (WCAG 4.1.3 / focus handling):** ...
```

---

## 6. Update or proposal for `DESIGN.md`

```markdown
### Entry for `DESIGN.md`

- **Rule status:** `Current (implemented and verified)` | `Proposal pending implementation (linked to Cxx)`
- **Interaction area:** Actions / Containers / Continuity / Saving / Errors and feedback / Notifications
- **Agreed rule:** [Clear, verifiable statement]
- **Operational reason (why it exists):** [Which task it protects and which error it prevents]
- **When to revisit this decision:** [What change in the user's work would justify rethinking it]
```

---

## 7. Export to `TRACKS.md` and `ux-findings.json` (stage 9, only if requested)

A `TRACKS.md` item, one per finding resolved by the chosen `Cnn`. The trailing fields are optional and do not break anyone who ignores them; `owns=` and `routes=` accept a comma-separated list:

```markdown
- [ ] T21 | owns=src/pages/Customers.tsx,src/components/CustomerPanel.tsx | [ux] side panel when editing a customer | src=UX-H03,UX-C02 | routes=/customers | ac=ux-findings.json#UX-H03
```

`ux-findings.json`: a list with one object per exported finding. These keys are defined only here; the other skills refer back to this template.

```json
[
  {
    "id": "UX-H03",
    "rec": ["UX-C02"],
    "title": "Side panel when editing a customer",
    "needs": ["UX-C01"],
    "ac": {
      "role": "Sales operator",
      "route": "/customers",
      "steps": ["Filter by zone", "Open a customer", "Edit the phone number and save"],
      "observable": "The list stays visible with the zone filter; the new phone number appears in the row.",
      "preserve": "Only the sales role edits; confirmation is requested when discarding changes."
    },
    "skill": "impeccable"
  }
]
```

| Key | Content |
|---|---|
| `id` | Finding with the `UX-` prefix; it is the anchor of `ac=ux-findings.json#<id>` and of `src=`. |
| `rec` | The chosen `Cnn` (with the `UX-` prefix) that resolve it. |
| `title` | Short title of the finding. |
| `needs` | `UX-Cnn` ids that must be implemented first (dependencies from the recommendations matrix). Empty if none. |
| `ac` | Acceptance criterion copied from the finding sheet (template 3): `role`, `route`, `steps` (exact steps), `observable` (observable result) and `preserve` (what is kept). |
| `skill` | Optional. Suggested design skill, only if installed. |
