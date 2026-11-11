# 07 - Audit and remediate with a PR (`/audit-remediate`), and audit only (`/audit`)

Commands: `/audit-remediate --scope=<project subfolder> --max-rounds=<N>` (block A) and `/audit --scope=<project subfolder>` (block B)

> `/audit-remediate` creates a branch and opens a PR; opening a PR implies publishing that branch to your remote repository. It does not merge or touch main, but it does leave something published.
> If you only want the diagnosis, use block B.

## When to use it

Block A: you want the audit, the fixes and the re-audit to run on their own on a branch and the result to arrive as a PR for you to review.
Block B: you want only the audit report, read-only, without fixes.

## What it does

Block A (`/audit-remediate`):
- Reads `--scope` (default `.`) and `--max-rounds` (default 4) and takes the date as a stamp.
- Asks you to confirm in one line that it will create a branch and open a PR.
- Launches the workflow: audits in parallel, fixes in series on the branch with per-fix verification, re-audits until green or until rounds or budget run out, and opens the PR.
- Returns the status, the rounds, the remaining findings, the blocked ones, the branch, the PR URL and the "HUMAN ACTION REQUIRED" list.

Block B (`/audit`):
- Loads `audit-orchestrator` and goes through the phases: method, hard stops, Tambon signature hunt, blind spots, 13 domain audits and the close with the self-verification.
- Writes a single `audit-report.md` at the project root with the severity census, one of the five exact verdicts and the phased remediation plan.
- Takes about 40 to 70 minutes on the full repo, 10 to 20 with a single subtree.

## What it does not do

- `/audit-remediate`: it does not merge, does not touch main, does not force-push, does not weaken or delete tests to turn them green, and does not resolve what only you can do (rotate a key, enable RLS, pay for a plan, migrate data).
- `/audit`: it does not modify source code; it fixes nothing.
- Neither deploys.

## Block A: audit, fix and open a PR

```
1. Pre-check: Confirm that the /audit-remediate command is installed and that the audit-remediate workflow is available (the command launches it as a Workflow, by script path or by name). If either is missing, stop and tell me.
2. Goal and scope: Audit <project path>, fix the findings on a branch of its own with per-fix verification, re-audit and open a PR for me to review. Subfolder: <project subfolder, or . for everything>. Maximum rounds: <N, default 4>. Work from <project path>; if you are not standing there, stop and tell me. Screens or flow that matter to me: <screens or flow>; the real scope is set by --scope. If the project needs a running app to verify, use <local or staging URL>.
3. Command: /audit-remediate --scope=<project subfolder, or . for everything> --max-rounds=<N, default 4>
4. Limits: Forbidden: merging the PR, touching main, force-pushing, weakening or deleting a test to make it pass, deploying, rotating secrets, running migrations, touching data that is not test data, fixing outside <project subfolder>. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Only against local or staging code and data, never against production: if the .env or the database points to production, stop and tell me. When you ask for the one-line confirmation about the branch and the PR, wait for my yes; this prompt does not count as an answer. Do not merge or integrate to main. Do not deploy. If you need to ask me something and you have no tool to ask, stop.
6. Closing: Give me the workflow summary exactly as it comes back: status (green, partial, rounds-exhausted or budget-exhausted), rounds, remaining findings, number of blocked ones, branch name and PR URL. Put the HUMAN ACTION REQUIRED list first and clearly visible. Make clear to me that the PR is left open for my review and that nothing was merged.
```

## Block B: audit without fixing

```
1. Pre-check: Confirm that the /audit command and the audit-orchestrator skill are installed, and that the command accepts --scope. If anything is missing, stop and tell me.
2. Goal and scope: Read-only audit of <project path>. Subfolder: <project subfolder>. Work from <project path>; if you are not standing there, stop and tell me. The focus I care about most: <screens or flow>; the audit still covers the whole scope. If the skill needs a running app: <local or staging URL>.
3. Command: /audit --scope=<project subfolder>
4. Limits: Forbidden: modifying source code, making commits, fixing findings, skipping the hard stops phase, softening the verdict, writing the report without running the domain audits. Anything you find out of scope goes in a list at the end, without fixing it.
5. Safe side: Read-only on <project subfolder>; if an app is needed, only local or staging, never production. Do not integrate to main. Do not push. Do not deploy. If the scope is ambiguous and you have no tool to ask, stop. Do not quote the value of any secret you find: name the place.
6. Closing: Deliver audit-report.md at the project root, with the AUDIT VERDICT in one of its five exact texts and all the findings with path:line, and the final signal exactly as it came out: [AUDIT COMPLETE: all 7 rules attested, all 13 domains covered] or [AUDIT TRUNCATED: <reason>]. If any domain was left truncated, do not emit COMPLETE. If an audit-report.md already existed, leave it renamed as previous.
```

