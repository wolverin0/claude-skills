# 10 - Screenshots only (`visual-route-sweep`)

Command: `$visual-route-sweep <URL>` (published form; without `--fix`)

## When to use it

You want to see how every safe route of the app looks in light and dark, on desktop, tablet and phone, with the screen and console failures detected.
It is only the visual part: it does not run security, CRUD or architecture.

## What it does

- Records the repo SHA, the running image or revision, the URL, the authentication method, the roles, the themes and the sizes.
- Inventories the runtime routes and the same-origin links; classifies each route as tested, non-visual, destructive, superseded, unresolved dynamic or quarantined, with a reason.
- Authenticates before the protected routes.
- Captures the visible screen and the full page of every safe route on desktop, tablet and phone, in light and dark.
- Records HTTP status, final URL, console and page errors, failed requests, document width and responsive findings.
- Actually reviews every capture (it generates a contact sheet, but capture is not review).
- Writes an append-only route ledger and a JSON and HTML report with the unresolved dynamic routes.

## What it does not do

- Without `--fix` it remediates nothing: it does not touch the code.
- It does not deploy.
- It does not cover security, CRUD, data integrity or the full battle-test cycle.
- It does not invent records for the dynamic routes.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of visual-route-sweep and confirm that the form "$visual-route-sweep <url>" exists and that --fix is a separate flag. Also confirm that the validation skill is installed alongside this one, because the sweep uses its responsive-audit.js script. If anything is missing, or if your agent does not recognize the $, stop and tell me.
2. Goal and scope: Visual sweep of <project path> on <local or staging URL>. The sweep inventories all the safe routes; at the end highlight in the summary whatever corresponds to <screens or flow>. Authentication only through environment variables or a saved browser state that I already have; if they are missing, stop and tell me.
3. Command: $visual-route-sweep <local or staging URL>
4. Limits: Forbidden: using --fix, modifying code, running destructive actions, inventing records or IDs for dynamic routes, using a login, error or blank screen as proof. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL points to production, stop and tell me. Do not integrate to main. Do not make commits or push. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Deliver the route ledger, the JSON and HTML report with the evidence paths and the unresolved dynamic routes. The only verdict the skill defines is VISUAL ROUTE SWEEP GREEN and it requires zero browser errors of the app's own, zero safe routes unaccounted, zero high responsive findings and the complete capture review on the exact build. If that is not met, say exactly what is missing and do not use GREEN. GREEN never means security, CRUD, data integrity or the full battle-test.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `$visual-route-sweep <url>` | `skills/visual-route-sweep/SKILL.md:13` | Published invocation form |
| `$visual-route-sweep <url> --fix` | `skills/visual-route-sweep/SKILL.md:14` | With remediation (this case does not use it) |
| `--resume` | `skills/visual-route-sweep/SKILL.md:15` | Resume |
| `--fix` + `does not authorize` | `skills/visual-route-sweep/SKILL.md:18-19` | `--fix` authorizes remediating and not deployment |
| `environment + saved browser state` | `skills/visual-route-sweep/SKILL.md:19-20` | Credentials through environment variables or saved browser state |
| `Record repository SHA` | `skills/visual-route-sweep/SKILL.md:24` | Step 1 |
| `Inventory runtime routes` | `skills/visual-route-sweep/SKILL.md:25` | Step 2: inventory and classification |
| `Authenticate before protected routes` | `skills/visual-route-sweep/SKILL.md:27` | Step 3 |
| `responsive-audit.js` | `skills/visual-route-sweep/SKILL.md:32` | Uses a script from the validation skill |
| `do not equate capture` | `skills/visual-route-sweep/SKILL.md:35-36` | Capture is not review |
| `With + --fix + isolated worktree` | `skills/visual-route-sweep/SKILL.md:37` | Remediation only exists with `--fix` |
| `Never fabricate representative records` | `skills/visual-route-sweep/SKILL.md:40` | Do not invent records |
| `append-only route ledger` | `skills/visual-route-sweep/SKILL.md:39` | Ledger and report |
| `VISUAL ROUTE SWEEP GREEN` | `skills/visual-route-sweep/SKILL.md:46` | The strongest verdict |
| `never means security, CRUD` | `skills/visual-route-sweep/SKILL.md:48` | Scope of the verdict |
| `Every discovered GET route must be one of` | `skills/visual-route-sweep/references/coverage-contract.md:13` | Route classification |
| `A coverage cap makes the run incomplete` | `skills/visual-route-sweep/references/coverage-contract.md:15` | Cutting coverage leaves the run incomplete |
| `delegate to` | `skills/validation/SKILL.md:35` | For screenshots only, validation delegates to this skill |

## Not defined in the text

- A verdict other than `VISUAL ROUTE SWEEP GREEN`: the text names only the strongest one and does not define a failure verdict.
- How to limit the sweep to a few routes: the contract inventories all of them and a coverage cap leaves the run incomplete; that is why the screens in scope are only highlighted in the summary.
- Where the ledger and the report are written: the text says what is written, not the path.
- The invocation with a slash or without `$` in agents that do not use `$`: the text publishes only the form with `$`; the prompt asks to stop if it is not recognized.
- `--fix` with `--resume`: not mentioned.
