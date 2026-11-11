---
name: audit-domain-06-ux-a11y
description: Audit the UI/UX and accessibility domain — error states, loading states, form validation, keyboard nav, ARIA, color contrast, mobile responsiveness. Run as part of /audit Phase E.
---

# Skill: Audit Domain 6 — UI/UX & Accessibility

This skill audits one specific domain. It runs in an isolated subagent
context spawned by the audit-orchestrator. The subagent loads this
skill and the audit rules, runs against the audit scope, and returns
a ~2K-token findings report.

## Pre-flight

```
view ~/.codex/context/audit-rules.md
```

If you have findings from previous audit phases (hard stops, Tambon,
blind spots), the orchestrator passes them as input. Use them — don't
re-discover findings other phases already produced. Specifically:

- Hard stops related to this domain: H6
- Blind spots that route to this domain: B10, B19

If the orchestrator didn't pass you these inputs, do NOT re-run the
hard-stops or blind-spots walks. Audit your domain only and trust the
orchestrator to stitch.

## Scope

Error states, loading states, empty states, form validation feedback, keyboard navigation, ARIA labels, semantic HTML, color contrast, mobile responsiveness, internationalization readiness.

## Key questions to answer

For each, find the evidence and report it. The questions are the
audit's spine — every finding maps back to one of them.

1. Are error states designed (not just 'something went wrong')?
2. Are loading states present, or does the UI freeze during async ops?
3. Are empty states designed (not just blank screens)?
4. Is the app keyboard-navigable end to end?
5. Are interactive elements semantic (button, a, input — not div with onClick)?
6. Does color contrast meet WCAG AA?
7. Does the app work on a 320px-wide screen?
8. Does it have the "feel" details of a polished app (cmd+K, undo toasts, optimistic updates, safe areas, tabular numbers...)? List: `references/feel-20.md`.

### Vibe-coding specific checks (production-readiness)

Cite the playbook for depth: view ~/.codex/context/production-readiness-playbook.md

- Every data-driven component handles all FOUR states: loading, error, empty, success — empty/error are most often missing (playbook L1, FM-6, B19).
- Edge-case input is handled: apostrophes, 10,000 chars in a small field, emojis, blank required fields (playbook L1, CHK-3).
- Optimistic UI updates have a rollback path on server error (playbook B10).


## Mandatory enumeration before verdict

Before writing a finding or a "no findings" verdict for Q1, Q2, Q3, Q4, Q5, Q6, Q7, or Q8, produce the inventories below. Do not answer from memory. For every match, read the surrounding code and classify it in the requested bucket; include inventory counts and representative path:line evidence in the domain report.

### Q4/Q5 interactive-element accessibility inventory (mandatory)

Run:

