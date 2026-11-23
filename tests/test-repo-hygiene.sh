#!/bin/bash
# tests/test-repo-hygiene.sh
# Repository invariants that keep shipped skills self-contained.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

pass() { echo -e "${GREEN}✓ PASS${NC}"; }
fail() { echo -e "${RED}✗ FAIL${NC}"; printf '  %s\n' "$@"; return 1; }

# Test 1: vibe-to-prod's playbook copy matches the audit bundle's
test_playbook_copies_identical() {
    echo -n "Test 1: Playbook copies are identical... "
    local a=skills/audit/references/production-readiness-playbook.md
    local b=skills/vibe-to-prod/references/production-readiness-playbook.md
    [[ -f "$a" && -f "$b" ]] || { fail "missing $a or $b"; return 1; }
    # Compare ignoring CR so a Windows checkout with autocrlf compares equal.
    if diff -q <(tr -d '\r' < "$a") <(tr -d '\r' < "$b") >/dev/null; then
        pass
    else
        fail "$b drifted from $a; copy it again"
    fi
}

# Test 2: no SKILL.md cites the playbook at a machine-specific context path only
test_no_hardcoded_playbook_path() {
    echo -n "Test 2: No hard-coded ~/.codex playbook path... "
    local hits
    hits=$(grep -rn "view ~/.codex/context/production-readiness-playbook.md" skills --include=SKILL.md || true)
    [[ -z "$hits" ]] && pass || fail "$hits"
}

# Test 3: skills/ root holds only skill folders (loose files are never installed)
test_no_loose_files_in_skills_root() {
    echo -n "Test 3: No loose files at skills/ root... "
    local hits
    hits=$(find skills -mindepth 1 -maxdepth 1 -type f | sort)
    [[ -z "$hits" ]] && pass || fail "move into a skill's references/ or tools/references/:" $hits
}

# Test 4: no backup, lock or editor junk is tracked
test_no_tracked_junk() {
    echo -n "Test 4: No tracked .bak/.lock/.orig/~ files... "
    local hits
    hits=$(git ls-files | grep -E '\.(bak|lock|orig|rej)$|\.bak\.|~$' || true)
    [[ -z "$hits" ]] && pass || fail $hits
}

# Test 5: no personal absolute paths (placeholder user names are allowed)
test_no_personal_paths() {
    echo -n "Test 5: No personal absolute paths... "
    local placeholders='user|username|you|me|name|runner|specific-user|example|\$USER|<[^>]*>'
    local hits
    hits=$(git grep -nIE '(/Users/|/home/|[A-Za-z]:[\/]+Users[\/]+)[A-Za-z0-9._$<>-]+' -- . ':!tests/test-repo-hygiene.sh' \
        | grep -vE "(/Users/|/home/|[A-Za-z]:[\/]+Users[\/]+)(${placeholders})([^A-Za-z0-9._-]|$)" || true)
    [[ -z "$hits" ]] && pass || fail "use ~ or <projects-root>:" "$hits"
}

# Test 6: every /command in the docs resolves to a skill name or a commands/ file
test_slash_commands_resolve() {
    echo -n "Test 6: Documented /commands resolve... "
    # Named in the docs as not shipped here (README "What this repo does not include").
    local not_shipped=" monitoring-setup "
    local names=" " token missing=""
    names+=$(grep -h '^name:' $(find skills -name SKILL.md) | sed 's/^name:[[:space:]]*//; s/["'\'']//g' | tr '\n' ' ')
    names+=" $(ls commands | sed 's/\.md$//' | tr '\n' ' ') "
    for token in $(grep -ohE '(^|[[:space:]`(])/[a-z][a-z0-9-]+' README.md DOCS-MAP.md prompts/*.md commands/*.md \
                   | sed 's/^[^/]*\///' | sort -u); do
        [[ "$names" == *" $token "* || "$not_shipped" == *" $token "* ]] || missing+=" /$token"
    done
    [[ -z "$missing" ]] && pass || fail "no skill or command named:$missing"
}

# Test 7: explicit-only skills say so to every provider
# Claude Code: disable-model-invocation: true. Codex: agents/openai.yaml
# policy.allow_implicit_invocation: false. Others: "Explicit invocation only"
# in the description. A skill with any one of them must have all three.
test_explicit_only_consistent() {
    echo -n "Test 7: Explicit-only skills are explicit in every provider... "
    local bad="" f dir dmi pol txt
    while IFS= read -r f; do
        dir=$(dirname "$f")
        dmi=0; pol=0; txt=0
        sed -n '2,/^---/p' "$f" | grep -q '^disable-model-invocation:[[:space:]]*true' && dmi=1
        [[ -f "$dir/agents/openai.yaml" ]] && grep -q '^[[:space:]]*allow_implicit_invocation:[[:space:]]*false' "$dir/agents/openai.yaml" && pol=1
        sed -n '2,/^---/p' "$f" | grep '^description:' | grep -q 'Explicit invocation only' && txt=1
        if (( dmi + pol + txt > 0 && dmi + pol + txt < 3 )); then
            bad+=" $dir(dmi=$dmi,codex=$pol,text=$txt)"
        fi
    done < <(find skills -name SKILL.md | sort)
    [[ -z "$bad" ]] && pass || fail "inconsistent:$bad"
}

run_all_tests() {
    echo ""
    echo "Running Repo Hygiene Tests"
    echo "=================================="
    echo ""
    local total=0 passed=0 t
    for t in "${TESTS[@]}"; do
        total=$((total + 1))
        if $t; then passed=$((passed + 1)); fi
    done
    echo ""
    echo "=================================="
    if [[ $passed -eq $total ]]; then
        echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
        return 0
    fi
    echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
    return 1
}

TESTS=(
    test_playbook_copies_identical
    test_no_hardcoded_playbook_path
    test_no_loose_files_in_skills_root
    test_no_tracked_junk
    test_no_personal_paths
    test_slash_commands_resolve
    test_explicit_only_consistent
)

run_all_tests
