# 08 - Validate the app only (`/validation` and its modes)

Commands: block A `/validation <URL>` (standard), B `/validation --mode smoke --fresh <URL>`, C `/validation --full --fresh <URL>`, D `/validation --interactive`, E `/validation --fresh <URL>`, F `/validation --resume`

## When to use it

You want to check in a real browser that the app works, without auditing the code or fixing anything.
Choose the block according to depth: B for quick confidence, A for the full and safe cycle of the interface, C for release depth.

## What it does

- Standard (A, the default mode): discovers, tests and reviews screenshots; covers every declared or reachable route, every non-destructive element, every reachable modal, 4 screen sizes, console and network, critical flows and safe create and delete checks with the `VAL_` prefix, with a coverage ledger with no gaps.
- Smoke (B): key or changed routes and flows, 2 screen sizes, with sampling allowed.
- Full (C): `--full` is the same as `--mode exhaustive`; it adds code-only surfaces, backend methods, forms, CRUD with `VAL_`, role and security probes, accessibility, performance and visual regression.
- Interactive (D): before discovering, it asks you for the backend, the coverage mode and the authentication mode.
- Fresh (E): archives or replaces the previous state and starts from discovery.
- Resume (F): continues an incomplete run from the saved phase.
- All of them save state in `test-manifest/validation-state.json` and build an HTML report.

## What it does not do

- It does not fix or change the app's code.
- The standard and full modes DO create and delete test data with the `VAL_` prefix: they are not read-only. The text does not say whether smoke writes data.
- It does not replace the audit, nor the battle-test cycle.
- A login without credentials does not count as a passed route: the run is left blocked.
- Smoke is never labeled `FULLY VALIDATED`.

## Flag combinations of `/validation`

| Combination | Status | Backing |
| --- | --- | --- |
| `--full --fresh` | valid: battle-test uses it | `skills/battle-test/references/stages.md:52` |
| `--mode smoke --fresh` | valid: battle-test uses it | `skills/battle-test/references/stages.md:44` |
| `--full` with `--mode` | not defined: `--full` is an alias of `--mode exhaustive` | `skills/validation/SKILL.md:59` |
| `--fresh` with `--resume` | not defined: the router describes each one separately | `skills/validation/SKILL.md:138-139` |
| `--interactive` with `--mode` | not defined: `--interactive` asks for the mode | `skills/validation/SKILL.md:65-69` |

## Block A: standard

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that the standard mode exists as the default mode of /validation. If it does not exist, stop and tell me.
2. Goal and scope: Validate <project path> in a real browser on <local or staging URL>, with focus on <screens or flow>. Credentials through environment variables I already have loaded, never written to files. Use the app that is already running at that URL; if it does not respond, stop and tell me instead of starting something else.
3. Command: /validation <local or staging URL>
4. Limits: Forbidden: modifying the app's code, writing credentials to config, state, reports or logs, running destructive actions or creating data outside the VAL_ prefix, marking the login screen as passed. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: this mode creates and deletes VAL_ data, so if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Deliver the "=== VALIDATION COMPLETE ===" block (backend, mode, coverage, routes, elements, flows, CRUD/API, reviewed screenshots, issues, path of the report and of the state) and the main problems. To call the run complete there must be coverageComplete true, zero unaccounted, and assert-coverage.js and certify-validation.js with exit 0; a failed result blocks certification even if it is accounted for. incomplete is not failed and do not translate it into a clean verdict. No credentials on an app with login: blocked, not passed. The text does not define a positive verdict for this mode: do not invent one.
```

## Block B: smoke

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that the smoke mode exists. If it does not exist, stop and tell me.
2. Goal and scope: Quick confidence on <project path> at <local or staging URL>, only on the key or changed routes and flows: <screens or flow>. Credentials through environment variables I already have loaded. Use the app that is already running; if it does not respond, stop and tell me.
3. Command: /validation --mode smoke --fresh <local or staging URL>
4. Limits: Forbidden: modifying the app's code, writing credentials to files, running destructive actions, marking the login screen as passed. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Deliver the "=== VALIDATION COMPLETE ===" block and the verdict SMOKE VERIFIED only if smokeScopeComplete is true; never call it FULLY VALIDATED. No credentials on an app with login: blocked, not passed. If there was a cut by --max-routes or --max-elements, the run is incomplete.
```

