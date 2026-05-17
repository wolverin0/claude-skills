---
name: security-review
description: Review security-sensitive code changes involving auth, user input, secrets, APIs, payments, files, RLS, or third-party integrations.
---

# Security Review

Use this skill to review a concrete implementation or planned change for
security risk. Keep the review evidence-based: cite files, lines, configs, and
runtime behavior where relevant.

## Review Flow

1. Identify the sensitive surface:
   - authentication or authorization
   - user input, uploads, forms, or generated HTML
   - secrets, tokens, credentials, or webhooks
   - API endpoints, payments, databases, or RLS policies
   - third-party integrations
2. Read the relevant code and configuration before giving advice.
3. Check the high-risk classes first:
   - hardcoded or leaked secrets
   - missing authz checks
   - injection risks
   - unsafe file handling
   - XSS/CSRF exposure
   - sensitive data in logs or errors
   - weak webhook/payment verification
   - missing rate limits on expensive or public endpoints
4. Verify with available tests, static checks, or targeted grep commands.
5. Report findings by severity with evidence and a concrete fix.

## When to Load References

Load `references/full-checklist.md` when the change touches multiple risk
classes, payment/security-critical paths, or the user asks for a comprehensive
checklist.

## Output

```text
SECURITY REVIEW
Scope: <files/features reviewed>

Findings:
1. <severity> <summary>
   Evidence: <path:line>
   Risk: <impact>
   Fix: <specific remediation>

Verified:
- <commands/checks run>

Residual Risk:
- <anything not verified>
```
