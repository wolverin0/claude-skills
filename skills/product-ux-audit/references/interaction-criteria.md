# Interaction design criteria: actions, containers and forms

An operating guide for deciding where to place buttons, when to use modals, side panels or dedicated pages, when to merge or split steps and how to control the addition of new features.

---

## 1. Where to place actions according to their scope

The guiding question is: **"What object or set am I acting on, and at what point in the task do I need it?"**

| Scope of the action | Recommended placement | Clear examples | Frequent mistakes to correct |
|---|---|---|---|
| **The whole collection or module** | View header or top toolbar. | *New product*, *Import list*, global filters, branch/location selector. | Repeating global buttons inside every row or hiding the main filter in a submenu. |
| **A single object** | In the corresponding table row or in the header/bar of its detail view. | *Adjust stock*, *Record payment*, *Edit*, *View history*. | Forcing the user to go to another module and search again by code for the object they already had in front of them. |
| **Several selected objects** | Contextual selection bar (appears or activates when items are checked). | *Change status in bulk*, *Export selected*, *Assign owner*. | Permanently showing 8 disabled bulk buttons, or running a bulk action without saying how many records it will affect. |
| **The task or form in progress** | Form actions area (visible footer or fixed editor header). | *Save draft*, *Confirm adjustment*, *Issue invoice*, *Cancel*. | Mixing the form's submit button with secondary navigation actions, or letting it disappear outside the viewport with no fixed bar. |

### Button hierarchy and visibility
- **Primary action per decision context:** each decision unit must make clear which is the main path (e.g. *Confirm return*) and which is the safe exit (*Cancel* / go back keeping the context). Do not force "a single highlighted button on the whole screen" if the view legitimately combines two independent contexts (for example, an operational search bar and a results panel).
- **Beware of the three-dot menu (`...`):** grouping infrequent secondary or destructive actions in a dropdown menu helps reduce noise, but **never hide there the primary action the role comes to that table for** without checking the cost in clicks and time for someone processing dozens of rows in a row.
- **Labels with a verb and a clear object or effect:** prefer *"Adjust stock"*, *"Save draft"*, *"Issue and send"* over ambiguous labels such as *"Accept"*, *"Process"* or *"Continue"* when the action has final consequences.

---

## 2. When to use each container (Inline, Side panel, Modal, Dedicated page, Steps)

Do not choose a modal out of habit or a new page for every micro-edit. Evaluate the task by these criteria (aligned with the form and dialog guidelines of IBM Carbon and the W3C ARIA APG):

| Container | When to choose it | When to avoid it | Continuity and accessibility requirements |
|---|---|---|---|
| **Inline editing** | A short change of 1–2 values that is understood by looking at the current row or card (e.g. changing a status, an owner or a quick quantity). | When the change requires explaining long reasons, attaching supporting documents or triggers complex cascading calculations. | Show a clear saved state, allow cancelling with `Escape` and do not abruptly shift the active row. |
| **Side panel (Drawer / Split view)** | Reviewing or editing a record **while keeping the filtered list visible** to work through several consecutive items without losing the reference. | When the form needs to compare wide tables, multiple columns or nested subtasks that get cramped in a narrow width. | Keep the base list's filters, selection and scroll; clearly mark which row is open; adapt to full screen on mobile. |
| **Modal (Dialog)** | A bounded decision, a confirmation with explicit consequences or a short subtask that needs exclusive attention before returning to exactly the same point. | **Never rebuild a whole application inside a modal:** avoid long forms, tables with internal pagination, modals on top of modals, or tasks that require consulting data covered by the dialog itself. | Move focus on open, contain keyboard navigation (`Tab`), close with `Escape` (with a safeguard if data has been entered), have an accessible title (`aria-labelledby`) and return focus to the control that opened it. |
| **Dedicated page** | An extensive task with several sections, detail lines, history lookup, attachment upload, a need to share a URL or to resume later. | For simple confirmations or single-attribute changes that make the user lose the list and wait for two full page loads. | **Preserve the originating context in the URL or session** (e.g. `?location_id=17` or active filters) both on entry and in the *Cancel / Back* button. |
| **Step-by-step flow (Wizard / Stepper)** | When there are real dependencies between stages (step 2 depends on what was chosen in step 1) or an infrequent task needs progressive guidance. | For daily tasks of expert operators where splitting 6 known fields across 4 screens only multiplies clicks and hides the full picture. | Allow reviewing and correcting earlier steps without losing what was entered; clearly indicate which step is being worked on and when the final effect runs. |

### Control questions for choosing between Modal, Side panel and Dedicated page
1. Does the person need to keep seeing the list or compare with other records while deciding? → **Side panel** or split view.
2. What happens if an error appears or a piece of data is missing and they have to look it up elsewhere? → If a **modal** forces them to close it and lose everything they typed, use a **dedicated page** or a **panel with a draft**.
3. How do they return to the list after saving or cancelling? → They must return keeping the store, location, search, filters and position they had before opening the editor.
4. How does it behave on tablet and phone (`768px` and `390px`)? → No horizontal overflow, with main actions reachable and no covered controls.

---

## 3. When to merge steps and when to keep them separate

### When to merge steps into one
- When two consecutive screens or buttons are part of **the same decision by the same role** and share the same data (for example, searching for a product from an already filtered location and opening its adjustment keeping that location preselected).
- When the current split forces the user to **copy or remember a code/amount** from one step to paste it manually into the next.
- When a default search mode can **resolve with a smart fallback** (for example, if the operator searches sales by product code, variant or tag without having changed a secondary selector first).

### When to keep steps separate
- **Draft vs. active entity (SAP Fiori Draft Handling):** preserving partial changes in a draft is not the same as issuing an invoice, affecting stock or confirming a return. When the final action has accounting or inventory consequences, clearly differentiate *Save draft* from *Confirm / Issue*.
- **Change of owner or approval:** when the person who prepares the operation is not the one who authorizes it, keep submission for review and approval separate, leaving the intermediate state visible.
- **Confirmation of non-obvious consequences:** if a return affects a sale that had discounts or surcharges, show a clear in-context warning with the real amount to be refunded before running the action.

> **On the "3-click rule":** do not use an arbitrary cap of three clicks as a universal law. Reducing clicks improves UX only when it reduces mental load, data re-entry or context switches; compressing ten distinct decisions into one overloaded screen worsens usage and increases errors.

---

## 4. A filter to keep future features from overloading the product again

Before approving or designing a new feature or an additional button, demand concrete answers to these seven questions:

1. **Which existing task does it improve, or which new goal does it enable?**
2. **Which role needs it and how often?**
3. **Where would that role expect to find it within their natural journey?**
4. **What new decisions does it require the user to make?**
5. **What manual work or redundant step does it remove in exchange?**
6. **What happens if it fails, is left half-done or is run by mistake?**
7. **How will we verify that it really made the work easier?**

### Predictable dynamism
A "dynamic" interface in an operational system must respond to context (preload the single store/location, update the placeholder according to the chosen criterion, enable the submit button when valid items are selected, show bulk tools when rows are selected) **without suddenly moving buttons or reordering the row the user is about to click**.
