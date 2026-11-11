# 05 - Quick: a small check, never "battle-tested"

Command: `/battle-test --quick`

## When to use it

You made a small change and want quick confidence on the key routes or the ones you changed.
It is a clearly weaker check than the full cycle: it does not prove the project is ready.

## What it does

- Runs `vibe-to-prod`: a guided, read-only, layered self-assessment.
- Runs `validation --mode smoke --fresh` on the key or changed routes.
- Reviews every screenshot that comes out and requires `smokeScopeComplete:true`.
- If the app has a web interface, measures the performance budget (Lighthouse) once on the home route.
- Writes the QUICK CHECK report and stops.

## What it does not do

- It does not run the full audit, the autonomous hardening, the security depth or the exhaustive ledger.
- It never issues BATTLE-TESTED.
- It never pushes or deploys, nor does it authorize integration or release.

## Prompt to copy

```
1. Pre-check: Open the installed SKILL.md of battle-test and confirm that --quick exists ("vibe-to-prod + validation smoke; no battle-tested verdict"). If it does not exist, stop and tell me. Also confirm that the vibe-to-prod and validation skills are installed; if either is missing, stop and tell me.
2. Goal and scope: Quick check of <project path>, only on the key or changed routes: <screens or flow>. Work from that directory; if you are not standing there, stop and tell me. Running app: <local or staging URL>, with the credentials through environment variables I already have loaded. If it is an app with login and the credentials are missing, the validation is blocked, not passed: note it as GATED and do not say QUICK CHECK PASSED.
3. Command: /battle-test --quick
4. Limits: Forbidden: running the full audit, hardening or fixing code, making commits, integrating to main, pushing, deploying. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against <local or staging URL>, never against production: if the URL, the .env or the database points to production, stop and tell me. Do not integrate to main. Do not deploy. If you need to ask me something and you have no tool to ask, write it as GATED and stop.
6. Closing: Deliver the QUICK CHECK report with the reviewed screenshots and smokeScopeComplete. Verdict: QUICK CHECK PASSED or QUICK CHECK FAILED, never BATTLE-TESTED. Make clear to me that a QUICK CHECK PASSED does not authorize integration, release or deployment and that it does not replace the full cycle.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `--quick` | `skills/battle-test/SKILL.md:18` | Published form: "vibe-to-prod + validation smoke; no battle-tested verdict" |
| `clearly weaker smoke/readiness check` | `skills/battle-test/SKILL.md:3` | A weaker check, never battle-tested |
| `validation --mode smoke --fresh` | `skills/battle-test/references/stages.md:44` | What it runs |
| `smokeScopeComplete:true` | `skills/battle-test/references/stages.md:45` | Requires the complete smoke scope |
| `skip the full audit` | `skills/battle-test/references/stages.md:45-46` | It does not run the full audit, the autonomous hardening, the in-depth security or the exhaustive ledger |
| `perf budget once on the home` | `skills/battle-test/references/stages.md:46-47` | Performance budget once on the home route if there is a web UI |
| `never push or deploy` | `skills/battle-test/references/stages.md:48` | It never pushes or deploys |
| `QUICK CHECK PASSED` | `skills/battle-test/references/gates.md:34` | Verdict 1 of 2 |
| `QUICK CHECK FAILED` | `skills/battle-test/references/gates.md:35` | Verdict 2 of 2 |
| `never authorizes` | `skills/battle-test/references/gates.md:35` | It does not authorize BATTLE-TESTED, integration, release or deployment |
| `smokeScopeComplete:true` | `skills/battle-test/references/gates.md:33` | Condition of the quick gate |
| `QUICK CHECK PASSED` | `skills/battle-test/references/report.md:18` | Only for `--quick` |
| `blocked + not passed` | `skills/validation/SKILL.md:41` | App with login and no credentials: blocked, not passed |
| `SMOKE VERIFIED` | `skills/validation/SKILL.md:50` | The validation smoke mode's own verdict |
| `Read-only by default` | `skills/vibe-to-prod/SKILL.md:116` | `vibe-to-prod` is read-only unless asked |

## Not defined in the text

- How the "key/changed routes" are chosen: the text does not say whether they are passed to the command; the prompt declares them in the scope.
- Which verdict applies when the quick check ends up blocked for lack of credentials: the text only says QUICK CHECK PASSED or QUICK CHECK FAILED; the prompt requires not saying PASSED.
- Whether `--quick` creates the isolated worktree of stage 0: the quick profile section does not say.
- `--quick` together with `--push-main`, `--audit-only` or `--resume`: not mentioned; all that is known is that `--quick` never pushes or deploys.
- Whether smoke creates or deletes test data: smoke mode does not clarify (the text mentions `VAL_` only for standard and exhaustive).
- `vibe-to-prod` asks for a reference file (the playbook). The repo ships it at `skills/audit/references/production-readiness-playbook.md`; if it is missing from your installation, the skill cites it as optional depth.
