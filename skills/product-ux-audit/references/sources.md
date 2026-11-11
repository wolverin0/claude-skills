# Methodological sources, design guidelines and reference projects

This file gathers the sources that `product-ux-audit` relies on, organized by their concrete contribution to the audit process, interaction design, before/after comparison and documentation in `DESIGN.md`.

---

## 1. Usability evaluation methods and work software

- **Nielsen Norman Group (NN/g) — Task Analysis: Support Users in Achieving Their Goals**
  - URL: <https://www.nngroup.com/articles/task-analysis/>
  - Contribution: breaking work down by real goals, inputs, decisions, steps and interdependencies before redesigning screens.
- **Nielsen Norman Group (NN/g) — Evaluate Interface Learnability with Cognitive Walkthroughs**
  - URL: <https://www.nngroup.com/articles/cognitive-walkthroughs/>
  - Contribution: the four cognitive walkthrough questions for evaluating intent, discoverability, label clarity and recognition of progress.
- **Nielsen Norman Group (NN/g) — 10 Usability Heuristics for User Interface Design**
  - URL: <https://www.nngroup.com/articles/ten-usability-heuristics/>
  - Contribution: visibility of system status, match with the real world, user control and freedom, consistency, error prevention and recovery.
- **Nielsen Norman Group (NN/g) — CASTLE Framework for Workplace Applications UX**
  - URL: <https://www.nngroup.com/articles/castle-framework/>
  - Contribution: evaluation specific to enterprise software and operational dashboards (cognitive load, use of advanced features, satisfaction, task efficiency, learnability and errors).
- **Nielsen Norman Group (NN/g) — 8 Design Guidelines for Complex Applications**
  - URL: <https://www.nngroup.com/articles/complex-application-design/>
  - Contribution: support for non-linear journeys, interruptions, batch work, reducing memory load across views and coordination between roles.
- **Nielsen Norman Group (NN/g) — The 3-Click Rule for Navigation Is False**
  - URL: <https://www.nngroup.com/articles/3-click-rule/>
  - Contribution: avoiding mechanical click-counting rules; prioritizing information clarity, lower cognitive effort and preservation of context.
- **GOV.UK Service Manual — Using moderated usability testing**
  - URL: <https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing>
  - Contribution: designing test scenarios based on credible goals without dictating where to click.
- **Nielsen Norman Group (NN/g) — Synthetic Users: If, When, and How to Use AI-Generated "Research" & Synthetic Users vs. Human Respondents (2026)**
  - URLs: <https://www.nngroup.com/articles/synthetic-users/> and <https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/>
  - Contribution: treating walkthroughs by agents and synthetic users as useful hypotheses for early inspection, without presenting them as evidence of validation with human users.

---

## 2. Enterprise interaction patterns: containers, drafts, errors and notifications

- **IBM Carbon Design System — Dialogs & Forms Patterns**
  - URLs: <https://www.carbondesignsystem.com/building-blocks/core/patterns/dialogs> and <https://www.carbondesignsystem.com/building-blocks/core/patterns/forms>
  - Contribution: criteria for choosing between inline editing, side panel, modal dialog, dedicated page and step-by-step flow; a ban on rebuilding whole flows inside a modal.
- **IBM Carbon Design System — Notifications Pattern**
  - URL: <https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications>
  - Contribution: classification by urgency, scope and interruption (transient toast, inline notification, banner, notification center).
- **SAP Fiori Design Guidelines — Situation Handling**
  - URL: <https://www.sap.com/design-system/fiori-design-web/v1-120/discover/sap-products/sap-s4hana-only/situation-handling>
  - Contribution: treating operational exceptions in ERP/CRM as situations with business context, a responsible role, recommended actions and a resolution state.
- **SAP Fiori Design Guidelines — Draft Handling**
  - URL: <https://www.sap.com/design-system/fiori-design-web/v1-145/foundations/best-practices/global-patterns/object-handling/draft-handling>
  - Contribution: a clear distinction between keeping a work-in-progress draft and confirming/applying changes to an active business entity.
- **SAP Fiori Design Guidelines — Notification Center**
  - URL: <https://www.sap.com/design-system/fiori-design-web/v1-145/ui-elements/notification-center>
  - Contribution: grouping by type/priority, direct actions and separation between reading and resolution.
- **GOV.UK Design System — Error Summary**
  - URL: <https://design-system.service.gov.uk/components/error-summary/>
  - Contribution: a persistent error-summary pattern at the top of the form with direct links to each field that needs correction.
- **W3C WAI — ARIA Authoring Practices Guide (APG): Modal Dialog Pattern**
  - URL: <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
  - Contribution: the contract for initial focus, `Tab` containment, closing with `Escape`, an accessible name and returning focus to the triggering element.
- **W3C WAI — Understanding WCAG 2.2 Success Criterion 4.1.3: Status Messages**
  - URL: <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>
  - Contribution: programmatic communication of search results, confirmations and dynamic errors through `role="status"` / `role="alert"` without improper focus stealing.

---

## 3. Design systems for agents (`DESIGN.md`), analyzed skills and verification

- **Google Labs Code / Stitch — `design.md` Specification & Philosophy**
  - URLs: <https://github.com/google-labs-code/design.md>, <https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md>, <https://github.com/google-labs-code/design.md/blob/main/docs/spec.md>
  - Contribution: the `DESIGN.md` specification combining structured tokens and prose with intent and persistent operating rules for code agents.
- **Design with Intent (`ghaida/intent`)**
  - URLs: <https://github.com/ghaida/intent/blob/main/skills/evaluate/SKILL.md>, <https://github.com/ghaida/intent/blob/main/skills/journey/SKILL.md>, <https://github.com/ghaida/intent/blob/main/skills/organize/SKILL.md>
  - Contribution: structured evaluation that protects what already works (`evaluate`), mapping of multi-role journeys and recovery (`journey`), and information architecture (`organize`).
- **Impeccable (`pbakaus/impeccable`)**
  - URLs: <https://github.com/pbakaus/impeccable/blob/main/.claude/skills/impeccable/SKILL.md>, `reference/critique.md`, `reference/distill.md`, `reference/shape.md`, `reference/document.md`, `reference/live.md`
  - Contribution: upfront definition operations (`shape`), UX critique (`critique`), simplification (`distill`), documentation in `DESIGN.md`/`PRODUCT.md` (`document`) and exploration of variants (`live`/`generate`).
- **uxaudit (`gotalab/uxaudit`)**
  - URL: <https://github.com/gotalab/uxaudit/blob/main/skills/uxaudit/SKILL.md>
  - Contribution: automated scenario walkthroughs over the application backed by screenshots and traces (understand, decide, act, recover).
- **UI UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`), Emil Design Engineering (`emilkowalski/skills`), Taste Skill (`Leonxlnx/taste-skill`) and Anthropic `frontend-design` (`anthropics/skills`)**
  - URLs:
    - <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md>
    - <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>
    - <https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md>
    - <https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md>
  - Contribution: component patterns, micro-interactions and aesthetic direction as complementary layers once the tasks and the interaction flow are resolved.
- **Microsoft Playwright & Deque `axe-core`**
  - URLs: <https://github.com/microsoft/playwright-mcp> and <https://github.com/dequelabs/axe-core>
  - Contribution: running flows in a real browser, multi-viewport screenshots, accessibility trees and programmatic auditing of WCAG rules.
