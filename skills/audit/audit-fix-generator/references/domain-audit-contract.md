# Domain Audit Contract

Use this contract for every `audit-domain-*` skill.

## Inputs

- `scope`: repository path or subtree being audited.
- `stack`: detected stack summary from `audit-method`.
- `inventory`: route, migration, table, env var, and feature flag counts.
- `hard_stops_found`: H-class findings that affect this domain.
- `tambon_density`: LLM failure-mode density from `audit-tambon-hunt`.
- `blind_spots_present`: B-class findings routed to this domain.

## Rules

- Read `audit-rules.md` before producing findings.
- Quote before citing: every finding needs a path and line number.
- Do not invent findings to fill the report.
- Do not modify product code during an audit.
- Report `UNABLE` with the exact blocker when evidence cannot be checked.
- Include a scope/completeness line that references the inventory counts.

## Output Shape

Return only the domain report:

```text
[SECTION COMPLETE: Domain <N> - <Name>]

Scope/completeness:
- Checked: <inventory-backed scope>
- Unable: <blockers or none>

Findings:
- <severity> <id>: <summary>
  Evidence: <path:line>
  Exploitability: <local/network/authenticated/privileged/unknown>
  Impact: <business/user/system impact>
  Recommended fix: <specific remediation>
  Verification: <how to prove fixed>

No findings:
- Say "No findings meeting audit threshold" and cite what was checked.
```
