# Authentication & Multi-Role Coverage

Most of an app lives *behind* login. Validating an authenticated app without credentials
tests the login screen and nothing else — that is a failed validation, not a clean one. This
reference is a hard contract: the skill must authenticate before testing protected surface, and
must cover every role that sees different things.

## Hard gate — never validate the login screen as if it were the app

Before testing any protected route/element/flow/responsive pass:

1. Detect the auth wall (preflight, DISCOVER §1). If the app redirects to a login form or the
   landing route renders sign-in fields, `authRequired = true`.
2. If `authRequired` and **no auth method is available** (no credentials, no saved state, no
   approved manual login), **STOP**. Do not test protected routes. Emit:

   ```
   === VALIDATION BLOCKED: credentials required ===
   This app gates {N} routes behind login. Without credentials the run would only test the
   login screen. Provide one of:
     - env vars per role: VALIDATION_EMAIL / VALIDATION_PASSWORD (+ _ADMIN, _<ROLE> variants)
     - a saved storage-state file per role
     - approval to log in manually (interactive runs only)
   Re-run with credentials. No protected route was marked pass.
   ```

   Record state with `preflight.authRequired: true`, `auth.blocked: true`, and exit cleanly.
   Public routes (if any) may still be tested and reported as a partial run.

3. **Login masquerade guard.** When testing a route that should be protected, if the page shows
   the login form or an auth redirect, the verdict is **`fail` (auth not established)** with
   failure source `environment`, never `pass`. A route is only `pass` when it rendered its real
   authenticated content. This guard runs on every protected route, not just at login.

Treat "credentials-not-provided on a login-gated app" as a blocker, not a silent skip. The most
common false-green in browser validation is a run that authenticated against nothing.

## Obtaining credentials — safely

Credentials never go into config, state, reports, snapshots, or logs.

| Method | How | When |
| --- | --- | --- |
| env vars | `VALIDATION_EMAIL` / `VALIDATION_PASSWORD`, plus per-role `VALIDATION_EMAIL_<ROLE>` / `VALIDATION_PASSWORD_<ROLE>` | default for automated runs |
| saved storage-state | a Playwright `storageState` JSON per role, passed via `--storage-state` / config `roles[].storageState` | fast re-runs, SSO, OAuth, MFA flows already completed |
| manual login | open the login page, ask the user to log in, then save storage-state for reuse | interactive runs, OAuth/SSO with no headless path |

If the project keeps a credentials doc, read it locally to populate env vars for this run only —
never echo the values into any artifact. Run `scripts/redact-artifacts.js` after the run.

After a successful login, **save the storage-state** to `test-manifest/auth/{role}-state.json` and
reuse it for every subsequent breakpoint/route/role-switch instead of logging in repeatedly.

## Multi-role coverage

If the app has more than one role with different access or features, each role is a first-class
validation pass. A single-role run on a multi-role app is an incomplete run.

Enumerate roles from `validation.config.json` → `roles`, or by asking in interactive mode:

```json
{
  "roles": [
    {
      "id": "admin",
      "label": "Administrator",
      "credentialsEnv": { "email": "VALIDATION_EMAIL_ADMIN", "password": "VALIDATION_PASSWORD_ADMIN" },
      "storageState": "test-manifest/auth/admin-state.json",
      "canAccess": ["/usuarios", "/configuracion", "/auditoria"],
      "denied": []
    },
    {
      "id": "operator",
      "label": "Operator",
      "credentialsEnv": { "email": "VALIDATION_EMAIL_OP", "password": "VALIDATION_PASSWORD_OP" },
      "canAccess": ["/monitoreo", "/puesto"],
      "denied": ["/usuarios", "/configuracion"]
    }
  ]
}
```

For deterministic multi-role runs, `scripts/validate-multirole.js` does this whole loop: it
UI-logs-in each role with its env credentials (or loads a saved storage-state), verifies the role
left the login screen, runs the per-role smoke, checks the access-control matrix, audits
responsiveness per accessible route, and writes a per-role ledger + redacted report. Use it for
the `playwright-local` backend; for other backends, drive the same steps manually.

For each role, run the full pass:

1. Establish auth for the role (storage-state if present, else env credentials, else manual).
2. Verify the role is actually logged in as that role (a role-identifying element, not just
   "left the login screen").
3. Run route checks, element checks, responsive audits, and flows under that role, with evidence
   written to role-scoped paths: `test-manifest/evidence/routes/{role}/{routeId}-{breakpoint}.png`.
4. **Access-control checks (positive AND negative):**
   - every `canAccess` route renders that role's real content → expected `pass`.
   - every `denied` route shows access-denied or redirect → expected `pass` (the denial is
     correct). If a `denied` route renders real content, that is a **`fail`, severity critical**
     — a privilege/authorization hole, the most important thing this pass can find.
5. Role-specific features (admin-only buttons/modals/CRUD) are tested only under a role that has
   them, and confirmed absent under roles that should not.
6. Object-level auth (IDOR) is checked per role with `scripts/security-probe.js` — route-level
   `denied` is not enough; a role that can open `/orders` must still be blocked from another
   user's `/orders/{id}`. See `references/security-probe.md`.

## Coverage ledger with roles

The coverage ledger (see `coverage-contract.md`) is per role:

```text
=== COVERAGE LEDGER (role: admin) ===
Routes: 11/11 tested, canAccess 8/8 ok, denied 0/0
...
=== COVERAGE LEDGER (role: operator) ===
Routes: 6/6 accessible tested, denied 5/5 correctly blocked
Authorization: 0 leaks  (a leak here is a critical finding)
```

A multi-role app is `coverageComplete` only when every declared role ran a full pass and every
declared `denied` route was confirmed blocked.

## State

Record in `validation-state.json`:

- `auth.required`, `auth.blocked`, `auth.method` (`env|storage-state|manual|none`)
- `auth.roles[]` with `{id, authenticated: bool, stateFile, verifiedBy}`
- per-result `role` tag
- never any credential value
