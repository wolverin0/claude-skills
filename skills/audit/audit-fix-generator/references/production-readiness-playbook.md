# Production-Readiness Playbook

Canonical reference for turning vibe-coded demos into production software.
Distilled from the Matt Murphy AI corpus (113 videos). The model that
optimizes for "it works" does not optimize for "it works at scale, securely,
reliably." This file catalogs the gap.

**How this file is used.** It is the single source of truth cited by:
- the `vibe-to-prod` skill (guided self-check),
- the 13 `audit-domain-*` skills (enrichment checks),
- `audit-hard-stops` (H10, H11) and `audit-blind-spots` (B16-B19),
- the `production-readiness` rule.

Cite sections by their stable anchors: `L1`-`L13` (layers), `FM-1`..`FM-25`
(failure modes), `CHK-1`..`CHK-5` (checklists), `PRIN-1`..`PRIN-8` (principles).
Reference form used elsewhere: `playbook#L4`, `playbook#FM-10`, `playbook#CHK-2`.

The core framing: **most vibe coders ship 2 layers (front-end + database).
The other 11 layers are what separate a demo from a product.** And: AI writes
the first 80% (features, happy path); the last 20% (security, error handling,
logging, deployment, compliance) is the engineering. See `PRIN-1`.

---

# The 13-layer production stack

## L1 — Front-end foundations
Responsive across real devices (not just your laptop); accessibility for
screen readers; performance on slow connections; state management that does
not leak; error boundaries that contain crashes; bundle-size discipline;
offline handling. **Every UI component needs all four states: loading, error,
empty, success** (see `FM-6`, `B19`). Test edge-case input: apostrophes in
fields, 10,000 chars in a 50-char field, emojis in search. Maps to audit
domains D6 (UX/A11y), D5 (Performance, bundle).

## L2 — APIs and back-end logic
Real API architecture, not direct DB calls from the front-end. **Input
validation enforced server-side** (not in JS where the user can bypass it).
Business logic centralized, not scattered into the client. Auth enforced on
requests. **No secrets in the browser** — proxy external API calls through a
server route so the key lives server-side (`FM-4`, `H11`). Try-catch on every
external call with a fallback. The database is the source of truth, not a
third-party API. Maps to D1 (Security), D2 (Architecture).

## L3 — Database and storage
Normalized relational schema, not one table with 47 columns (`FM-12`). Indexes
on every frequently-queried column and on foreign keys. **A migration file for
every schema change** (version control for the DB); never alter schema directly
in production. Automated backups with **tested restores** (not assumed). Three
databases minimum: dev, staging, production. Logical partitioning (by month,
region) before physical sharding. Serverless Postgres (Neon) + DB branching for
safe testing. Maps to D3 (Database).

## L4 — Auth and permissions
**Authentication ≠ authorization** (login ≠ permissions). Session tokens that
actually expire (test: copy URL after logout, paste back — must fail, see
`CHK-4`). JWTs with proper expiry. **Row-Level Security enforced at the DB
level**, not just app code: every table with user data needs at least SELECT +
INSERT policies; sensitive tables also UPDATE + DELETE. User A must not see User
B's data by changing a URL/param (IDOR, `FM-8`, `B8`). Admin endpoints need a
real role check, not a flippable boolean. Password hashing with bcrypt/argon2,
never MD5/plaintext. Rate-limit login attempts. **Use battle-tested auth
(Clerk, Supabase Auth, Auth0) — never roll custom.** Maps to D1.

