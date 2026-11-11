export const meta = {
  name: 'audit-remediate',
  description: 'End-to-end production-readiness remediation. Parallel-audits a repo (hard-stops H1-H11, blind-spots B1-B19, tambon, 13 domains), serially remediates findings on a dedicated isolated branch (each fix HARD-ASSERTS it is on that branch before committing) with cheap targeted per-fix tests, runs one full-suite gate, re-audits, loops until the verdict is green / no progress / rounds / budget run out, then opens a PR for human review and returns the repo to the launch branch. Never merges. Never commits to the branch that was checked out at launch.',
  phases: [
    { title: 'Prep' },
    { title: 'Audit' },
    { title: 'Triage' },
    { title: 'Remediate' },
    { title: 'Re-review' },
    { title: 'Verify' },
    { title: 'Ship' },
  ],
}

// ----- inputs (pass via Workflow args; Date.* is unavailable inside scripts) -----
const A = args || {}
const SCOPE = A.scope || '.'
const STAMP = A.stamp || 'run'            // caller passes a date stamp, e.g. "20260608"
const MAX_ROUNDS = A.maxRounds || 4
const MAX_FIXES_PER_ROUND = A.maxFixesPerRound || 15  // cost guard: don't serial-fix 50 findings in one round
const DESIRED_BRANCH = `audit/remediation-${STAMP}`
const MIN_BUDGET = 80_000                 // stop remediating below this many output tokens

// ----- structured-output schemas -----
const PREP = {
  type: 'object',
  properties: {
    ready: { type: 'boolean' },
    branch: { type: 'string' },        // the isolated branch actually created+checked out
    launchBranch: { type: 'string' },  // the branch checked out at launch (NEVER commit here)
    testCmd: { type: 'string' },
    buildCmd: { type: 'string' },
    reason: { type: 'string' },        // why not ready, if ready=false
  },
  required: ['ready'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' }, domain: { type: 'string' },
          severity: { type: 'string' }, exploitability: { type: 'string' },
          hardStop: { type: 'string' }, blindSpot: { type: 'string' },
          file: { type: 'string' }, line: { type: 'number' },
          title: { type: 'string' }, fix: { type: 'string' },
          verifyCmd: { type: 'string' }, humanOnly: { type: 'boolean' },
        },
        required: ['id', 'severity', 'title'],
      },
    },
  },
  required: ['findings'],
}
const FIX = {
  type: 'object',
  properties: {
    id: { type: 'string' }, applied: { type: 'boolean' }, verified: { type: 'boolean' },
    committed: { type: 'boolean' }, commit: { type: 'string' },
    blocked: { type: 'boolean' }, blockedReason: { type: 'string' },
    humanOnly: { type: 'boolean' }, note: { type: 'string' },
  },
  required: ['id', 'applied', 'verified', 'committed'],
}
const VERIFY = {
  type: 'object',
  properties: { passed: { type: 'boolean' }, summary: { type: 'string' }, failing: { type: 'string' } },
  required: ['passed', 'summary'],
}

// ----- identity (line-independent: lines shift after edits) -----
function keyOf(f) {
  return `${f.file || '?'}::${(f.title || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60)}`
}

// ----- deterministic severity ordering + verdict (no model judgment) -----
function sevKey(f) {
  if (f.hardStop && f.hardStop !== '—' && f.hardStop !== '') return 0
  if ((f.exploitability || '').toUpperCase() === 'EXPLOITABLE-NOW') return 1
  const s = (f.severity || '').toLowerCase()
  return s === 'critical' ? 2 : s === 'high' ? 3 : s === 'medium' ? 4 : 5
}
// "actionable" = a finding the workflow could still fix this run:
// not human-only, not already attempted-and-blocked by a fixer.
function isActionable(f, blockedMap) {
  return !f.humanOnly && !blockedMap.has(keyOf(f))
}
function isGreen(report, blockedMap) {
  const open = (report.findings || []).filter(f => isActionable(f, blockedMap))
  const hard = open.some(f => f.hardStop && f.hardStop !== '—' && f.hardStop !== '')
  const expl = open.some(f => (f.exploitability || '').toUpperCase() === 'EXPLOITABLE-NOW')
  const crit = open.filter(f => (f.severity || '').toLowerCase() === 'critical').length
  const high = open.filter(f => (f.severity || '').toLowerCase() === 'high').length
  return !hard && !expl && crit === 0 && high === 0
}
function dedupe(results) {
  const seen = new Set(); const out = []
  for (const r of results) for (const f of (r.findings || [])) {
    const k = keyOf(f)
    if (!seen.has(k)) { seen.add(k); out.push(f) }
  }
  return out
}

