# 09 - UX audit without fixes (`product-ux-audit`)

Command: there is no slash command; the skill is invoked by name: "Use the product-ux-audit skill".

## When to use it

You want the usability diagnosis and the table of selectable changes `C01..Cn`, without anything being touched.
It exists because `/battle-test --ux` rejects `--audit-only`: there is no way to ask for "only audit the UX" from battle-test.

## What it does

The skill has 8 stages plus an optional export:
- Stage 1: builds the map of roles, work goals, business objects, permissions and work outside the app.
- Stage 2: records the current journey of each priority task, with the exception paths.
- Stage 3: two passes, comprehension (cognitive walkthrough) and everyday operation (CASTLE framework).
- Stage 4: evaluates redundant actions by their business meaning before proposing to merge or remove.
- Stage 5: decides the placement of actions, the container (inline, side panel, modal, page, steps) and when to merge or split steps.
- Stage 6: audits feedback, errors, notifications and pending work.
- Stage 7: prepares the before and after comparison with selectable recommendations `C01..Cn` and compatible sets.
- Stage 8: reviews `DESIGN.md` and separates current rules from proposals.

## What it does not do

- It does not fix or change code, nor the interface.
- It does not do stage 9 (export to `TRACKS.md` and `ux-findings.json`): it is only done if an orchestrator or the user asks for it.
- It does not update `DESIGN.md`: that is done after implementing and verifying the change; until then, what was chosen stays as a "proposal pending implementation".
- It does not give a single score ("UX Score") or a verdict.
- It does not replace validation with real people: a walkthrough by an agent is a hypothesis.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of product-ux-audit and confirm that it describes an 8-stage process plus an optional export (stage 9) and the C01..Cn table. If it does not, stop and tell me.
2. Goal and scope: Use the product-ux-audit skill to audit the UX of <project path>, centered on <screens or flow>. Navigate the app at <local or staging URL> with the relevant roles, without running actions that change data; credentials through environment variables I already have loaded. Do stages 1 to 8 and present the C01..Cn table with the compatible sets. In stage 8 only read DESIGN.md and write the proposal in your reply.
3. Command: Use the product-ux-audit skill
4. Limits: Forbidden: modifying code, styles, texts or the interface, editing or creating DESIGN.md, TRACKS.md or ux-findings.json, doing stage 9, making commits, touching security, database, dependencies or performance. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits or push. Do not deploy. If you need to ask me something and you have no tool to ask, stop. The skill's text does not say where the deliverable is saved: leave it in your reply and do not create files in the project.
6. Closing: Deliver the map of tasks, roles and current journey with the exceptions, the evaluation of duplicated actions, the prioritized findings (task or role, evidence, consequence, severity, frequency and confidence separately, proposed change, what to keep, risk and acceptance criterion), the C01..Cn table with compatible sets and the DESIGN.md proposal with what is current separated from what is proposed. Distinguish what is verified, what is inferred and what is pending validation. No single score or verdict: the skill defines none. Include what you conclude should be kept.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `Refuse` | `skills/battle-test/references/stages.md:148` | `--ux` rejects `--audit-only` (that is why this case exists) |
| `Use the product-ux-audit skill` | `skills/battle-test/references/stages.md:171` | How the skill is invoked (there is no slash command) |
| `8-stage audit process` | `skills/product-ux-audit/SKILL.md:29` | 8 stages plus an optional export |
| `Require evidence` | `skills/product-ux-audit/SKILL.md:20` | Verified, inferred and pending validation |
| `Never invent an artificial single score` | `skills/product-ux-audit/SKILL.md:21` | No score |
| `Separate severity, frequency and confidence` | `skills/product-ux-audit/SKILL.md:22` | Three separate axes |
| `navigable interface or screenshots` | `skills/product-ux-audit/SKILL.md:23` | A navigable interface or screenshots are audited |
| `keep this` | `skills/product-ux-audit/SKILL.md:24` | It may conclude that something should be kept |
| `AI simulation` | `skills/product-ux-audit/SKILL.md:25` | A walkthrough by an agent does not validate with humans |
| `Comprehension pass` | `skills/product-ux-audit/SKILL.md:52` | Stage 3 |
| `CASTLE` | `skills/product-ux-audit/SKILL.md:57` | Stage 3 |
| `Object + operation + scope + state + permissions + consequences` | `skills/product-ux-audit/SKILL.md:68` | Stage 4 |
| `Container choice` | `skills/product-ux-audit/SKILL.md:79` | Stage 5 |
| `Truthful state` | `skills/product-ux-audit/SKILL.md:90` | Stage 6 |
| `C01` | `skills/product-ux-audit/SKILL.md:98` | Selectable IDs and compatible sets |
| `proposals pending implementation` | `skills/product-ux-audit/SKILL.md:107` | Until implemented, what was chosen stays as a proposal |
| `once the change is implemented and verified` | `skills/product-ux-audit/SKILL.md:108` | `DESIGN.md` is updated after implementing |
| `only if an orchestrator or the user asks` | `skills/product-ux-audit/SKILL.md:110` | Stage 9 is optional |
| `if nobody asked for it, do not do it` | `skills/product-ux-audit/SKILL.md:111` | No export without a request |
| `Prioritized findings` | `skills/product-ux-audit/SKILL.md:127` | Fields of the deliverable |
| `Table of selectable recommendations` | `skills/product-ux-audit/SKILL.md:128` | `C01..Cn` table with compatible sets |
| `Proposal or update of` | `skills/product-ux-audit/SKILL.md:130` | `DESIGN.md` deliverable with current versus proposed |

## Not defined in the text

- A slash command, flags or arguments: the skill does not define them; it is only invoked by name.
- A fixed verdict or closing: the skill forbids the single score and does not define a result label.
- Where the deliverable is saved: the text lists the deliverables but not an output path.
- Whether stage 8 writes `DESIGN.md` during an audit with no implementation: the text says it is updated once implemented and verified; the prompt forbids writing it.
- Whether stage 7 is always done: the text conditions it on the user asking to compare proposals; the prompt asks for it expressly.
