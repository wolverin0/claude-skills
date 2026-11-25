#!/bin/bash
# tests/test-install-skills.sh
# tools/install_skills.py against a throwaway HOME: dry-run writes nothing,
# installs and backups land where expected, orphans are found and only moved
# with --yes.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PY="$(command -v python3 || command -v python)"
H="$ROOT/tests/tmp-install-home"
M="$ROOT/tests/tmp-install-manifest"
# Throwaway skills manifest (index + "$parts", the real format): every repo skill allowed for claude and codex,
# so tests 1-7 are unaffected by the guard; test 8 builds stricter ones.
write_manifest() {  # write_manifest <dir> <archived,comma,list> -- archived names leave the allow list
    rm -rf "$1"; mkdir -p "$1"
    "$PY" - "$1" "$2" <<'PYEOF'
import json, sys
from pathlib import Path
d, archived = Path(sys.argv[1]), [n for n in sys.argv[2].split(",") if n]
names = sorted(p.parent.name for p in Path("skills").rglob("SKILL.md"))
allow = [n for n in names if n not in archived]
(d / "roots.json").write_text(json.dumps({"roots": {r: {"allow": allow} for r in ("claude", "codex")}}))
(d / "archive.json").write_text(json.dumps({"archive": {r: archived for r in ("claude", "codex")}}))
(d / "skills-manifest.json").write_text(json.dumps({"$parts": ["roots.json", "archive.json"]}))
PYEOF
}
write_manifest "$M" ""
INSTALL=(env PYTHONDONTWRITEBYTECODE=1 SKILLS_MANIFEST="$M/skills-manifest.json" "$PY" tools/install_skills.py --home "$H")

pass() { echo -e "${GREEN}✓ PASS${NC}"; }
fail() { echo -e "${RED}✗ FAIL${NC}"; printf '  %s\n' "$@"; return 1; }
snapshot() { (cd "$H" && find . | sort | tr '\n' ' '); }

reset_home() { rm -rf "$H"; mkdir -p "$H"; }

# Test 1: --dry-run writes nothing
test_dry_run_writes_nothing() {
    echo -n "Test 1: Install --dry-run writes nothing... "
    reset_home
    local before out
    before=$(snapshot)
    out=$("${INSTALL[@]}" --profile audit --target all --dry-run)
    [[ "$(snapshot)" == "$before" ]] || { fail "dry-run changed $H"; return 1; }
    echo "$out" | grep -q "audit-orchestrator .*claude .*install" || { fail "no planned install" "$out"; return 1; }
    echo "$out" | grep -q "commands/audit.md .*claude .*install" || { fail "no planned claude extra" "$out"; return 1; }
    echo "$out" | grep -q "commands/audit.md .*codex" && { fail "codex got a claude extra"; return 1; }
    pass
}

# Test 2: install copies skills and extras; a second run reports "same"
test_install_then_same() {
    echo -n "Test 2: Install copies skills and extras, rerun is a no-op... "
    reset_home
    "${INSTALL[@]}" --profile audit --target all >/dev/null
    local f
    for f in .claude/skills/audit-orchestrator/SKILL.md .claude/skills/audit-orchestrator/modules/audit-method.md \
             .claude/skills/audit-loop/references/audit-rules.md .codex/skills/audit-fix-generator/SKILL.md \
             .claude/commands/audit.md .claude/agents/audit-runner.md .claude/workflows/audit-remediate.mjs; do
        [[ -f "$H/$f" ]] || { fail "missing $f"; return 1; }
    done
    [[ ! -e "$H/.codex/commands" ]] || { fail "claude extras leaked into codex"; return 1; }
    local out
    out=$("${INSTALL[@]}" --profile audit --target all)
    echo "$out" | grep -E "(install|update)" | grep -qv "^DRY" && { fail "rerun was not a no-op" "$out"; return 1; }
    pass
}