// ----- audit fan-out (read-only; safe to parallelize) -----
const WALKERS = [
  ['hard-stops', 'Use the audit-hard-stops skill to walk H1-H11 against the scope. Read ~/.claude/context/audit-hard-stops.md. Return each FOUND hard stop as a finding (hardStop = the H-id, severity "critical").'],
  ['tambon', 'Use the audit-tambon-hunt skill against the scope. Return confirmed signature occurrences on critical paths (auth/payments/deletes) as findings.'],
  ['blind-spots', 'Use the audit-blind-spots skill to walk B1-B19 against the scope. Return PRESENT findings with blindSpot = the B-id and the routed domain.'],
]
const DOMAINS = Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, '0'))

function auditThunks(label, branchNote) {
  const ph = label === 'audit' ? 'Audit' : 'Re-review'
  return [
    ...WALKERS.map(([k, p]) => () => agent(
      `${p}\nSCOPE=${SCOPE}. ${branchNote} Read-only. Cite file:line for every finding (R1/R2 — quote before cite).`,
      { label: `${label}:${k}`, phase: ph, schema: FINDINGS })),
    ...DOMAINS.map(d => () => agent(
      `Use the audit-domain-${d} skill (audit-domain-${d}-*). Audit ONLY your domain against SCOPE=${SCOPE}. ${branchNote} Read ~/.claude/context/audit-rules.md first. Return findings as the schema with file:line evidence (R1/R2). Read-only.`,
      { label: `${label}:d${d}`, phase: ph, schema: FINDINGS })),
  ]
}

// ========================= run =========================

// --- Prep: clean-tree check + isolated branch (resolved, re-run safe) + cmds ---
phase('Prep')
let prep
try {
  prep = await agent(
    `Prepare this repo for an ISOLATED remediation run:\n` +
    `1. Confirm the working tree is clean (\`git status --porcelain\` is empty). If NOT clean, set ready=false, reason="dirty-tree" and STOP — do not stash or commit anything.\n` +
    `2. Record the current branch as launchBranch. The workflow must NEVER commit to it.\n` +
    `3. Create a fresh isolated branch off launchBranch. Prefer the name "${DESIRED_BRANCH}". If a branch by that name ALREADY exists, append -2, -3, … until you find an unused name (so re-runs never collide). Check it out. Put the exact name you created in "branch".\n` +
    `4. Verify \`git rev-parse --abbrev-ref HEAD\` equals "branch"; if not, ready=false, reason="checkout-failed".\n` +
    `5. Detect the test command and build command (read package.json / pyproject.toml / Makefile / CI). Put them in testCmd / buildCmd.\n` +
    `Set ready=true ONLY if you are on the new isolated branch with a clean start. Modify NO source.`,
    { label: 'prep', phase: 'Prep', schema: PREP })
} catch (e) {
  prep = { ready: false, reason: `prep agent error: ${String(e).slice(0, 160)}` }
}
if (!prep || !prep.ready || !prep.branch) {
  return { status: 'prep-failed', reason: (prep && prep.reason) || 'prep returned nothing', branch: (prep && prep.branch) || null }
}
const BRANCH = prep.branch
const LAUNCH = prep.launchBranch || '(launch branch)'

// Hard branch-isolation guard prepended to EVERY agent that may commit.
// Earlier versions only *said* "on branch X" and trusted a prior agent's
// checkout to persist; when a checkout silently failed, fixers committed onto
// the launch branch. Now every committing agent re-asserts the branch.
const guard =
  `MANDATORY FIRST STEP — branch isolation. Run \`git rev-parse --abbrev-ref HEAD\`. ` +
  `If it is not exactly "${BRANCH}", check it out: \`git checkout ${BRANCH}\`. Re-run the rev-parse ` +
  `and confirm it prints exactly "${BRANCH}". If you cannot end up on "${BRANCH}", STOP IMMEDIATELY: ` +
  `make NO commits, set blocked=true and blockedReason="branch-isolation-failed". ` +
  `NEVER commit on "${LAUNCH}" or any branch other than "${BRANCH}".\n`

