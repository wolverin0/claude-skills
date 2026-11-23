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
INSTALL=(env PYTHONDONTWRITEBYTECODE=1 "$PY" tools/install_skills.py --home "$H")

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
             "$H/.agents/skills/_archive/old-validation" "$H/.claude/skills/my-own-skill"
    echo "---" > "$H/.claude/skills/audit-method/SKILL.md"
    echo "---" > "$H/.codex/skills/_backup_sync/20260101/validation/SKILL.md"
    echo "---" > "$H/.agents/skills/_archive/old-validation/SKILL.md"
    echo "---" > "$H/.claude/skills/my-own-skill/SKILL.md"
}

# Test 4: prune --dry-run finds retired and nested-backup skills, touches nothing
test_prune_dry_run() {
    echo -n "Test 4: Prune --dry-run reports orphans and touches nothing... "
    reset_home; plant_orphans
    local before out
    before=$(snapshot)
    out=$("${INSTALL[@]}" --prune-orphans --dry-run)
    [[ "$(snapshot)" == "$before" ]] || { fail "dry-run changed $H"; return 1; }
    echo "$out" | grep -q "orphans found: 3" || { fail "expected 3 orphans" "$out"; return 1; }
    echo "$out" | grep -q "~/.claude/skills/audit-method .*retired" || { fail "retired skill not reported" "$out"; return 1; }
    echo "$out" | grep -q "~/.codex/skills/_backup_sync .*nested" || { fail "nested backup not reported" "$out"; return 1; }
    echo "$out" | grep -q "~/.agents/skills/_archive" || { fail "~/.agents root not scanned" "$out"; return 1; }
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
    [[ ! -e "$H/.claude/skills/audit-method" && ! -e "$H/.codex/skills/_backup_sync" && ! -e "$H/.agents/skills/_archive" ]] \
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

echo ""
echo "Running Installer Tests"
echo "=================================="
echo ""
total=0; passed=0
for t in test_dry_run_writes_nothing test_install_then_same test_update_backs_up_outside_root \
         test_prune_dry_run test_prune_needs_yes_and_moves test_profiles_valid; do
    total=$((total + 1))
    if $t; then passed=$((passed + 1)); fi
done
rm -rf "$H"
echo ""
echo "=================================="
if [[ $passed -eq $total ]]; then
    echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
    exit 0
fi
echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
exit 1
