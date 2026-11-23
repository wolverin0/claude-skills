#!/bin/bash
# tests/test-handoff-guard.sh
# skills/handoff/scripts/handoff-guard.cjs as a PreCompact hook, with handoffs
# published by the shipped publish-handoff.cjs into a throwaway project.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS="$ROOT/skills/handoff/scripts"
P="$ROOT/tests/tmp-handoff-project"
SESSION="sess-0123456789abcdef"
GEN="11111111-2222-4333-8444-555555555555"
CORR="handoff-$GEN"

pass() { echo -e "${GREEN}✓ PASS${NC}"; }
fail() { echo -e "${RED}✗ FAIL${NC}"; printf '  %s\n' "$@"; return 1; }

hook() {   # hook <trigger> [session]  -> sets OUT, ERR, RC
    local input
    input=$(printf '{"session_id":"%s","cwd":"%s","hook_event_name":"PreCompact","trigger":"%s","custom_instructions":null}' \
        "${2:-$SESSION}" "$(node -e 'console.log(JSON.stringify(process.argv[1]).slice(1,-1))' "$P")" "$1")
    RC=0
    OUT=$(printf '%s' "$input" | node "$SCRIPTS/handoff-guard.cjs" 2>"$P.err") || RC=$?
    ERR=$(cat "$P.err"); rm -f "$P.err"
}

publish() {
    mkdir -p "$P/handoffs"
    cat > "$P/handoffs/$GEN.draft.md" <<'EOF'
## Context
Test project.
## Current State
Branch test, clean.
## Open Threads
None
## Next Steps
None
## Constraints & Gotchas
None
## Relevant Files
None
## Corr ID
See metadata.
## Suggested Skills & Setup
None
EOF
    node "$SCRIPTS/publish-handoff.cjs" --draft "$P/handoffs/$GEN.draft.md" --session-id "$SESSION" \
        --project-dir "$P" --generation "$GEN" --corr "$CORR" >/dev/null
}

reset() { rm -rf "$P"; mkdir -p "$P"; }

test_missing_manual_blocks() {
    echo -n "Test 1: Manual /compact without a handoff is blocked (exit 2)... "
    reset; hook manual
    [[ $RC -eq 2 && "$ERR" == *"Run /handoff first"* ]] || { fail "rc=$RC err=$ERR"; return 1; }
    [[ ! -e "$P/handoffs" ]] || { fail "guard created handoffs/"; return 1; }
    pass
}

test_missing_auto_never_blocks() {
    echo -n "Test 2: Auto compaction is never blocked; summary gets a note... "
    reset; hook auto
    [[ $RC -eq 0 && "$OUT" == *"no verified handoff exists for this session"* ]] || { fail "rc=$RC out=$OUT"; return 1; }
    pass
}

test_fresh_handoff_passes_with_corr() {
    echo -n "Test 3: A fresh verified handoff passes and its corr reaches the summary... "
    reset; publish; hook manual
    [[ $RC -eq 0 && "$OUT" == *"handoffs/handoff-$GEN.md"* && "$OUT" == *"corr $CORR"* ]] || { fail "rc=$RC out=$OUT err=$ERR"; return 1; }
    pass
}

test_other_session_ignored() {
    echo -n "Test 4: Another session's handoff does not count... "
    hook manual "sess-someone-else-1234"
    [[ $RC -eq 2 ]] || { fail "rc=$RC out=$OUT"; return 1; }
    pass
}

test_tampered_ignored() {
    echo -n "Test 5: A tampered handoff (checksum mismatch) does not count... "
    reset; publish
    sed -i 's/Test project\./Edited after publication./' "$P/handoffs/handoff-$GEN.md"
    hook manual
    [[ $RC -eq 2 ]] || { fail "rc=$RC out=$OUT"; return 1; }
    pass
}

test_stale_blocks_and_off_switch() {
    echo -n "Test 6: A stale handoff blocks manual; HANDOFF_GUARD=off disables... "
    reset; publish
    RC=0; HANDOFF_GUARD_MAX_AGE_MIN=-1 hook manual
    [[ $RC -eq 2 && "$ERR" == *"min old"* ]] || { fail "stale: rc=$RC err=$ERR"; return 1; }
    rm -rf "$P/handoffs"
    HANDOFF_GUARD=off hook manual
    [[ $RC -eq 0 ]] || { fail "off switch: rc=$RC"; return 1; }
    pass
}

echo ""
echo "Running Handoff Guard Tests"
echo "=================================="
echo ""
total=0; passed=0
for t in test_missing_manual_blocks test_missing_auto_never_blocks test_fresh_handoff_passes_with_corr \
         test_other_session_ignored test_tampered_ignored test_stale_blocks_and_off_switch; do
    total=$((total + 1))
    if $t; then passed=$((passed + 1)); fi
done
rm -rf "$P"
echo ""
echo "=================================="
if [[ $passed -eq $total ]]; then
    echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
    exit 0
fi
echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
exit 1
