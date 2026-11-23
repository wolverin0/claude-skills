#!/bin/bash
# tests/test-eval-routing.sh
# skills/skill-creator/scripts/eval_routing.py: the repo's skills route the
# cases in routing_cases.json, and a planted trigger collision is caught.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PY="$(command -v python3 || command -v python)"
EVAL=(env PYTHONDONTWRITEBYTECODE=1 "$PY" skills/skill-creator/scripts/eval_routing.py)
F="$ROOT/tests/tmp-routing"

pass() { echo -e "${GREEN}✓ PASS${NC}"; }
fail() { echo -e "${RED}✗ FAIL${NC}"; printf '  %s\n' "$@"; return 1; }

skill() {  # skill <dir> <name> <description>
    mkdir -p "$F/skills/$1"
    printf -- '---\nname: %s\ndescription: "%s"\n---\nbody\n' "$2" "$3" > "$F/skills/$1/SKILL.md"
}

test_repo_cases_pass() {
    echo -n "Test 1: Every routing case passes on the repo's skills... "
    local out rc=0
    out=$("${EVAL[@]}") || rc=$?
    [[ $rc -eq 0 ]] || { fail "$(echo "$out" | grep -E '^FAIL|cases pass')"; return 1; }
    pass
}

test_collision_detected() {
    echo -n "Test 2: A planted trigger collision fails with FORBIDDEN-ABOVE... "
    rm -rf "$F"
    skill quick-check quick-check "Quick launch readiness scorecard. Use when the user asks is this ready to ship."
    skill full-audit full-audit "Full repository audit. Use when the user asks is this codebase ready to ship, ready to ship, ship it."
    printf '[{"prompt": "is this codebase ready to ship?", "expect": "quick-check", "not": ["full-audit"]}]\n' > "$F/cases.json"
    local out rc=0
    out=$("${EVAL[@]}" --skills-root "$F/skills" --cases "$F/cases.json") || rc=$?
    [[ $rc -eq 1 && "$out" == *"FORBIDDEN-ABOVE=['full-audit']"* ]] || { fail "rc=$rc" "$out"; rm -rf "$F"; return 1; }
    # Moving the redirect into a "Not for" sentence removes the collision.
    skill full-audit full-audit "Full repository audit with evidence. Not for is this ready to ship checks (quick-check)."
    rc=0
    "${EVAL[@]}" --skills-root "$F/skills" --cases "$F/cases.json" >/dev/null || rc=$?
    rm -rf "$F"
    [[ $rc -eq 0 ]] || { fail "redirect sentence still collides (rc=$rc)"; return 1; }
    pass
}

echo ""
echo "Running Routing Eval Tests"
echo "=================================="
echo ""
total=0; passed=0
for t in test_repo_cases_pass test_collision_detected; do
    total=$((total + 1))
    if $t; then passed=$((passed + 1)); fi
done
echo ""
echo "=================================="
if [[ $passed -eq $total ]]; then
    echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
    exit 0
fi
echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
exit 1