## Backing in the published text

| Token | File:line | What it backs |
| --- | --- | --- |
| `Never merges, never touches main` | `commands/audit-remediate.md:3` | It never merges or touches main |
| `opens a PR` | `commands/audit-remediate.md:3` | Opens a PR |
| `--scope=<path>` | `commands/audit-remediate.md:19` | Scope argument, default `.` |
| `--max-rounds=<N>` | `commands/audit-remediate.md:19` | Maximum rounds, default 4 |
| `date +%Y%m%d` | `commands/audit-remediate.md:21` | Date stamp |
| `Confirm with the user in ONE line` | `commands/audit-remediate.md:22` | One-line confirmation before launching |
| `Workflow({ name: "audit-remediate"` | `commands/audit-remediate.md:33` | It can also be launched by name |
| `rounds-exhausted` | `commands/audit-remediate.md:36` | Summary statuses: green, partial, rounds-exhausted, budget-exhausted |
| `HUMAN ACTION REQUIRED` | `commands/audit-remediate.md:37` | List that is shown prominently |
| `never merges; never force-pushes` | `commands/audit-remediate.md:43` | Guarantee |
| `never weakened or deleted` | `commands/audit-remediate.md:46` | A test is never weakened or deleted |
| `--scope=<relative path>` | `commands/audit.md:34` | `/audit` scope |
| `--priority-domains=<comma-separated 1-13>` | `commands/audit.md:35` | Domains to audit |
| `--resume-from=<N>` | `commands/audit.md:36` | Resume a truncated audit |
| `confirms scope with a single short question` | `commands/audit.md:38` | With no arguments, it asks one scope question |
| `40-70 minutes` | `commands/audit.md:42` | Time for the full repo |
| `audit-report.md` | `commands/audit.md:22` | A single report at the project root |
| `Do NOT modify any source code` | `commands/audit.md:66` | Read-only |
| `Do NOT skip Phase B` | `commands/audit.md:69` | The hard stops phase always runs |
| `Do NOT soften the verdict` | `commands/audit.md:70` | The verdict is not softened |
| `Do NOT produce a report without running the domain skills` | `commands/audit.md:67` | The report is not written without running the domains |
| `AUDIT COMPLETE: all 7 rules attested, all 13 domains covered` | `skills/audit/audit-orchestrator/SKILL.md:243` | Full end signal |
| `AUDIT TRUNCATED: <reason>` | `skills/audit/audit-orchestrator/SKILL.md:244` | Cutoff signal |
| `Emitting + AUDIT COMPLETE + if any domain truncated` | `skills/audit/audit-orchestrator/SKILL.md:304` | COMPLETE is not emitted if a domain was truncated |
| `🟢 ACCEPTABLE — routine cleanup; no launch-blockers` | `skills/audit/references/audit-triage-rubric.md:56` | Last of the five verdicts (full list in case 04) |

## Not defined in the text

- Which base branch the `/audit-remediate` PR is opened against: the text only says it never touches main.
- How `/audit-remediate` is resumed: the guarantees line says "resumable" but does not give the command. In `/audit` there is `--resume-from=<N>`.
- Whether `--priority-domains` or `--resume-from` apply to `/audit-remediate`: its published arguments are only `--scope` and `--max-rounds`.
- `commands/audit.md` is inconsistent with itself: line 3 lists two allowed arguments and the body (lines 34 to 36) lists three.
- The `audit-remediate` workflow does not ship in this repo: the command names it but it has to be installed separately; that is why the pre-check requires it.
- Whether `/audit` uses a running app: the text describes it as a reading of the code; that is why block B only mentions the URL in case the skill asks for it, and only local or staging.
