---
name: checklist-design-app-audit
description: Audit websites, web apps, mobile apps, design systems, and user flows against the full public Checklist Design corpus. Use for comprehensive or targeted product/UI/UX audits, source-linked inspiration comparisons, evidence-backed scoring, and remediation plans.
---

# Checklist Design App Audit

Audit an application against Checklist Design's full public checklist universe while preserving applicability, evidence, provenance, freshness and inspiration/source boundaries.

## Trigger

Use this skill when the user asks to:

- audit, review, grade or “audition” an app against Checklist Design
- check whether a website, web app, mobile app, component library or flow covers expected UX elements
- compare an app screen with Checklist Design inspiration or documentation examples
- generate a comprehensive UI/product quality checklist with evidence and remediation

For exploratory defect finding beyond this corpus, also load the `dogfood` skill. Checklist Design coverage does not replace accessibility, security, performance or domain-specific audits unless the selected source criteria explicitly cover them.

## Bundled assets

```bash
SKILL_DIR="${CLAUDE_SKILLS_ROOT:-$HOME/.claude/skills}/checklist-design-app-audit"
DATA="$SKILL_DIR/references/checklists.json"
CLI="$SKILL_DIR/scripts/checklist_audit.py"
COLLECTOR="$SKILL_DIR/scripts/scrape_checklist_design.py"
```

- `references/checklists.json`: normalized, validated snapshot
- `references/README.md`: provenance, schema, counts and refresh notes
- `scripts/checklist_audit.py`: bounded search, inventory and packet generator
- `scripts/scrape_checklist_design.py`: public read-only refresh collector

## Source and usage boundary

- Treat Checklist Design as authoritative for its checklist wording and reference links.
- Cite the canonical `source_url`, dataset capture time and content hash.
- Do not claim the source criteria are exhaustive, legally binding or independently validated.
- The source terms route was unavailable when this snapshot was built; assume no redistribution license.
- Use the corpus internally for audits. Preserve attribution. Do not publish or re-host the dataset or inspiration images without permission.
- Inspiration images remain remote links. Load individual images only when they are relevant to the current audit.
- Inspiration is a design reference, not a compliance requirement. Never pass/fail an item solely because an app looks similar or different.

## Modes

### Comprehensive mode — default for “all checklists”

1. Generate an applicability inventory covering all 110 checklist keys.
2. Inspect the target and decide `applicable`, `not_applicable`, or `needs_evidence` for every key.
3. Give a route/surface and rationale for every decision.
4. Generate the detailed packet only for the applicable keys.
5. Audit every item in that packet.

Do not interpret “all checklists” as blindly applying irrelevant mobile, web, design-system and flow criteria to every target. Completeness means all 110 receive an applicability decision; all applicable criteria are then tested.

### Targeted mode

Use when the user names a screen, component or flow. Search the corpus, show the proposed keys, then audit those keys plus directly implicated related/cross-platform checklists.

## Quick commands

Inspect freshness and counts:

```bash
python3 "$CLI" stats
```

Search without loading the full JSON into context:

```bash
python3 "$CLI" search "login authentication password" --limit 12
python3 "$CLI" search "pricing plan checkout" --category website --limit 12
```

Inspect one record:

```bash
python3 "$CLI" show website/login --format markdown
```

Generate the all-110 applicability inventory:

```bash
python3 "$CLI" inventory \
  --app-name "APP NAME" \
  --target "TARGET URL OR BUILD" \
  --format json \
  --output /absolute/path/applicability.json
```

Generate a detailed packet after applicability review:

```bash
python3 "$CLI" packet \
  --keys 'website/login,design-system/input-field,flows/resetting-password' \
  --app-name "APP NAME" \
  --target "TARGET URL OR BUILD" \
  --format markdown \
  --output /absolute/path/audit.md
```

## Audit workflow

### 1. Freeze the target

Record:

- app/build name and version if available
- authoritative URL, repository or artifact
- authenticated vs public state
- desktop/mobile viewport(s)
- test account constraints
- audit timestamp

Inspect the direct source first. Do not use prior session descriptions as proof of current app behavior.

### 2. Check corpus freshness

Run `stats`. Use `source.scraped_at_utc` and `content_sha256` in the final report. If the user requests a current audit and the snapshot is materially stale, refresh it with the collector, validate the result, and state what changed. Do not refresh merely to change a timestamp.

### 3. Inventory the target

Use browser or app tooling to enumerate real surfaces before selecting checklists:

- public website pages
- authenticated web-app screens
- mobile-only surfaces
- reusable components and foundations
- multi-step user flows
- state variants: empty, loading, success, failure, disabled, permission denied and recovery