# Test 3: a changed installed copy is backed up outside the skill root, and the
# plan names files that exist only in the installed copy
test_update_backs_up_outside_root() {
    echo -n "Test 3: Update names installed-only files and backs up outside the root... "
    echo "local edit" >> "$H/.codex/skills/audit-loop/SKILL.md"
    echo "local tool" > "$H/.codex/skills/audit-loop/local-tool.mjs"
    local plan
    plan=$("${INSTALL[@]}" --profile audit --target codex --dry-run)
    echo "$plan" | grep -q "audit-loop .*update (backup); 1 installed-only file(s) move to backup: local-tool.mjs" \
        || { fail "plan does not name the installed-only file" "$plan"; return 1; }
    "${INSTALL[@]}" --profile audit --target codex >/dev/null
    local backup
    backup=$(find "$H/.codex/_backup_sync" -path "*/skills/audit-loop/SKILL.md" | head -1)
    [[ -n "$backup" ]] && grep -q "local edit" "$backup" || { fail "no backup under ~/.codex/_backup_sync"; return 1; }
    grep -q "local edit" "$H/.codex/skills/audit-loop/SKILL.md" && { fail "installed copy not refreshed"; return 1; }
    [[ ! -e "$H/.codex/skills/_backup_sync" ]] || { fail "backup written inside the skill root"; return 1; }
    pass
}

plant_orphans() {
    mkdir -p "$H/.claude/skills/audit-method" "$H/.codex/skills/_backup_sync/20260101/validation" \
             "$H/.agents/skills/_archive/old-validation" "$H/.claude/skills/my-own-skill"              "$H/.codex/skills/audit/audit-method" "$H/.codex/skills/audit/audit-loop" "$H/.codex/skills/ns-keep/other"
    echo "---" > "$H/.claude/skills/audit-method/SKILL.md"
    echo "---" > "$H/.codex/skills/_backup_sync/20260101/validation/SKILL.md"
    echo "---" > "$H/.agents/skills/_archive/old-validation/SKILL.md"
    echo "---" > "$H/.claude/skills/my-own-skill/SKILL.md"
    echo "---" > "$H/.codex/skills/audit/audit-method/SKILL.md"
    echo "---" > "$H/.codex/skills/audit/audit-loop/SKILL.md"
    echo "---" > "$H/.codex/skills/ns-keep/other/SKILL.md"
}

# Test 4: prune --dry-run finds retired and nested-backup skills, touches nothing
test_prune_dry_run() {
    echo -n "Test 4: Prune --dry-run reports orphans and touches nothing... "
    reset_home; plant_orphans
    local before out
    before=$(snapshot)
    out=$("${INSTALL[@]}" --prune-orphans --dry-run)
    [[ "$(snapshot)" == "$before" ]] || { fail "dry-run changed $H"; return 1; }
    echo "$out" | grep -q "orphans found: 4" || { fail "expected 4 orphans" "$out"; return 1; }
    echo "$out" | grep -q "~/.claude/skills/audit-method .*retired" || { fail "retired skill not reported" "$out"; return 1; }
    echo "$out" | grep -q "~/.codex/skills/_backup_sync .*nested" || { fail "nested backup not reported" "$out"; return 1; }
    echo "$out" | grep -q "~/.agents/skills/_archive" || { fail "~/.agents root not scanned" "$out"; return 1; }
    echo "$out" | grep -q "~/.codex/skills/audit .*legacy bundle" || { fail "nested legacy bundle not reported" "$out"; return 1; }
    echo "$out" | grep -q "ns-keep" && { fail "flagged a namespace folder with no retired skill"; return 1; }
    echo "$out" | grep -q "my-own-skill" && { fail "flagged a skill it does not own"; return 1; }
    pass
}

