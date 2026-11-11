# Procedure for before/after visual comparison and proposal selection

When the audit moves from diagnosing problems to proposing interface or journey improvements, this protocol ensures that the **before/after** comparisons are honest, equivalent and actionable, making it possible to evaluate changes **individually and as a coherent set**.

---

## 1. First keep a verifiable "before" under equivalent conditions

Before changing code or laying out the "after", record the original state (real screenshots, commit/SHA or a reproducible reference).

For the comparison to be valid and not misleading, the **before** and the **after** must keep **equivalent conditions**:

- **The same task and the same user role.**
- **The same data, filters and active selection** (for example, the same selected branch/location, the same product or the same sale with a discount).
- **The same screen sizes (viewports):** desktop (`1440×900`), tablet (`768×1024`) and mobile (`390×844`), or the viewports defined in the project's visual contract.
- **Content of realistic length:** long product or customer names, real amounts, tables with representative volume. **It is forbidden to make the "after" look cleaner simply because it has fewer rows, invented short texts or empty data.**
- **The states that matter for deciding:** initial state, search/selection, editing, warning or error, confirmation/save and return to the list.

---

## 2. What kind of comparison to prepare depending on the available material

Adapt the comparison format to the project's real inputs and always state which part is real code and which part is reconstruction:

| Available material | Comparison to prepare | What must be stated explicitly |
|---|---|---|
| **Running application + source code** | Capture the original in a real browser and build the proposals reusing the project's components/styles in a copy, branch or preview environment. | Base SHA/state, captured routes and whether the variants run on real or test data. |
| **Navigable application without source code** | Capture the real journeys as the "before" and build a faithful HTML/CSS mockup for the "after". | Which styles or behaviors of the "after" are approximations external to the repository. |
| **Screenshots only** | Use the supplied screenshots as the "before" and lay out the "after" respecting the real data density. | Which journey states (errors, return to the list, mobile) are still pending live observation. |
| **Verbal or written description only** | Prepare task scenarios and conceptual sketches of the alternatives; the visual "before" is marked as pending to obtain. | That there is not yet any visual evidence of the current product. |

For interface decisions, always prioritize **views rendered in HTML/CSS or in the project's real components** and verified in a browser, instead of abstract descriptions.

---

## 3. Identified recommendations, dependencies and conflicts

Each proposed change must have a **stable identifier (`C01`, `C02`, `C03`...)** and declare its relationship with the others:

| Type of relationship | Meaning | Concrete example |
|---|---|---|
| **Independent** | Can be applied and evaluated on its own without requiring other changes. | `C01`: Preserve `location_id` when opening Stock Adjustment and in the Cancel button. |
| **Dependent (`requires Cxx`)** | Needs another recommendation to be active in order to make sense. | `C04`: Keep the active row highlighted when closing the side panel (`requires C03`). |
| **Incompatible alternative (`conflicts with Cxx`)** | Solves the same problem through a different architecture or container. | `C02`: Move the extensive editing to a dedicated page vs. `C03`: Edit in a side panel keeping the list visible. |

### How to handle "Apply all" when there are incompatible alternatives
- **"Apply all" must never silently mix two contradictory proposals** (such as using a side panel and a dedicated page simultaneously for the same step).
- When there are incompatible alternatives in the recommendations list, you must:
  1. Explicitly flag the conflict (e.g. `C02` vs `C03`).
  2. Offer **recommended compatible sets** (for example: **Recommended Set A** = `C01 + C02 + C04` oriented to deep editing on a dedicated page; **Recommended Set B** = `C01 + C03 + C04` oriented to fast processing in a list with a side panel).
  3. Also allow reviewing each separable change individually or the specific combination the person chooses.

There is no need to render in advance every possible mathematical permutation (`2^n`): start with the **before**, the **key individual changes** or the **recommended compatible sets**, and generate any additional selected combination on request.

---

## 4. Integrity rule between the selector and the preview

If you present an interactive comparator (with checkboxes to enable/disable `C01`, `C02`, `C03`...) or a change-selection table:

> **Ticking a checkbox does not allow claiming that the preview already shows that combination.** If a selected combination has not yet been rendered or captured, the interface or the report must state this explicitly as **`combination pending generation`** and produce the corresponding real view before presenting it as the visual result of that selection.

This prevents a frequent deception in AI-generated prototypes: a recommendations selector that looks interactive but always shows the same static "after" image regardless of which boxes are ticked.

---

## 5. What can be decided visually and what requires testing the journey

Distinguish which decisions are settled by looking at the compared screens and which require interacting with the flow:

- **What a static visual comparison does let you decide:**
  - Whether it is immediately clear what to do first.
  - Whether the actions are placed near the data needed to decide.
  - Whether visual noise or duplicated actions were reduced without hiding critical information.
  - Whether important warnings (such as discounts in a return or the active branch) stay visible in the right place.
  - Whether the proposal keeps the product's identity on desktop, tablet and mobile.
- **What requires a navigable prototype or a live test of the journey:**
  - Choosing between **modal, side panel and dedicated page** when it matters how one enters, what happens on a validation error, how the task is interrupted and how one returns to the list.
  - Checking that filters, the store/location and the selection are really kept when going back and forth.
  - Verifying keyboard navigation, focus handling and the absence of console or network errors.

Visual preference serves to choose a direction; to claim that a change **saves steps, prevents errors or preserves context**, it has to be verified by running the corresponding tasks.
