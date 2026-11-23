#!/bin/bash
# tests/test-skill-frontmatter.sh
# Runs skills/skill-creator/scripts/quick_validate.py on every SKILL.md folder.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="$(command -v python3 || command -v python)"
VALIDATE=skills/skill-creator/scripts/quick_validate.py

# Third-party skills copied as found (see README "Third-party skills"): the
# exact failure each is known to produce. Any other failure still fails.
known_failure() {
    case "$1" in
        skills/impeccable) echo "Unexpected key(s) in SKILL.md frontmatter: version." ;;
    esac
}

echo ""
echo "Running Skill Frontmatter Validation"
echo "=================================="
echo ""

total=0
passed=0
while IFS= read -r dir; do
    total=$((total + 1))
    rc=0
    out=$("$PY" "$VALIDATE" "$dir" 2>&1) || rc=$?
    known="$(known_failure "$dir")"
    if [[ $rc -eq 0 && -z "$known" ]]; then
        passed=$((passed + 1))
    elif [[ $rc -ne 0 && -n "$known" && "$out" == "$known"* ]]; then
        passed=$((passed + 1))
        echo "known third-party exception: $dir ($known)"
    elif [[ $rc -eq 0 && -n "$known" ]]; then
        echo -e "${RED}✗ FAIL${NC} $dir now validates; remove its known_failure entry"
    else
        echo -e "${RED}✗ FAIL${NC} $dir: $out"
    fi
done < <(find skills -name SKILL.md -exec dirname {} \; | sort)

echo ""
echo "=================================="
if [[ $total -gt 0 && $passed -eq $total ]]; then
    echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
    exit 0
fi
echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
exit 1