# Test 5: prune refuses without --yes, then moves (never deletes) with it
test_prune_needs_yes_and_moves() {
    echo -n "Test 5: Prune needs --yes and moves orphans aside... "
    local rc=0
    "${INSTALL[@]}" --prune-orphans >/dev/null || rc=$?
    [[ $rc -eq 2 && -d "$H/.claude/skills/audit-method" ]] || { fail "pruned without --yes (rc=$rc)"; return 1; }
    "${INSTALL[@]}" --prune-orphans --yes >/dev/null
    [[ ! -e "$H/.claude/skills/audit-method" && ! -e "$H/.codex/skills/audit" && ! -e "$H/.codex/skills/_backup_sync" && ! -e "$H/.agents/skills/_archive" ]] \
        || { fail "orphans still in the skill roots"; return 1; }
    [[ -f $(find "$H/.claude/_backup_sync" -path "*/pruned/audit-method/SKILL.md" | head -1) ]] \
        || { fail "pruned skill not kept under ~/.claude/_backup_sync"; return 1; }
    [[ -d "$H/.claude/skills/my-own-skill" ]] || { fail "removed an unrelated skill"; return 1; }
    pass
}

# Test 6: every profile names real skills; "all" covers the whole repo
test_profiles_valid() {
    echo -n "Test 6: Profiles name real skills; all covers every skill... "
    local out n_repo n_all
    for prof in ship audit build workflow; do
        "${INSTALL[@]}" --profile "$prof" --target claude --dry-run >/dev/null || { fail "profile $prof invalid"; return 1; }
    done
    out=$("${INSTALL[@]}" --profile all --target codex --dry-run)
    n_repo=$(find skills -name SKILL.md | wc -l)
    n_all=$(echo "$out" | grep -c " codex ")
    [[ $n_repo -eq $n_all ]] || { fail "all lists $n_all of $n_repo skills"; return 1; }
    pass
}

# Test 7: --exclude skips named skills (dry-run and real) and rejects unknown names
test_exclude() {
    echo -n "Test 7: --exclude skips named skills and rejects unknown ones... "
    reset_home
    local out rc=0
    out=$("${INSTALL[@]}" --profile all --target all --exclude debate,impeccable --dry-run)
    echo "$out" | grep -qE "^(debate|impeccable) " && { fail "excluded skill listed in dry-run" "$out"; return 1; }
    echo "$out" | grep -q "audit-orchestrator .*claude" || { fail "exclude dropped other skills" "$out"; return 1; }
    "${INSTALL[@]}" --profile all --target all --exclude debate,impeccable >/dev/null
    [[ ! -e "$H/.claude/skills/debate" && ! -e "$H/.codex/skills/impeccable" ]] || { fail "excluded skill was installed"; return 1; }
    [[ -f "$H/.claude/skills/audit-loop/SKILL.md" ]] || { fail "exclude blocked a normal install"; return 1; }
    "${INSTALL[@]}" --profile all --exclude no-such-skill --dry-run >/dev/null 2>&1 && rc=0 || rc=$?
    [[ $rc -ne 0 ]] || { fail "unknown --exclude name accepted"; return 1; }
    pass
}

