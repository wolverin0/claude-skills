# Task-centered UX audit method

This document details the methodological framework of `product-ux-audit` for evaluating existing applications without reducing UX to a purely cosmetic matter.

---

## 1. Combination of methods and the question each one answers

| Method | Central question it answers | When it weighs most |
|---|---|---|
| **Task Analysis** | What is the person trying to achieve, what information do they need and what work do they do inside and outside the system? | At the start of the assessment and before proposing merges or flow changes. |
| **Cognitive Walkthrough** | Does the person understand what to do, find the control, understand its label and recognize the result? | When evaluating discoverability, clarity of calls to action and confusing steps. |
| **Heuristic evaluation** | Are visibility of status, consistency, user control, error prevention and recovery respected? | When reviewing forms, asynchronous states, confirmations and error messages. |
| **Information architecture** | Do the objects, views, menus and labels reflect the mental model of the work and allow each function to be found? | When navigation is scattered, names are ambiguous or modules are duplicated. |
| **CASTLE framework (NN/g)** | What mental load, everyday efficiency, use of advanced features, learnability and error rate/recovery does the work tool have? | In operational dashboards, ERP, CRM, back-office and high-repetition flows. |
| **Testing with real users** | Do representative people complete the goal without help and understand what happened? | To validate the inspection's hypotheses when the change has a high impact. |

Task analysis defines which work matters; the cognitive walkthrough and the heuristics examine how the interface responds; testing with real people checks the hypotheses.

---

## 2. Reconstructing the real work (Stage A)

Avoid describing the product by its current screens (*"the customers module has three tabs"*). Reconstruct:

1. **Active roles and interdependencies:**
   - Who starts the task (e.g. salesperson, cashier, warehouse operator).
   - Who receives the result or must approve/reconcile (e.g. administration, supervisor).
2. **Domain goals:**
   - Express the task as a verifiable business outcome:
     - *Wrong:* "Open the adjustment modal and change the number."
     - *Right:* "Correct a stock difference detected in a specific branch's warehouse, leaving a traceable reason and going back to the list for that same branch."
3. **Objects, states and transitions:**
   - Identify the main objects and their real states (draft, pending approval, issued, partially paid, reconciled, voided, failed).
4. **Invisible or external work:**
   - Detect whether the user needs to open another tab to look up a code, jot an amount on paper or pass through WhatsApp/a spreadsheet a piece of data the system should keep in context.

---

## 3. Verifiable record of the current journey (Stage B)

For each critical task, record:

- **Entry:** where each role starts and what context they bring (active filters, selected branch, current customer or document).
- **Decision inputs:** what data they need to see before clicking (balance, stock at that location, history, restrictions, applied discounts).
- **Context switches:** how many times they change page, open/close modals or lose sight of the reference they were consulting.
- **Data re-entry:** which fields they are asked to fill in manually when the system already knows them from the entry point.
- **Closing signal and continuity:** how they confirm the operation finished and where they are left for the next case.
- **Unhappy-state matrix:**
  - No results / empty state.
  - Loading / processing in the background.
  - Field validation error.
  - Server or network error, or a concurrency conflict.
  - Insufficient permissions or the need for another role's authorization.
  - Interruption mid-entry (unsaved changes / draft).
  - Partial result (e.g. 12 items were processed and 3 failed).

---

## 4. Double pass: Comprehension vs. everyday operation (Stage C)

### Pass 1: Comprehension and learning (Cognitive walkthrough)
At each step of the task, answer with evidence:
1. **Intent:** Would the user know what they are trying to achieve at this step?
2. **Discoverability:** Is the action they need visible or clearly accessible?
3. **Semantic association:** Does the text of the button, icon or link let them anticipate what will happen when it is activated?
4. **Recognition of progress:** After the action, do they get a clear and truthful response about the new state?

> **Rule for AI agents:** do this first pass guided by the visible texts, the visual hierarchy and the accessibility tree. If you only discover what a button does because you read `onClick={handlePartialReconcile}` in the code, record a discoverability or labeling problem in the interface.

### Pass 2: Intensive operation (CASTLE and complex applications)
In systems used daily (ERP, CRM, POS, case handling), someone who has already learned where the button is still suffers if the flow is clumsy. Evaluate:
- **Batch continuity:** Can they resolve 20 cases in a row without re-choosing store, location, date or filter each time?
- **Working memory (cognitive load):** Does the action screen show the data needed, or does it force them to remember amounts, codes or conditions seen in the previous step?
- **Interruption tolerance:** if a call comes in or a piece of data is missing, can they save a draft or step out to look it up without losing everything?
- **Exception handling in context:** when something leaves the standard path (discount, partial payment, branch change), is there a clear way out without restarting the operation from scratch?
- **Accelerators:** Is there direct search, keyboard use, defaults consistent with the session and quick actions for frequent tasks?

---

## 5. Detecting redundancies with business meaning (Stage D)

When an application has grown with the help of AI or through successive additions, similar actions often appear in several places. Before proposing to merge or delete them, compare them with this structure:

```text
Object + Operation + Scope + Initial/final state + Permissions + Consequences
```

### When to keep multiple entry points
Two buttons with the same name can be **legitimate contextual entry points** to the same operation:
- *"Record payment"* from an invoice's detail (preloads customer and invoice).
- *"Record payment"* from the customer's account statement or from the cash register (lets them choose which documents to apply it to).

**What to do:** keep both entry points if they respond to real moments of the work, making sure they share the same business rules, validations and underlying components, and that access from a specific object **preloads** that context instead of asking for it again.

### When to consolidate real duplications
Duplication is harmful when:
- There are two different screens or modals for the same operation with different fields, names or validations.
- One view offers two competing buttons without explaining their difference (e.g. *"Save"*, *"Update"* and *"Apply changes"* on the same form).
- A flow asks, in two consecutive steps, to decide exactly the same thing with no new information in between.

### When NOT to merge or remove
- **Verbs with different consequences:** *Void*, *Delete*, *Archive*, *Return* and *Revert* often have very different accounting, stock or audit effects. Never unify them without checking the domain model.
- **Segregation-of-duties controls:** if a step exists because another person or role must authorize or review, do not remove it on the grounds of "saving clicks".
- **Infrequent but critical operations:** monthly/annual closings, reconciliations, inventory adjustments or legal exports must not be proposed for removal without evidence of real usage and business requirements.

---

## 6. Order of minimal intervention and prioritization criterion (Stage E)

When formulating improvements, follow this order of preference:

1. **Eliminate repeated or unnecessary work** (do not ask again for data the context already has).
2. **Preserve the user's context** (filters, location/branch, selection, scroll).
3. **Unify inconsistent rules and labels** so the same operation is named and behaves the same way.
4. **Place the action next to the information needed to decide.**
5. **Reveal secondary options progressively** instead of showing all edge cases at the same level as the main task.
6. **Add new components or views only when the work cannot be solved cleanly with what exists.**

### How to rate findings (without fictitious scores)
Rate each finding on three independent axes:
- **Severity of impact:**
  - *High:* leads to a business/money/stock error, shows false states, causes data loss or blocks the task.
  - *Medium:* adds repetitive steps, breaks batch continuity, loses filters/context or requires memorizing information between screens.
  - *Low:* minor friction in reading, alignment or improvable labels with no risk of operational error.
- **Estimated frequency:** a continuous task in every shift, a daily task, or an exceptional/periodic case.
- **Confidence of the evidence:** `Verified` (reproduced/observed in the UI or code), `Inferred` (deduced from rules/structure) or `Pending` (requires production data or user testing).
