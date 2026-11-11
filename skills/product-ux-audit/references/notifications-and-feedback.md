# Policy for feedback, errors, notifications and pending work (ERP / CRM)

In operational products (ERP, CRM, administration, inventory, collections), the lack of a clear policy makes each module invent its own way of alerting: some use fleeting toasts for critical errors, others fill a notification bell that nobody acts on and others announce "Success" before the real process has finished.

---

## 1. Separate four things that tend to get mixed up

Before choosing a visual component, classify the information into one of these four categories:

| Category | What it is | Example in ERP / CRM | Where it lives |
|---|---|---|---|
| **1. Activity** | A historical record of something that happened and can be consulted whenever needed. | *"John adjusted the stock of Downtown Branch (+5 units) at 14:20"*. | The object's history, log or audit trail. It must not interrupt other users. |
| **2. Feedback** | The system's immediate response to the action the person has just run. | *"Adjustment saved"*, *"The reason is required"*, *"10% discount applied"*. | In the same place where the user acts (next to the field, in the active container or in a local state/toast depending on the impact). |
| **3. Notification** | A timely notice addressed to a role because an event occurred that it needs to know about. | *"The requested catalog export has finished"*, *"A credit note was received from the supplier"*. | Notification center / recoverable notices with a direct link to the resource. |
| **4. Pending work (Situation / Exception)** | Something requires a role to make a decision or solve a specific problem, with an owner and follow-up. | *"Payment received but not reconciled"*, *"Stock difference in the daily reconciliation"*, *"Return pending authorization"*. | Pending-items inbox / operational queue with context, direct actions and resolution state (inspired by **SAP Fiori Situation Handling**). |

---

## 2. Golden rule for asynchronous or background operations

**Never announce definitive success if the operation can still fail.**

- If a payment, sync, import or issuance is queued or processed in the background:
  - The immediate feedback must tell the truth: **"Payment sent for processing"** or **"Sync in progress"**, showing that state on the record.
  - If it later fails, the system must update the object's state and create a **recoverable pending-work item** for the responsible role, explaining what failed and how to retry or correct it.
- Showing a green *"Payment recorded successfully"* toast before the gateway or reconciliation fails is a **high-severity finding**.

---

## 3. Matrix for choosing the level of interruption and the component

Choose the treatment in proportion to the consequence and to the need for action (aligned with IBM Carbon Notifications and the GOV.UK Design System):

| Situation | Recommended treatment | What to avoid |
|---|---|---|
| **The change is already evident in the interface itself** (e.g. an item is checked or a filter changes with an immediate update). | Update the value or state in place; add extra text only if it adds clarity. | Firing a toast or modal for every minor click. |
| **Brief, low-impact confirmation** that needs no follow-up action (e.g. *"Link copied"*, *"Preference saved"*). | A discreet toast that does not cover action buttons or navigation. | Using a modal dialog that forces a click on *"OK"*. |
| **Correctable error in a form field.** | A clear message next to the affected field and, in long forms, an **error summary at the top** with direct links to each field (GOV.UK Error Summary pattern). | Erasing the data the user already typed, or showing only *"Invalid data"* in a toast that disappears. |
| **Warning or business condition that affects the current decision** (e.g. a return against a sale that had a discount or surcharge). | A persistent in-context alert (`.alert-warning` / inline banner next to the items or totals) explaining the real calculation. | Hiding the condition in a tooltip or warning only after the form has been submitted. |
| **Problem that prevents completing the current task** (e.g. save failure, version conflict, insufficient stock). | A persistent message inside the active form or view, keeping everything the user entered and explaining how to recover. | Showing a temporary 3-second toast as the only notice of the failure. |
| **General system condition or operating window** (e.g. read-only mode during a reconciliation window or degraded service). | A persistent top banner with the exact scope and which tasks remain available. | Letting the user complete a long form only to reject it at the end. |
| **Asynchronous event relevant to the requester** (e.g. report or import finished). | A recoverable notice with a direct link to the downloadable result or the error details. | Losing the link if the user did not manage to tap the toast at that moment. |
| **Operational exception that someone must resolve.** | An item in the **Pending work** inbox with owner, age, context data and a resolution action. | Sending a generic notice with no link to the object and no way to tell whether a colleague has already resolved it. |

---

## 4. Mandatory states: `read` ≠ `dismissed` ≠ `resolved`

In any notification or exception inbox of an ERP/CRM, require these three states to be separate:

1. **Read / Seen:** the person opened or saw the notice. **Opening or marking as read must never mark an exception as approved or a problem as resolved.**
2. **Dismissed / Muted (when informational):** the user decides to hide an informational notice that requires no action.
3. **Resolved / Closed:** the business cause was fixed (for example, the payment was reconciled, the stock was adjusted or the request was approved/rejected), recording who resolved it and when, or closing automatically when the condition disappears.

### Grouping on mass failures
If a sync or integration fails across 80 records, **do not generate 80 individual notifications**. Create **a single grouped incident** (*"Sync failure on 80 items of Downtown Branch"*) that leads to a filtered view with the affected records and the retry or review actions.

---

## 5. Mandatory sheet for approving a new notification

Before adding a new notification to the product, the design must answer these 9 points:

1. **Exact trigger event:** what precise condition generates it?
2. **Recipient and reason:** which specific role needs to know, and why?
3. **Available action:** what can that person do from the notice (direct link, quick action)?
4. **Consequence of ignoring it:** what happens to the business if nobody acts?
5. **Time window / urgency:** is it immediate, per shift, daily or periodic?
6. **Channel, location and persistence:** does it go in context, in a recoverable inbox, in a pending-work queue?
7. **Grouping and deduplication rule:** how is it grouped if it happens 50 times in a row?
8. **Resolution or expiry condition:** when does it stop being valid automatically?
9. **User control:** which thresholds or informational notices can they configure without turning off critical security or compliance alerts?

---

## 6. Accessibility of status messages (WCAG 2.2 SC 4.1.3)

Every status message that reports search results (e.g. *"3 sales found"* or *"No sales found for that criterion"*), progress, a save confirmation or dynamic errors without a page change must be announceable by assistive technologies without necessarily moving focus when that is not appropriate (`role="status"`, `role="alert"` or a suitable `aria-live`), except when an error summary or modal dialog must receive focus explicitly to guide the correction.