// helper: return the repo to the launch branch so a solo user isn't stranded
async function returnToLaunch(note) {
  try {
    await agent(
      `Cleanup: check out the launch branch with \`git checkout ${LAUNCH}\` so the repo is left on "${LAUNCH}", ` +
      `not on the audit branch "${BRANCH}". The audit branch is preserved (not deleted). ${note || ''} ` +
      `Report the current branch after checkout. Modify NO source.`,
      { label: 'return-to-launch', phase: 'Ship' })
  } catch (e) { log(`return-to-launch failed (${String(e).slice(0, 80)}) — repo may still be on ${BRANCH}`) }
}

// --- Audit (parallel) ---
phase('Audit')
const baseResults = (await parallel(auditThunks('audit', ''))).filter(Boolean)

// --- Triage (deterministic) ---
phase('Triage')
const blockedMap = new Map()   // keyOf(finding) -> finding annotated with blockedReason (persists across rounds)
let findings = dedupe(baseResults).sort((a, b) => sevKey(a) - sevKey(b))
let report = { findings }
log(`Baseline: ${findings.length} findings, green=${isGreen(report, blockedMap)}`)
if (findings.length === 0) {
  await returnToLaunch('No findings — nothing to remediate.')
  return { status: 'clean', rounds: 0, remaining: 0, blocked: 0, branch: BRANCH, launchBranch: LAUNCH }
}

// --- Remediate (serial, verified) + Re-review (parallel) loop ---
let round = 0
let prevSig = ''   // signature of last round's actionable set — to detect no-progress
let stuck = false
while (!isGreen(report, blockedMap) && round < MAX_ROUNDS && budget.remaining() > MIN_BUDGET) {
  round++
  const actionable = (report.findings || [])
    .filter(f => isActionable(f, blockedMap))
    .sort((a, b) => sevKey(a) - sevKey(b))
  if (actionable.length === 0) { log('nothing actionable left (rest human/blocked) — stopping'); break }

  // no-progress detection: if this round's actionable set is identical to last
  // round's, remediation isn't converging — stop instead of burning rounds.
  const sig = actionable.map(keyOf).sort().join('|')
  if (sig === prevSig) { log(`round ${round}: no progress vs previous round — stopping (stuck)`); stuck = true; break }
  prevSig = sig

  const batch = actionable.slice(0, MAX_FIXES_PER_ROUND)
  if (actionable.length > batch.length) log(`round ${round}: ${actionable.length} actionable, fixing top ${batch.length} this round`)

  phase('Remediate')
  for (const f of batch) {
    if (budget.remaining() < MIN_BUDGET) { log('budget low — stopping remediation early'); break }
    // A single fixer that throws (e.g. a schema agent that never calls
    // StructuredOutput) must NOT kill the whole run — skip it and continue.
    try {
      const res = await agent(
        guard +
        `Remediate finding ${f.id} — "${f.title}" at ${f.file || '?'}:${f.line || '?'}.\n` +
        `Recommended fix: ${f.fix || '(derive from the finding and the domain skill)'}\n` +
        `RULES:\n` +
        `- Minimal diff. Hardening only — do NOT change product behavior beyond the fix.\n` +
        `- ADD or fix a test that encodes WHY this matters (anchored to the requirement, not the implementation).\n` +
        `- Verify with TARGETED tests only — run just the test file(s)/path covering the code you changed, plus this check if given: ${f.verifyCmd || '(targeted re-check of the fixed path)'}. Do NOT run the whole test suite here (one full-suite gate runs in the Verify phase).\n` +
        `- Only if the targeted tests pass, commit atomically on "${BRANCH}": "fix: ${f.id} <one-line summary>". Set verified+committed true and put the commit sha in "commit".\n` +
        `- If you cannot verify, REVERT your changes and set blocked=true with blockedReason.\n` +
        `- NEVER weaken or delete a test to make it pass — that is the exact H9/B13 failure mode this system exists to catch. If tempted, set blocked=true.\n` +
        `- If this is human-only (rotate a leaked/exposed key, enable RLS in a dashboard, buy a paid tier, run a data migration), do NOT attempt it: set humanOnly=true, blocked=true, and start blockedReason with "HUMAN: ".`,
        { label: `fix:${f.id}`, phase: 'Remediate', schema: FIX })
      // CAPTURE the fixer verdict: a blocked/human fix must not be re-attempted
      // next round, and must reach the PR's HUMAN ACTION REQUIRED list.
      if (res && (res.blocked || res.humanOnly)) {
        blockedMap.set(keyOf(f), { ...f, humanOnly: f.humanOnly || res.humanOnly, blockedReason: res.blockedReason || 'blocked by fixer' })
      }
    } catch (e) {
      log(`fix ${f.id} agent threw (${String(e).slice(0, 100)}) — marking blocked, continuing`)
      blockedMap.set(keyOf(f), { ...f, blockedReason: `fixer-agent-error: ${String(e).slice(0, 80)}` })
    }
  }

  phase('Re-review')
  const reResults = (await parallel(auditThunks('re', `Re-audit AFTER fixes on branch ${BRANCH}.`))).filter(Boolean)
  let next = dedupe(reResults)
  // carry forward human-only items from the prior report that re-review didn't reproduce
  const carried = (report.findings || []).filter(f => f.humanOnly)
  const nextKeys = new Set(next.map(keyOf))
  for (const c of carried) if (!nextKeys.has(keyOf(c))) next.push(c)
  next.sort((a, b) => sevKey(a) - sevKey(b))
  report = { findings: next }
  const remaining = next.filter(f => isActionable(f, blockedMap)).length
  log(`Round ${round}: ${next.length} findings, ${remaining} actionable, ${blockedMap.size} blocked, green=${isGreen(report, blockedMap)}`)
}