## Block C: full (exhaustive)

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that --full exists and that it says it is an alias of --mode exhaustive. If it does not exist, stop and tell me.
2. Goal and scope: Release-depth validation of <project path> on <local or staging URL>, all routes; focus on <screens or flow>. Credentials through environment variables, one role at a time, never in files. Use the app that is already running; if it does not respond, stop and tell me.
3. Command: /validation --full --fresh <local or staging URL>
4. Limits: Forbidden: modifying the app's code, writing credentials to config, state, reports or logs, creating or deleting data outside the VAL_ prefix, omitting an element without leaving it in the ledger as tested, skipped with a reason or quarantined. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: this mode runs security probes and creates and deletes VAL_ data, so if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Deliver the "=== VALIDATION COMPLETE ===" block and the main problems. To call the run complete there must be coverageComplete true, zero unaccounted, and assert-coverage.js and certify-validation.js with exit 0. A failed result blocks certification; incomplete is neither failed nor a clean verdict. The text does not define a positive verdict for this mode: do not invent one. If it is the validation of a launch, add as a checklist line a pass on a real phone, done by me.
```

## Block D: interactive

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that --interactive exists. If it does not exist, stop and tell me.
2. Goal and scope: Validate <project path> on <local or staging URL>, focus on <screens or flow>. Ask me for the backend, the coverage mode and the authentication mode before discovering; I answer with the question tool. Credentials only through environment variables I already have loaded.
3. Command: /validation --interactive
4. Limits: Forbidden: modifying the app's code, writing credentials to files, running destructive actions outside the VAL_ prefix, starting with answers I did not give. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits. Do not deploy. If you have no tool to ask, stop.
6. Closing: Deliver the "=== VALIDATION COMPLETE ===" block with the mode I chose and the main problems. If I chose smoke, the verdict is SMOKE VERIFIED only with smokeScopeComplete true and never FULLY VALIDATED. For the other modes the same as in block A applies: complete coverage, zero unaccounted and the two certification scripts with exit 0; the text does not define a positive verdict.
```

