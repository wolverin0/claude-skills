---
name: tdd-workflow
description: Guide test-first implementation for features, bug fixes, and refactors. Use when the user wants tests to drive or protect code changes.
---

# TDD Workflow

Use this skill when tests should shape the implementation or protect a risky
change. Adapt to the project: do not force a framework, coverage target, or E2E
suite that the repository does not already support.

## Flow

1. Read the existing test setup and conventions.
2. Define the behavior in user-visible terms.
3. Write the smallest failing test that captures the behavior or bug.
4. Run the focused test and confirm it fails for the expected reason.
5. Implement the smallest code change that makes the test pass.
6. Run the focused test again.
7. Broaden verification only as risk requires: related unit tests, integration
   tests, type checks, lint, build, or browser validation.
8. Refactor only after tests are green.

## Test Selection

- Unit tests for pure logic, components, validators, and utilities.
- Integration tests for APIs, database access, service boundaries, and auth.
- E2E/browser tests for critical user flows and UI regressions.
- Regression tests for every confirmed bug when feasible.

## Rules

- Do not claim TDD if the first test was written after the implementation.
- Do not invent a test stack; inspect the repo first.
- Do not require 80% coverage unless the project already enforces it.
- Keep tests independent and deterministic.
- Mock external services at unit boundaries; use real integrations only when
  the project already has safe integration fixtures.

## References

Load `references/full-process.md` when you need concrete Jest/Vitest,
Playwright, mock, coverage, or CI examples.

## Output

```text
TDD SUMMARY
Behavior: <what was specified>
Failing test: <path or not feasible>
Implementation: <paths changed>
Verification:
  - <command>: <pass/fail>
Residual risk:
  - <not covered>
```