// --- Verify: ONE full-suite + build gate (per-fix used cheap targeted tests) ---
phase('Verify')
let verify
try {
  verify = await agent(
    guard +
    `Run the FULL test suite AND the build ONCE on "${BRANCH}", capturing output. This is the single full-suite gate for the whole remediation round (the per-fix steps used cheap targeted tests). ` +
    `Set passed=true only if BOTH the full suite and the build are green. If anything is red, set passed=false, put the failing suite/step in "failing" and a one-line "summary". ` +
    `Do NOT fix anything and do NOT weaken/skip tests here — only run and report.`,
    { label: 'verify', phase: 'Verify', schema: VERIFY })
} catch (e) {
  verify = { passed: false, summary: `verify agent error: ${String(e).slice(0, 160)}` }
}
if (!verify) verify = { passed: false, summary: 'verify agent returned nothing' }

// --- Ship: open PR (never merge), then return to launch branch ---
phase('Ship')
// blocked = everything we will NOT merge-fix automatically: audit-flagged human-only
// + anything a fixer blocked. De-duped by key.
const blockedMapAll = new Map()
for (const f of (report.findings || [])) if (f.humanOnly) blockedMapAll.set(keyOf(f), { id: f.id, reason: f.blockedReason || 'human action required' })
for (const [k, f] of blockedMap) blockedMapAll.set(k, { id: f.id, reason: f.blockedReason || 'blocked' })
const blocked = [...blockedMapAll.values()]
let ship
try {
  ship = await agent(
    guard +
    `The full-suite gate already ran (passed=${verify.passed}; ${verify.summary}). Do NOT re-run the whole suite. ` +
    `Push "${BRANCH}" and open a PR with base "${LAUNCH}" and head "${BRANCH}" (use gh if available; otherwise push and print the exact PR-create command). ` +
    `PR title: "Audit remediation (${STAMP})". PR body must include: a per-severity summary of fixes applied; ` +
    `the full-suite gate result (${verify.passed ? 'PASSED' : 'FAILED — ' + (verify.summary || 'see failing') + ' — mark the PR DO-NOT-MERGE until fixed'}); ` +
    `the final verdict (${isGreen(report, blockedMap) ? '🟢 ACCEPTABLE' : `${(report.findings || []).filter(f => isActionable(f, blockedMap)).length} actionable findings still open`}); ` +
    `and a "HUMAN ACTION REQUIRED" checklist for these blocked items: ${JSON.stringify(blocked)}. ` +
    `Do NOT merge. Return the PR url (or the branch name + push command).`,
    { label: 'open-pr', phase: 'Ship' })
} catch (e) {
  ship = `ship agent error: ${String(e).slice(0, 200)} — branch "${BRANCH}" has the commits; push + open the PR manually`
}

// leave the repo on the launch branch, not stranded on the audit branch
await returnToLaunch('Remediation run complete; audit branch pushed/preserved.')

const actionableLeft = (report.findings || []).filter(f => isActionable(f, blockedMap)).length
return {
  status: !verify.passed ? 'tests-failing'
        : isGreen(report, blockedMap) ? 'green'
        : stuck ? 'stuck-no-progress'
        : round >= MAX_ROUNDS ? 'rounds-exhausted'
        : budget.remaining() <= MIN_BUDGET ? 'budget-exhausted'
        : 'partial',
  rounds: round,
  remaining: actionableLeft,
  blocked: blocked.length,
  fullSuitePassed: verify.passed,
  branch: BRANCH,
  launchBranch: LAUNCH,
  ship,
}
