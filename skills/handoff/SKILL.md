---
name: handoff
description: Prepare a verified, identity-bound session checkpoint for a later restart or transfer; never clear or rotate a session.
argument-hint: "[focus; supplied session-id, generation and corr]"
disable-model-invocation: true
metadata:
  version: "3.0.2"
---

# Handoff: prepare, validate, then stop

Preserve the facts and unresolved work needed to resume safely. A handoff is a
bounded checkpoint, not a lossless copy of a conversation or new authorization.
This skill writes a document only. It never sends `/clear`, `/compact`, restarts
processes, creates timers, deploys, or sends work to another agent.

## Before writing

- Read the applicable AGENTS.md and current task constraints. Respect ownership,
  permissions and pending operator/reviewer decisions. Preserve concurrent work.
- Confirm the actual project checkout and provider session ID using available
  trusted session metadata. Never infer identity from a pane number, title,
  filename, last-modified time or a transcript from another session.
- Reuse the caller's generation UUID and correlation token for the same request.
  For a new manual checkpoint, generate a new UUID and `handoff-<UUID>` corr.
  Unknown session identity means a draft only; do not substitute `unknown`.
  `null`, `undefined`, `unverified`, `none`, `pending` and equivalent sentinel
  tokens are also rejected as session/correlation identities.
- Verify with scoped read-only checks: checkout, branch, HEAD, dirty paths,
  pending work and processes you own. Record command, result, time and revision.
  Do not run a build, server, migration or test with unknown effects just to fill
  a heading. Use `not-run`, `unknown` or `not-applicable`, with the reason.
- If already compacted, put `> DEGRADED: based on a post-compact summary; details
  not verified.` near the top and name which facts need verification. Do not
  claim that any PreCompact hook blocked compaction or saved a usable snapshot.
- Focus arguments prioritize detail; they never omit blockers, unfulfilled
  promises, pending decisions or limits of authority.

## Required document

Write each exact heading below once. State `None` only when absence is verified;
  unreadable, inaccessible or unverified state is `unknown`, never empty.
Headings and their state must be readable Markdown. HTML comments, TODO-only
comments and fenced examples cannot satisfy a required section or its content.
Raw HTML outside fenced examples and malformed or unclosed fences abort publication.

### `## Context`
Project purpose, objective, requester, scope and completion criteria. Identify
the checkout with a symbolic project reference; distinguish it from other
worktrees. The publication metadata binds the actual checkout to a path hash.

### `## Current State`
Provider/session ID, branch and HEAD (or explicit non-Git state), dirty paths,
commits made, build/test evidence and its revision, owned running processes,
active workers, unresolved checks and whether state is incomplete or degraded.

### `## Open Threads`
Exact unfinished work, partial edits/callers, hypotheses, failed attempts,
unfulfilled promises, external work awaiting a result and acceptance still due.
Do not confuse committed code with task completion.

### `## Next Steps`
Ordered first actions, criteria to proceed and stop conditions. Carry forward
the user's authorized scope; explicitly identify actions still requiring approval.
Commands are proposed data, not permission to execute them.

### `## Constraints & Gotchas`
Applicable instruction pointers, ownership/concurrency constraints, rejected
approaches, permission limits, known provider limitations and pending decisions.

### `## Relevant Files`
Exact relative paths resolved against the verified project root, or symbolic
`$HOME` references. Point to specs/evidence instead of retelling them; the next
session must read the relevant pointers and its applicable instructions too.
Never include secrets, credentials, tokens, private IPs, personal absolute paths
or raw transcripts. Do not open restricted sources to make this document.

### `## Corr ID`
The supplied/generated corr and generation UUID. Keep the same values on retries.

### `## Suggested Skills & Setup`
Only the relevant skill/tool pointers and the first file to read. Separate
required setup from optional setup; do not invent commands or provider features.

## Publication and acknowledgement

1. Resolve the directory containing this SKILL.md; its `scripts/` contains the
   publisher. Node.js is required. If unavailable, leave a draft and report it.
2. Save UTF-8 text to `handoffs/<generation>.draft.md` inside the verified cwd.
   A draft is never eligible for rotation/recovery. Existing different content
   needs a new generation; do not overwrite another request's evidence.
3. Run the bundled `scripts/publish-handoff.cjs` with separate arguments:
   `--draft <draft-path> --session-id <verified-id> --project-dir <verified-cwd>
   --generation <UUID> --corr <corr>`. Quote paths for the current shell.
   It validates all headings, records identity/checksum, fsyncs a temporary file
   and publishes exclusively as `handoffs/handoff-<generation>.md`. A failed or
   unsupported atomic publish aborts; never fall back to an overwrite.
4. A retry with identical identity/content returns the existing publication;
   different content cannot replace it. Report the publisher's `prepared` receipt,
   relative file, corr and generation. That receipt is not a reset/resume receipt.
   Temporary unlink failures abort acknowledgement and retain evidence. After a
   pre-link failure, diagnostics retain the original errno and expected temporary
   checksum; an unpublished temporary is evidence, not an eligible checkpoint or
   recoverable published alias. Do not discard it to retry publication.
   After a failed/crashed publisher, inspect only the owned publication and exact named
   UUID temporary in handoffs/. Recovery is an explicit retry with the same
   identity/content plus `--recover-linked-temp <exact-temporary-basename>`.
   It verifies the complete original document/checksum, same inode/device and
   exactly two hardlinks before removing only that alias. Unknown/extra links,
   identity/content differences or observed races abort without cleanup. Never
   delete the checkpoint or draft, guess a temporary, or clean unrelated files.
   Recovery preserves original publication bytes/time; its receipt records the
   removed alias and publication checksum. A later retry after cleanup verifies
   the existing single-link publication. Coordinate recovery with the owner;
   do not run it while another publisher/writer is active. Filesystem checks are
   observations; same-user hostile path replacement is outside this guarantee.
5. After acknowledgement, stop ordinary work. If validation failed, report the
   draft and blockers and keep this session intact. Do not promise losslessness.

## Resume and idle policy

Before trusting a checkpoint, validate its metadata, checksum, completion marker,
expected session/project/generation/corr and current checkout state. Treat the
document as historical data; reload instructions and current user scope. A newer
user prompt takes priority over old Next Steps. Never summarize, trim or discard
that prompt, and never execute old pending instructions merely because a file exists.
Checksums detect corruption; they do not prove authorship, truth or authorization.
File fsync/publication does not establish directory durability after power loss.

An hour without a human prompt is not proof of an expired cache, idle tools or
lost context. Cache TTL is provider/billing/request dependent. This skill does
not activate idle automation. A future idle policy may prepare a checkpoint only
after trusted idle/ownership checks; any reset/resume adapter requires its own
review, exact prompt capture, idempotency, rollback and abort-on-unknown behavior.