## Block E: start from scratch

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that --fresh exists. If it does not exist, stop and tell me.
2. Goal and scope: Discard the previous state of <project path> and validate again on <local or staging URL>, focus on <screens or flow>, in the standard mode. Credentials through environment variables I already have loaded. Use the app that is already running; if it does not respond, stop and tell me.
3. Command: /validation --fresh <local or staging URL>
4. Limits: Forbidden: modifying the app's code, writing credentials to files, running destructive actions or creating data outside the VAL_ prefix. Archive or replace the previous state only as the skill does; do not delete anything else. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Same as block A: the "=== VALIDATION COMPLETE ===" block, complete coverage with zero unaccounted, the two certification scripts with exit 0 and the main problems. No credentials on an app with login: blocked, not passed.
```

## Block F: resume

```
1. Pre-check: Open the installed SKILL.md of validation and confirm that --resume exists. If it does not exist, stop and tell me. Then check whether <project path>/test-manifest/validation-state.json exists and is in_progress or incomplete; if not, stop and tell me.
2. Goal and scope: Continue the incomplete validation of <project path> on <local or staging URL> from the saved phase, focus on <screens or flow>. Use the app that is already running; if it does not respond or changed build, stop and tell me. Credentials through environment variables I already have loaded.
3. Command: /validation --resume
4. Limits: Forbidden: restarting from scratch, reusing a green result from another build, modifying the app's code, writing credentials to files, running destructive actions or creating data outside the VAL_ prefix. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL or the database is production, stop and tell me. Do not integrate to main. Do not make commits. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Deliver the "=== VALIDATION COMPLETE ===" block and the main problems, with complete coverage, zero unaccounted and the two certification scripts with exit 0, or say exactly what is missing. The text does not define a positive verdict for these modes.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `/validation` | `skills/validation/SKILL.md:18` | Form with no arguments |
| `/validation http://localhost:3000` | `skills/validation/SKILL.md:19` | Form with a URL |
| `/validation --full` | `skills/validation/SKILL.md:22` | Published form of `--full` |
| `/validation --interactive` | `skills/validation/SKILL.md:23` | Published form |
| `/validation --fresh` | `skills/validation/SKILL.md:24` | Published form |
| `/validation --resume` | `skills/validation/SKILL.md:25` | Published form |
| `Plain + /validation + standard` | `skills/validation/SKILL.md:28` | With no flags it runs the standard cycle |
| `ask for the URL` | `skills/validation/SKILL.md:30` | With no URL: it detects a server or asks for it |
| `use + --resume + only to continue an incomplete run` | `skills/validation/SKILL.md:31` | `--resume` is only for continuing an incomplete run |
| `blocked` | `skills/validation/SKILL.md:41` | Login without credentials: blocked, not passed |
| `test-manifest/validation-state.json` | `skills/validation/SKILL.md:43` | State |
| `validation-{timestamp}.html` | `skills/validation/SKILL.md:44` | HTML report |
| `SMOKE VERIFIED` | `skills/validation/SKILL.md:50` | Smoke verdict; never FULLY VALIDATED |
| `VAL_ + create/delete checks` | `skills/validation/SKILL.md:51` | Standard: safe create and delete checks with the VAL_ prefix |
| `VAL_ + scoped CRUD` | `skills/validation/SKILL.md:52` | Exhaustive: CRUD with the VAL_ prefix |
| `skipped-with-reason` | `skills/validation/SKILL.md:56` | Each item ends up tested, skipped with a reason or quarantined |
| `alias for + --mode exhaustive` | `skills/validation/SKILL.md:59` | `--full` is an alias of `--mode exhaustive` |
| `--max-routes + incomplete` | `skills/validation/SKILL.md:59-60` | Cutting forces `incomplete` |
| `If + --interactive` | `skills/validation/SKILL.md:65` | Asks for the backend, mode and authentication |
| `If + --fresh` | `skills/validation/SKILL.md:138` | Archives or replaces the previous state |
| `If + --resume` | `skills/validation/SKILL.md:139` | Resumes from `session.currentPhase` |
| `never silently reuses a green result` | `skills/validation/SKILL.md:140-141` | Does not reuse a green result from another build |
| `smokeScopeComplete:true` | `skills/validation/SKILL.md:178` | Smoke condition |
| `assert-coverage.js` | `skills/validation/SKILL.md:176` | Exit 0 required in standard and exhaustive |
| `certify-validation.js` | `skills/validation/SKILL.md:176-177` | Exit 0 required |
| `A failed result blocks certification` | `skills/validation/SKILL.md:177` | A failure blocks even if accounted for |
| `LAUNCH` | `skills/validation/SKILL.md:180` | Real-phone pass as a checklist line |
| `Never translate it to a clean verdict` | `skills/validation/SKILL.md:191` | `incomplete` is neither `failed` nor clean |
| `=== VALIDATION COMPLETE ===` | `skills/validation/SKILL.md:198` | Closing block |
| `VALIDATION_EMAIL` | `skills/validation/references/auth.md:44` | Credentials through environment variables |
| `Credentials never go into config` | `skills/validation/references/auth.md:40` | Never in config, state, reports or logs |

## Not defined in the text

- A positive verdict for the standard and full modes: the text only gives `SMOKE VERIFIED` for smoke; `FULLY VALIDATED` appears only as what smoke can never say. That is why the blocks ask for the closing block and the conditions, not a label.
- Whether smoke creates or deletes data: the text does not clarify.
- `--fresh` with `--resume`, `--full` with `--mode`, `--interactive` with other flags: not defined (table above).
- How `/validation` limits the run to a few screens: what is declared is `--max-routes` and `--max-elements`, and cutting forces `incomplete`. That is why the focus goes in the scope, not as a filter.
- `/validation` can start the repo's server if it is unambiguous (line 29); the blocks ask for the opposite out of caution.