## L5 — Hosting and deployment
Staging environment separate from production. Preview deployments per change.
Deployment checklist: test in staging → review diff → merge → auto-deploy. No
manual FTP / editing on the live server. **One-click rollback in <60 seconds.**
Deployment documented (not in one person's head). Infrastructure as code
(repeatable, version-controlled, deterministic). Env vars managed properly (not
a committed `.env`). Maps to D4 (DevOps), D11 (Demo-vs-Prod).

## L6 — Cloud and compute
Know your platform's limits before they bite. **The free tier is not
production** (e.g. Vercel Hobby: 10s timeout, 1MB response, no background jobs).
When feature complexity exceeds platform limits, split the stack: front-end on
Vercel, back-end + background jobs on Railway/Render/Fly. Persistent servers for
long-running work; managed Postgres/Redis; a background-job runner (Inngest,
Trigger.dev, BullMQ); cron; WebSockets where needed. Understand cold-start
penalties. Maps to D4, D10 (Cost).

## L7 — CI/CD and version control
Git, no direct production edits. **Main = production; never commit directly,
always branch.** Automated pre-merge checks: compiles, tests pass, no security
vulns — pipeline blocks the merge if any fail. Rollback to last-good in one
command. Auto-deploy on merge. Code review (human or AI). Semantic versioning +
changelog. **One commit = one feature** (atomic); never 47 changes in one
deploy. Maps to D4.

## L8 — Security and Row-Level Security
RLS on every user-data table. Server-side input validation. **Parameterized
queries always** (SQL injection, `H7`). XSS prevention (86% of AI-generated
code fails this — `FM-3`). CSRF protection. Log-injection prevention (88%
vulnerable). **No secrets in front-end code, ever** (`H11`). Automatic secret
scanning in CI (GitGuardian, TruffleHog). Dependency vuln scanning (Snyk,
GitHub code scanning, `npm audit`). Run the manual auth tests in `CHK-4`.
Rotate any key ever exposed. Unique API keys per environment. Privacy policy +
ToS + GDPR/CCPA (opt-in, delete-on-request, export). Maps to D1, D8
(Compliance).

## L9 — Rate limiting
Protect against scraping / DDoS / brute force / cost-blowout. **Rate-limit the
AI endpoints first (most expensive), then auth, then public data.** Real users
do 2-5 req/min; bots do hundreds (easy to detect). Tools: Vercel built-in,
Upstash serverless Redis. ~5-minute setup that can save thousands when a bot
hits a paid API (`FM-5`, `H10`). Separate limits per tier; graceful degradation
over hard block. Maps to D1, D10.

## L10 — Caching and CDN
Three layers: **browser** (static assets), **CDN** (API responses — even a
60-second cache cuts DB calls ~95% during spikes), **application** (expensive
queries + AI calls). **Semantic caching** for similar AI questions
(embedding-based, not exact match): 40-60% hit rate typical — 1 user asks, the
next 19 get the cached answer instead of 20 API calls. Cache-invalidation
strategy (time-based or manual). Multi-region read replicas for DB reads with
geo-aware routing. Maps to D5 (Performance).

## L11 — Load balancing and scaling
**Connection pooling** — share DB connections, don't open one per request
(Supabase: port 6543 pooled, not 5432 direct; pgbouncer self-hosted; transaction
mode for serverless). Queue expensive operations (async, not synchronous).
Auto-scaling where supported. Handle 100 concurrent users without falling over.
Prevent cold-start stampedes. Respect external API rate limits. **Load test
before launch** (k6, Artillery — ~30-min setup; simulate 100 users to find the
cliffs before users do, `FM-1`). Maps to D5.

## L12 — Error tracking and logs
**Structured logging** (timestamps, user IDs, request IDs) — not `console.log`.
Centralized, searchable aggregation. Log levels (debug/info/error). **An error
tracker (Sentry)** that catches every error in real time with stack trace + which
users were affected, and alerts when errors spike. **Uptime monitoring** that
pings every 5-30 min and tells you the app is down before users do. Performance
metrics (latency, query time). Audit trails for sensitive ops. Without this you
debug by archaeology (`FM-15`). Maps to D7 (Reliability), D12 (Missing).

## L13 — Availability and recovery
Automated backups with **tested restores**. A one-page **incident runbook**
written during calm time (what to check first: hosting dashboard, DB, deploy
logs, rollback). Uptime monitoring + immediate alert. RTO/RPO defined. Fallback
strategies + circuit breakers for external-service failures; graceful
degradation (message, not blank screen). Health checks on critical endpoints.
**Canary deployments** (5% traffic first, watch errors, promote). **Feature
flags** for instant "rollback" without redeploy. Maps to D7, D4.

---

# FM — Recurring failure modes of vibe-coded apps

Each: symptom → root cause → fix. Numbers are Matt's.

- **FM-1 Scaling cliff.** Works at 10 users, slows at 100, crashes at 1,000. AI
  optimizes for "works," not "scales." Query 50ms@100 rows → 30s@100k rows. Fix:
  indexes, connection pooling, caching, async, load testing. (L11)
- **FM-2 N+1 queries.** Each page load hits the DB 10+ times for the same data
  (loop-then-query instead of JOIN). Fix: JOINs, FK indexes, eager loading,
  caching. (L10, D5)
- **FM-3 XSS / unsanitized render.** 86% of AI code fails XSS defense; 88%
  vulnerable to log injection. Fix: sanitize (DOMPurify), escape output, CSP.
  (L8, H6)
- **FM-4 Secrets in front-end.** F12 → search "key" → find OpenAI/Stripe/DB
  creds in the JS bundle. Fix: server-side env vars + proxy route; rotate every
  exposed key (git history is permanent). (L2, L8, H11)
- **FM-5 No rate limiting.** A bot hits the API 10,000×/hour → $4,000 bill by
  lunch. Fix: rate-limit AI/auth/public endpoints; alert at 50%, kill at 90% of
  budget. (L9, H10)
- **FM-6 Happy-path only / no error handling.** Card declines → blank screen.
  Fix: try-catch on external calls, error state per component, user-facing
  messages, retry with backoff. (L1, L12)
- **FM-7 Unvalidated input / SQLi.** Apostrophe in a name → DB error. Fix:
  server-side validation, parameterized queries, length limits. (L8, H7)
- **FM-8 No tenant isolation (IDOR).** Change the URL id → see another user's
  data. Fix: RLS on every user-data table; tenant id on every row; re-derive
  identity from the auth token, never from a body/query param. (L4, H1, B8)
- **FM-9 Sync heavy operation.** "Export" runs 45s inline → timeout → user
  re-clicks → 2 PDFs. Fix: return a job id immediately, process in background,
  idempotency key, progress indicator. (L6, B16, B18)
- **FM-10 Uncontrolled API cost.** $50/mo → $4,000/mo because everything calls
  the top model. Fix: semantic cache (40-60%), route by complexity (cheap model
  for simple tasks → ~70% savings), batch/debounce, spend caps + alerts. (L9,
  L10, D10)
- **FM-11 47-column table.** Queries take 8s; users leave at 2s. Fix: normalize,
  index, partition. (L3)
- **FM-12 Prayer deployment.** Push to main → everyone gets it instantly; if
  broken, everyone's broken at 2am. Fix: staging, canary, feature flags,
  one-click rollback. (L5, L13)
- **FM-13 Demo-trap testing.** Works on your machine with your data; real
  signup crashes. Fix: test old phones / slow networks / Safari; the 5-strangers
  test (`CHK-3`). (L1, D11)
- **FM-14 No logging.** App breaks in prod, you have no logs, you guess. 14% of
  one app's requests threw silent errors for 3 months. Fix: structured logs +
  error tracking. (L12)
- **FM-15 Unrotated secrets.** A key in git from 6 months ago is still live →
  infinite blast radius. Fix: automated rotation every 30 days; dual-key
  rotation for zero downtime. (L8, B20-class)
- **FM-16 Concurrent edit data loss.** A saves, B saves, A's changes vanish.
  Fix: CRDTs (Yjs) / operational transforms / event sourcing; last-write-wins
  only for low-collab apps. (L3)
- **FM-17 Unscaled DB.** 20ms queries become 4-5s at 10M rows. Fix: indexes →
  partitioning → sharding (in that order, only when monitoring proves need). (L11)
- **FM-18 No geographic distribution.** Singapore users wait 3-5s on a Virginia
  server. Fix: edge front-end (Vercel/Cloudflare), regional read replicas,
  geo-aware routing. (L10)
- **FM-19 Env-var entropy.** Deploy works Mon, breaks Tue, works Wed. Fix: IaC +
  deterministic CI builds; secrets in a manager, not committed. (L5, L7, B5)
- **FM-20 CVE explosion.** 847 deps, 12 critical CVEs, abandoned packages. 20%
  of phantom-package references are unregistered malware (slop-squatting). Fix:
  `npm audit`, commit lockfile, monthly dependency audit, CI scanning. (L8)
- **FM-21 Missing caching on hot path.** Same data fetched 10,000×/day; DB
  slammed, bill skyrockets. Fix: the 3-layer cache (`L10`). (B17)
- **FM-22 Optimistic UI without rollback.** UI shows success; server call fails;
  UI never reverts. Fix: onError rollback path. (B10)
- **FM-23 Webhook without idempotency.** Provider retries → double-charge. Fix:
  dedup table keyed `(provider, event_id)`, checked in the same transaction.
  (B11)
- **FM-24 No SOC2 / compliance readiness.** Enterprise asks for SOC2, you have
  none, they walk. Fix: continuous compliance monitoring (Vanta/Drata),
  automated evidence collection. (D8)
- **FM-25 Demo-vs-production gap.** The demo impresses; the real customer hits
  every unhandled path. The gap is 100 boring things done right (`CHK-5`). (D11)

---

# CHK — Checklists

## CHK-1 — 30-minute security self-audit
1. Run `npm audit` (one command, shows all known vulns).
2. Auth boundary test: log in as User A, change the id in the URL — can you see
   User B's data? If yes, it's broken.
3. Secret review: any key in the codebase / `.env` / front-end bundle? If yes,
   rotate it.

## CHK-2 — Production-ready deployment
Test in staging (PR preview) → review the diff → merge to main → auto-deploy →
canary to 5% → watch error rates 15 min → rollback instantly on spike, else
promote to 100%. Use feature flags for instant disable without redeploy.

## CHK-3 — Before you launch (3 steps)
1. Give it to 5 people you did **not** build it for; watch where they get stuck
   (30s to figure out a screen = ready).
2. Break it on purpose: blank form, 10,000 chars, submit 47×, old phone, Safari.
3. Add the boring stuff: error/loading/empty states, password reset, ToS,
   privacy policy, GDPR delete button.

## CHK-4 — Manual auth tests (each "yes" = breach)
- Copy your URL/session after logout, paste it back → still works?
- Change the user id in the URL/request → see another user's data?
- Change the `org_id`/tenant in the request body → access another tenant?
- Change the role claim in the JWT → reach admin endpoints?

## CHK-5 — The "100 boring things" (demo → product)
Error messages, loading states, empty states, success confirmations, password
reset, email verification, ToS + privacy policy, GDPR delete/export, input
validation, rate limits, retries, idempotency, monitoring, backups, rollback,
staging parity. The product is the demo plus these.

---

# PRIN — Cross-cutting principles

- **PRIN-1 Vibe-code to 80%, engineer the last 20%.** AI generates working
  features (the fun 80%); production finishing — security, error handling,
  logging, deployment, compliance — is the job (the last 20%).
- **PRIN-2 Demo vs product.** A demo impresses; a product serves. The difference
  is edge cases, real users, real conditions — the 100 boring things.
- **PRIN-3 Scale phases need different skills.** 0-1k users: build features.
  1k-10k: reliability, monitoring, pooling. 10k-100k: architecture, sharding,
  multi-region, cost engineering.
- **PRIN-4 Continuous over discrete.** Not "one security audit" but scanning on
  every commit; not "back up once" but automated backups with tested restores;
  not "rotate manually" but every-30-days automation.
- **PRIN-5 Observability is not optional.** If you can't see it, you can't fix
  it. Logging is operating vs. hoping.
- **PRIN-6 Readiness first, automation second.** Don't deploy intelligence into
  chaos — map data, workflows, ownership before adding agents. Automating
  dysfunction scales dysfunction.
- **PRIN-7 Secrets are fragile.** Any key ever exposed (even historically in
  git) must be rotated. Automated rotation bounds the blast radius.
- **PRIN-8 Failure is not optional, recovery speed is.** Something will break;
  the question is how fast you recover. Runbooks, rollback, RTO/RPO matter.

---

# Notes for tools that consume this file

- The `vibe-to-prod` skill walks L1-L13 as a guided self-check and emits a
  per-layer PASS/GAP scorecard, citing `FM-*`/`CHK-*` for each gap.
- Audit domains cite specific anchors in their "Vibe-coding specific checks"
  subsection; they do not duplicate the content here.
- `H10` ↔ `FM-5`/`L9`; `H11` ↔ `FM-4`/`L8`; `B16` ↔ `FM-9`; `B17` ↔ `FM-21`;
  `B18` ↔ `FM-9`/`FM-23`; `B19` ↔ `FM-6`/`L1`.