# Test 8 (T-2776): the install honours the skills manifest. `debate` is in the workflow profile; archived or
# outside allow it must not land in the home. A missing manifest fails closed unless --no-manifest.
test_manifest_guard() {
    echo -n "Test 8: Archived/not-allowed skills are skipped; missing manifest fails closed... "
    local out rc=0 inst=(env PYTHONDONTWRITEBYTECODE=1 "$PY" tools/install_skills.py --home "$H")
    reset_home
    write_manifest "$M" "debate"
    out=$("${INSTALL[@]}" --profile workflow --target all)
    echo "$out" | grep -q "^debate .*claude .*SKIP (archived in manifest)" || { fail "archived skip not reported" "$out"; return 1; }
    [[ ! -e "$H/.claude/skills/debate" && ! -e "$H/.codex/skills/debate" ]] || { fail "archived skill was installed"; return 1; }
    [[ -f "$H/.claude/skills/handoff/SKILL.md" ]] || { fail "guard blocked a normal skill"; return 1; }
    # same name in a manifest that only leaves it out of allow
    write_manifest "$M" ""
    "$PY" - "$M" <<'PYEOF'
import json, sys
from pathlib import Path
f = Path(sys.argv[1]) / "roots.json"
m = json.loads(f.read_text())
for r in m["roots"].values():
    r["allow"].remove("handoff")
f.write_text(json.dumps(m))
PYEOF
    reset_home
    out=$("${INSTALL[@]}" --profile workflow --target claude)
    echo "$out" | grep -q "^handoff .*SKIP (not in manifest allow)" || { fail "not-allowed skip not reported" "$out"; return 1; }
    [[ ! -e "$H/.claude/skills/handoff" && -f "$H/.claude/skills/debate/SKILL.md" ]] || { fail "allow list not applied"; return 1; }
    # missing manifest: non-zero, nothing installed; --no-manifest is the explicit unsafe escape
    reset_home
    "${inst[@]}" --manifest "$M/does-not-exist.json" --profile workflow --target claude >/dev/null 2>&1 || rc=$?
    [[ $rc -ne 0 && ! -e "$H/.claude/skills" ]] || { fail "missing manifest did not fail closed (rc=$rc)"; return 1; }
    "${inst[@]}" --no-manifest --profile workflow --target claude >/dev/null
    [[ -f "$H/.claude/skills/debate/SKILL.md" ]] || { fail "--no-manifest did not install"; return 1; }
    write_manifest "$M" ""
    pass
}

# Test 9 (T-2776): no drift between this repo and the real manifest: nothing the repo ships is archived or outside
# allow for claude/codex, and no retired name is allowed there. Skipped when no wezbridge checkout is reachable.
test_real_manifest_agrees() {
    echo -n "Test 9: Profiles and retired list agree with the real manifest... "
    local real="${SKILLS_MANIFEST:-$ROOT/../wezbridge/config/skills-manifest.json}"
    [[ -f "$real" ]] || { echo "SKIP (no manifest at $real)"; return 0; }
    reset_home
    local out
    out=$("$PY" -I tools/install_skills.py --home "$H" --manifest "$real" --profile all --target all --dry-run) || { fail "install plan failed" "$out"; return 1; }
    echo "$out" | grep -q " SKIP " && { fail "repo ships skills the manifest archives or does not allow" "$(echo "$out" | grep ' SKIP ')"; return 1; }
    "$PY" -I - "$real" <<'PYEOF' || { fail "retired-skills.txt names a skill the manifest allows"; return 1; }
import json, sys
from pathlib import Path
f = Path(sys.argv[1]); m = json.loads(f.read_text(encoding="utf-8-sig"))
for part in m.pop("$parts", []):
    m.update(json.loads((f.parent / part).read_text(encoding="utf-8-sig")))
retired = {l.partition("#")[0].strip() for l in Path("tools/retired-skills.txt").read_text(encoding="utf-8").splitlines()} - {""}
bad = sorted(n for r in ("claude", "codex") for n in retired & set(m["roots"][r]["allow"]))
if bad:
    print("retired but allowed:", bad); sys.exit(1)
PYEOF
    pass
}

echo ""
echo "Running Installer Tests"
echo "=================================="
echo ""
total=0; passed=0
for t in test_dry_run_writes_nothing test_install_then_same test_update_backs_up_outside_root \
         test_prune_dry_run test_prune_needs_yes_and_moves test_profiles_valid test_exclude test_manifest_guard test_real_manifest_agrees; do
    total=$((total + 1))
    if $t; then passed=$((passed + 1)); fi
done
rm -rf "$H" "$M"
echo ""
echo "=================================="
if [[ $passed -eq $total ]]; then
    echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
    exit 0
fi
echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
exit 1