```bash
rg -n "(<div[^>]+onClick|<span[^>]+onClick|onKeyDown|onKeyUp|onClick|role=|aria-|tabIndex|<button|<a\s|<input|<select|<textarea)" -g '*.{tsx,jsx,html,vue,svelte}' .
find . -type f \( -name '*.tsx' -o -name '*.jsx' -o -name '*.html' -o -name '*.vue' -o -name '*.svelte' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every interactive element missing aria-* or role attributes as `accessible`, `missing-label`, or `missing-role`. Verdict requirement: Q4 and Q5 are not safe until non-semantic click targets and unlabeled controls are classified.

### Q1/Q2/Q3 state coverage inventory (mandatory)

Run:

```bash
rg -n "(error|Error|isError|loading|isLoading|pending|spinner|skeleton|empty|No results|try again|toast|alert)" -g '*.{tsx,jsx,ts,js,html,vue,svelte}' .
find . -type f \( -name '*Error*' -o -name '*Loading*' -o -name '*Empty*' -o -name '*State*' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify every async/user-facing workflow as `has-error-loading-empty`, `missing-error`, `missing-loading`, or `missing-empty`. Verdict requirement: Q1-Q3 need this state inventory before a no-finding verdict.

### Q6/Q7 responsive and contrast inventory (mandatory)

Run:

```bash
rg -n "(#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|text-|bg-|color:|background:|min-width|max-width|@media|sm:|md:|lg:|overflow|whitespace-nowrap)" -g '*.{css,scss,sass,less,tsx,jsx,html,vue,svelte}' .
find . -type f \( -name '*.css' -o -name '*.scss' -o -name 'tailwind.config.*' -o -name '*.tsx' -o -name '*.jsx' \) -not -path './node_modules/*' -not -path './.git/*'
```

Classify each visual risk as `wcag-aa-evidence`, `contrast-unclear`, `mobile-safe`, or `mobile-overflow-risk`. Verdict requirement: Q6 and Q7 are not safe until contrast and 320px layout risks have been inventoried.
### Q8 "feel" inventory (mandatory)

Checklist and per-item owner: `references/feel-20.md` (the operator's 20 details). Run the block
below; counts are per row. Examples are React/Next; the patterns also match plain HTML/CSS/Vue/Svelte.
The `r` helper excludes generated output; in PowerShell define the same function with `rg`. A zero count means the detail is absent:
the finding says **add it**, names the design skill, and does not re-explain the technique.

```bash
r() { rg -n "$@" -g '*.{tsx,jsx,ts,js,html,vue,svelte,css,scss}' -g '!{node_modules,dist,build,.next,out,backups,archived-reports,fases-completas,artifacts,coverage,.git}/**' .; }
r -i "cmdk|CommandDialog|CommandMenu|kbar|useHotkeys|<kbd|metaKey.{0,40}['\"]k['\"]"   # cmdk + kbd hints
r "placeholder=.blur|blurDataURL|blurhash|thumbhash|lqip"                                # blur placeholders
r "one-time-code"                                                                        # OTP autofill
r "corner-shape|squircle|superellipse"                                                   # continuous corners
r "startViewTransition|view-transition-name|@view-transition"                            # view transitions
r "window\.confirm|[^.\w]confirm\("                                                      # native confirm pop-ups (bad)
r "AlertDialog"                                                                          # "are you sure" dialogs (bad for reversible actions)
r -i "undo"                                                                              # undo toasts (good)
r "tabular-nums|font-variant-numeric"                                                    # tabular numbers
r "text-wrap:\s*(balance|pretty)|text-balance|text-pretty"                               # balanced headlines
r "env\(safe-area|safe-area-inset|viewport-fit=cover"                                    # safe areas
r "min-h-\[?44|min-w-\[?44|h-11|size-11|min-height:\s*44px|min-width:\s*44px"          # 44px tap targets
r -U "<button[^>]*>\s*<(svg|\w+Icon)"                                                    # icon-only buttons to check against 44px
r "safePolygon|hoverIntent|safe-triangle|NavigationMenu|DropdownMenuSub|MenubarSub"      # submenu hover intent
r "useOptimistic|onMutate|optimistic"                                                    # optimistic updates + rollback (playbook B10)
```

Classify each detail as `present`, `partial` (some screens only), or `absent`. Judge relevance first:
`otp` only matters with SMS/email code login, `safe-area` only on mobile-web/PWA, `cmdk` only on
multi-section apps, `safe-triangle` only where nested menus exist. Many `AlertDialog`/`confirm(`
hits with few `undo` hits means reversible actions are guarded by pop-ups instead of undo toasts
(keep dialogs only for truly irreversible actions). Verdict requirement: Q8 is
not safe until every relevant detail is classified. Severity is Low/Medium unless a tap-target or
OTP gap blocks a core flow (then High).

## Files most likely to have findings

Don't read everything. Read these files first:

- form components
- error boundary / fallback components
- loading skeletons / spinners
- global layout / navigation

If you exhaust these and the budget allows, expand outward. Otherwise,
report what you found and note what you didn't read.

## Process

1. **Re-read the rules.** R1-R7 apply to every finding. Especially R2
   (quote before cite) — for a domain skill running in a subagent, the
   subagent's context is fresh; don't assume you remember a file from
   a previous turn.

2. **Walk the key questions.** For each question, run the relevant
   detection commands (greps, file reads, schema lookups). Capture
   evidence at path:line. Verify by reading the actual code.

3. **Cross-reference orchestrator inputs.** If the orchestrator passed
   hard-stops or blind-spots findings tagged for this domain, include
   them in your report. Don't re-investigate; just include with the
   provided evidence.

4. **Triage.** For each finding, set severity per the audit rubric and
   exploitability per R4.

5. **Produce the domain report.**

## Output format

```
═══════════════════════════════════════════════════════════════════════
  DOMAIN 6: UI/UX & Accessibility
═══════════════════════════════════════════════════════════════════════

▶ FOUNDER VIEW

[2-4 sentences in plain English. Sample tone:]
How does the app feel for a user who's tired, on mobile, or using a screen reader? Vibe-coded apps usually fail this hard.

▶ TECHNICAL EVIDENCE

Scope of this domain audit:
  Files read:        <count>
  Files skipped:     <count> (reason: outside scope or low-priority)

Findings:

  F-6.1 — <one-line title>
    Severity:        Critical | High | Medium | Low
    Exploitability:  EXPLOITABLE-NOW | EXPLOITABLE-LOW-EFFORT | BAD-PRACTICE | UNKNOWN
    Hard-stop:       H<N> if applicable
    Blind-spot:      B<N> if applicable

    Evidence:
      <path:line>  <one-line description>

    What's wrong:
      <one paragraph>

    Why it matters:
      <one sentence>

    Recommended fix:
      <one paragraph; for full fix prompt, ask for the audit-fix-generator skill with F-6.1. For a missing Q8 detail
       start with "Add <detail>" and name the skill command (impeccable animate/harden/typeset,
       emil-design-eng, frontendgame); do not only report it as missing>

    Verification after fix:
      <command>

  F-6.2 ...

Summary:
  Total findings: <count>
  By severity:    <counts>
  Most urgent:    <which finding ID>

[SECTION COMPLETE: Domain 6]
```

If the domain has zero findings:

```
▶ TECHNICAL EVIDENCE

  ✅ No findings in this domain.

  Verification:
    <commands run that produced no signal>

  Confidence: High | Medium | Low
  Reason for low confidence: <if applicable>
```



## Failure modes to refuse

- ❌ Producing findings without path:line citations (R1)
- ❌ Citing a path you didn't read (R2)
- ❌ Re-running hard-stops or blind-spots walks (orchestrator did this)
- ❌ Including findings outside this domain's scope (route them to the
  right domain instead)
- ❌ Soft-pedaling a Critical to Medium because "it's a small app" (R3)
- ❌ Skipping section completion marker (R6)
---

## Codex Port Notes

- Audit mode is read-only for product code unless the user explicitly requests remediation.
- Treat `.claude/`, `.codex/`, `.agents/`, `.gitnexus/`, caches, `node_modules/`, virtualenvs, and generated build outputs as tooling or generated scope unless the finding is specifically repo hygiene.
- For context references written as `@.claude/context/<file>`, read `~/.codex/context/<file>` in Codex.
- Prefer PowerShell equivalents on Windows; use `rg` before `grep` and `Get-ChildItem` before Unix `find` when running in PowerShell.
- If GitNexus MCP tools are unavailable, use `.gitnexus/meta.json`, `.gitnexus/` artifacts, and `npx gitnexus` CLI as the fallback.
- Findings should also be representable as: `{id, domain, severity, exploitability, evidence_path, evidence_line, summary, impact, recommended_fix, verification}`.
