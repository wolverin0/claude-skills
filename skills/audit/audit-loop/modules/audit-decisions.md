---
name: audit-decisions
description: Standardize remediation decisions, baseline-policy entries, and legal-review banners for accepted, deferred, or policy-blocked audit findings.
---

# Skill: Audit Decisions

Use this skill when an audit finding is accepted, deferred, converted to
policy baseline, or routed to legal review.

This skill provides the governance records that `audit-loop` uses to
decide whether a finding can count as resolved for convergence.

---

## remediation-decisions.md Template

Create or update `remediation-decisions.md` with one entry per finding:

```
## <Finding ID> - <Finding title>

Severity: <Critical | High | Medium | Low>
Decision: <ACCEPT | REMEDIATE | DEFER>
Rationale: <why this decision is appropriate>
Owner: <person/team/role>
Review-by date: <YYYY-MM-DD>
Evidence: <report path and path:line citations>
```

Decision meanings:

- `REMEDIATE`: fix in repo or required external system.
- `DEFER`: acknowledged but scheduled for a later date with an owner.
- `ACCEPT`: deliberate risk acceptance with baseline-policy entry.

---

## baseline-policy.md Block

Any `ACCEPT` decision or `BLOCKED-POLICY` audit-loop item requires a
structured entry in `baseline-policy.md`:

```
## <Finding ID> - <Finding title>

Justification: <business/technical reason for exception>
Residual risk level: <Critical | High | Medium | Low>
Approval authority: <name/role or governance body>
Expiry date: <YYYY-MM-DD>
Review cadence: <monthly | quarterly | before launch | other>
Compensating controls: <controls currently reducing risk>
Evidence: <links or path:line citations>
```

An expired baseline entry does not count as resolved. A baseline entry
without approval authority does not count as resolved.

---

## Legal-review Banner

Any finding touching PII, financial data, auth/authz, or data retention
MUST include this banner in `remediation-decisions.md` and any roadmap
entry:

```
WARNING LEGAL REVIEW REQUIRED - do not mark ACCEPT without legal sign-off
```

Do not mark these findings `ACCEPT` unless legal sign-off is recorded in
the decision entry and reflected in the baseline-policy approval
authority.

---

## How audit-loop Uses This Skill

`audit-loop` must invoke this skill before it marks any finding
`BLOCKED-POLICY`.

Gate requirements for `BLOCKED-POLICY`:

- `remediation-decisions.md` contains the finding with Decision `ACCEPT`
  or `DEFER` and a review-by date.
- `baseline-policy.md` contains a complete block for the finding.
- The baseline entry has approval authority and is not expired.
- If the finding touches PII, financial data, auth/authz, or data
  retention, the legal-review banner is present and legal sign-off is
  recorded.

If any gate requirement is missing, the item remains unresolved and the
audit loop must continue or report `TERMINAL BLOCKED`.

---

## Failure Modes To Refuse

- Accepting PII, financial, auth/authz, or data-retention risk without
  the legal-review banner and sign-off.
- Treating `DEFER` as resolved without an owner and review-by date.
- Treating `ACCEPT` as resolved without `baseline-policy.md`.
- Leaving baseline-policy entries without expiry dates.

[SECTION COMPLETE: audit-decisions]