Capture URLs/routes, viewports and screenshots. Read browser console output for runtime errors. Exercise interactions rather than judging only the initial frame.

### 4. Complete all-110 applicability

Generate `inventory`. For each key:

- `applicable`: the target contains or should contain that surface/component/flow
- `not_applicable`: clearly outside product scope; include a concise reason
- `needs_evidence`: insufficient access or evidence; never silently treat as not applicable

Map each applicable key to concrete target routes/screens/components. Unknown or inaccessible surfaces stay `needs_evidence`.

### 5. Select exact checklist keys

Use `search`, `list`, `show`, related links and same-name cross-platform variants. Common mappings:

- **Website**: public marketing, legal, content, commerce and acquisition pages
- **Web app**: authenticated product surfaces and account management
- **Mobile app**: native/mobile patterns and screens
- **Design system**: components and foundations visible in the target
- **Flows**: multi-step interactions and recovery paths

A surface usually needs more than one key. Example: login may require `website/login` or `web-app/login`, plus `design-system/input-field`, `design-system/button`, `flows/showing-input-error`, `flows/resetting-password`, and possibly `flows/verifying-account`.

### 6. Generate the detailed packet

Pass only exact applicable keys to `packet`. Keep the unmodified generated packet as the audit working document so audit IDs and source wording remain stable.

### 7. Test every item with evidence

Allowed statuses:

- `pass`: fully demonstrated in the tested state
- `partial`: present but incomplete, inconsistent or state-dependent
- `fail`: absent, broken or materially contradicts the criterion
- `not_applicable`: only with a concrete scope reason
- `not_tested`: evidence unavailable or test not run

Every pass, partial and fail must include:

- target route/screen/component
- viewport/device
- screenshot, DOM, console or interaction evidence
- concise finding
- recommended change for partial/fail

Never infer a pass from implementation intent, route names, design files or source code alone when runtime behavior can be tested.

### 8. Use inspiration and documentation correctly

For applicable records with resources:

1. Load the exact remote `image_url` with `vision_analyze` only when comparison is useful.
2. Record the source page and image URL.
3. Extract transferable principles: hierarchy, grouping, state communication, affordances, spacing, responsive behavior and interaction clarity.
4. Compare those principles with the target evidence.
5. Label unavailable or stale images; do not invent their content.
6. Do not copy brand assets, proprietary layouts or visual identity.

Design-system `documentation` resources are explanatory examples. Flow `flow_step` resources are both ordered audit steps and visual references. Website/web-app/mobile `inspiration` resources are optional references.

### 9. Score without hiding uncertainty

Compute the compliance score over applicable tested items only:

```text
score = (pass + 0.5 × partial) / (pass + partial + fail) × 100
```

Report separately:

- pass / partial / fail
- not applicable
- not tested
- applicability coverage: decided keys / 110
- evidence coverage: tested applicable items / applicable items

Do not convert `not_tested` into pass, fail or not applicable. Impact severity is an auditor judgment based on user/business consequences; it is not supplied by Checklist Design and must be labeled as such.

### 10. Deliver the report

Put large audits under `~/.claude/reports/app-audits/<app>/<date>/` (or the project's requested report directory) and return the path. A complete report contains:

- executive summary and audit target
- source freshness/hash and limitations
- all-110 applicability coverage
- checklist/item scorecard
- blockers and highest-impact findings
- detailed evidence by stable audit ID
- inspiration/documentation comparisons where used
- prioritized remediation plan
- untested areas and required access

For phone consumption, use concise sections, short findings and linked evidence rather than wide tables.

## Quality gates

Before claiming completion, verify:

- corpus `validation.ok` is true
- all 110 keys have an applicability decision in comprehensive mode
- every applicable key appears in the detailed audit packet
- every applicable item has a terminal status
- every pass/partial/fail has evidence
- score denominator excludes not-applicable and not-tested items
- source freshness/hash and canonical URLs are present
- inspiration is cited and treated as reference, not copied or used as a pass/fail oracle
- browser console and key interactions were tested where accessible

## Pitfalls

- Do not load the 500+ KB JSON into the chat when `search`, `show` or `packet` can return a bounded subset.
- Do not audit only happy paths; inspect loading, empty, invalid-input, error and recovery states.
- Do not mark a checklist not applicable merely because its route was not found; distinguish missing evidence from product scope.
- Do not apply Website and Web app variants interchangeably without checking the target context.
- Do not treat flow screenshots as extra checklist items beyond their ordered flow-step text.
- Do not refresh aggressively; the collector uses public endpoints with retries and a deliberate delay.
- Do not publish the bundled source corpus or mirror remote images.
