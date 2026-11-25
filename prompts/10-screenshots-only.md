# 10 - Visual pass on every route (`/validation --mode standard`)

Command: `/validation --mode standard <URL>` (the `visual-route-sweep` skill is retired; its matrix and review batching are part of validation standard mode)

## When to use it

You want to see how every safe route of the app looks in light and dark, at every configured viewport (including the 1366x650 laptop), with the screen and console failures detected and every screenshot reviewed.
It also exercises the elements and modals and creates and deletes only `VAL_` test data. It does not run security probes or visual regression; those are `exhaustive`.

## What it does

- Records the source SHA, the running build, the URL, the authentication method, the roles, the themes and the viewports.
- Inventories the runtime routes, elements, modals and flows; every item is tested, skipped with a reason, or quarantined.
- Authenticates before the protected routes.
- Captures every safe route at each viewport, in light and dark when the app supports them.
- Records HTTP status, console and page errors, failed requests, responsive findings and the a11y checklist for each route.
- Reviews every capture in batches, records one semantic review per image and certifies the coverage.

## What it does not do

- It does not modify the application code and does not deploy.
- It does not cover security, role probes, visual regression or the full battle-test cycle.
- It does not invent records or IDs for the dynamic routes.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that "/validation --mode standard <url>" exists and that scripts/responsive-audit.js is installed alongside it. If anything is missing, or if your agent does not recognize the /validation form, stop and tell me.
2. Goal and scope: Visual pass of <project path> on <local or staging URL>: every safe route in light and dark at every configured viewport, with every screenshot reviewed. At the end highlight in the summary whatever corresponds to <screens or flow>. Authentication only through environment variables or a saved browser state that I already have; if they are missing, stop and tell me.
3. Command: /validation --mode standard <local or staging URL>
4. Limits: Forbidden: --full, modifying code, destructive actions on data that is not VAL_ test data, inventing records or IDs for dynamic routes, using a login, error or blank screen as proof. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL points to production, stop and tell me. Do not integrate to main. Do not make commits or push. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Deliver the state file and the HTML report with the evidence paths and the unresolved routes. The run is complete only when the coverage ledger has zero unaccounted items, assert-coverage.js and certify-validation.js both exit 0 on the exact build. If that is not met, say exactly what is missing. Passing this mode never means security, CRUD depth or the full battle-test.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `/validation --backend agent-browser --mode standard` | `skills/validation/SKILL.md:20` | Published invocation form |
| `standard` row (6 viewports, light and dark, batched review) | `skills/validation/SKILL.md:50` | What standard covers |
| `--full` is an alias for exhaustive | `skills/validation/SKILL.md:59` (`--full` is an alias for `--mode exhaustive`) | Why `--full` is forbidden here |
| `Auth: required` | `skills/validation/SKILL.md:40` | Authenticate before protected routes |
| `VAL_` create/delete | `skills/validation/SKILL.md:50` | Test data scope |
| `visual-only request ... never replaces full validation` | `skills/validation/SKILL.md:33-34` | A visual-only pass has no separate verdict |
| `hd-laptop` 1366x650 mandatory | `skills/validation/phases/DISCOVER.md` (standard breakpoints) | The short laptop viewport |
| `Review budget` | `skills/validation/references/coverage-contract.md` ("Review budget") | Batched review of screenshots; an unreviewed batch is blocked |
| `certify-validation.js` exits 0 | `skills/validation/SKILL.md:185` | Completion gate |

## Not defined in the text

- A verdict for this mode other than `PASS`/`FAIL` from the coverage gates: validation defines no visual-only verdict.
- A way to limit the pass to a few routes: a coverage cap makes the run incomplete; `smoke` is the bounded mode.
- The invocation with a slash in agents that do not use slash commands: the text publishes only the `/validation` form; the prompt asks to stop if it is not recognized.
