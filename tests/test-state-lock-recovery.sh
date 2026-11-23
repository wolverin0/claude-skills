#!/bin/bash
# tests/test-state-lock-recovery.sh
# Stale-lock recovery, lock timeout, trap cleanup and bash/Node interop for
# skills/debate/tools/state-lock.sh and skills/debate/tools/atomic-json.mjs.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/tmp-lock"
TOOLS="$SCRIPT_DIR/../skills/debate/tools"

# shellcheck source=../skills/debate/tools/state-lock.sh
source "$TOOLS/state-lock.sh"

pass() { echo -e "${GREEN}✓ PASS${NC}${1:+ ($1)}"; }
fail() { echo -e "${RED}✗ FAIL${NC}"; echo "  $1"; return 1; }

# A PID that is guaranteed not to be running: a finished background job.
dead_pid() {
    sleep 0 &
    local pid=$!
    wait "$pid" 2>/dev/null || true
    echo "$pid"
}

# Test 1: a lock whose owner process is gone is recovered at once
test_dead_owner_recovered() {
    echo -n "Test 1: Dead-owner lock is recovered... "
    local f="$TEST_DIR/dead.json"
    echo '{"v":0}' > "$f"
    mkdir "$f.lock"
    echo "$(dead_pid) $(date +%s)" > "$f.lock/owner"

    local rc=0
    update_debate_state "$f" '{"v":1}' 2>/dev/null || rc=$?
    [[ $rc -eq 0 ]] || { fail "update returned $rc"; return 1; }
    [[ "$(cat "$f")" == '{"v":1}' ]] || { fail "state not written"; return 1; }
    [[ ! -e "$f.lock" ]] || { fail "lock left behind"; return 1; }
    pass
}

# Test 2: an expired lock from a live process is recovered after DEBATE_LOCK_STALE
test_expired_lock_recovered() {
    echo -n "Test 2: Expired lock (live PID, old timestamp) is recovered... "
    local f="$TEST_DIR/expired.json"
    echo '{"v":0}' > "$f"
    mkdir "$f.lock"
    echo "$$ $(( $(date +%s) - 3600 ))" > "$f.lock/owner"

    local rc=0
    update_debate_state "$f" '{"v":2}' 2>/dev/null || rc=$?
    [[ $rc -eq 0 && "$(cat "$f")" == '{"v":2}' && ! -e "$f.lock" ]] \
        || { fail "rc=$rc content=$(cat "$f")"; return 1; }
    pass
}

# Test 3: a fresh lock held by a live process times out and keeps the old state
test_live_lock_times_out() {
    echo -n "Test 3: Live lock times out without writing... "
    local f="$TEST_DIR/live.json"
    echo '{"v":0}' > "$f"
    mkdir "$f.lock"
    echo "$$ $(date +%s)" > "$f.lock/owner"

    local rc=0 start end
    start=$(date +%s)
    DEBATE_LOCK_TIMEOUT=1 update_debate_state "$f" '{"v":3}' 2>/dev/null || rc=$?
    end=$(date +%s)
    local survived=0
    [[ -f "$f.lock/owner" && "$(cat "$f.lock/owner")" == "$$ "* ]] && survived=1
    rm -rf "$f.lock"
    [[ $survived -eq 1 ]] || { fail "the timed-out waiter removed a lock it never held"; return 1; }
    [[ $rc -ne 0 ]] || { fail "update should have failed"; return 1; }
    [[ "$(cat "$f")" == '{"v":0}' ]] || { fail "state changed under a held lock"; return 1; }
    (( end - start <= 3 )) || { fail "waited $((end - start))s, expected about 1s"; return 1; }
    pass "gave up after $((end - start))s"
}

# Test 4: a writer killed while holding the lock releases it through its trap
test_trap_releases_on_term() {
    echo -n "Test 4: TERM while holding the lock releases it... "
    local f="$TEST_DIR/term.json"
    echo '{"v":0}' > "$f"
    (
        trap 'debate_lock_release "$f"' EXIT
        trap 'exit 143' INT TERM
        debate_lock_acquire "$f" || exit 1
        sleep 5 &
        wait $!
    ) &
    local pid=$! i
    for i in $(seq 1 50); do [[ -d "$f.lock" ]] && break; sleep 0.1; done
    [[ -d "$f.lock" ]] || { fail "holder never took the lock"; return 1; }
    kill -TERM "$pid"
    wait "$pid" 2>/dev/null || true
    [[ ! -e "$f.lock" ]] || { fail "lock survived TERM"; rm -rf "$f.lock"; return 1; }
    pass
}

# Test 5: Node helper recovers a stale bash lock (non-empty dir) and releases its own
test_node_recovers_bash_lock() {
    if ! command -v node >/dev/null 2>&1; then
        echo "Test 5: Node recovers stale bash lock... SKIPPED (node not installed)"
        return 0
    fi
    echo -n "Test 5: Node recovers stale bash lock... "
    local f="$TEST_DIR/node.json"
    echo '{"v":0}' > "$f"
    mkdir "$f.lock"
    echo "$(dead_pid) 1" > "$f.lock/owner"
    touch -d '@1' "$f.lock" 2>/dev/null || touch -t 197001010000 "$f.lock"

    local rc=0
    node "$TOOLS/atomic-json.mjs" write "$f" '{"v":5}' >/dev/null 2>&1 || rc=$?
    [[ $rc -eq 0 ]] || { fail "node write returned $rc"; rm -rf "$f.lock"; return 1; }
    grep -q '"v":5' "$f" || { fail "node did not write"; return 1; }
    [[ ! -e "$f.lock" ]] || { fail "lock left behind"; return 1; }
    pass
}

run_all_tests() {
    echo ""
    echo "Running State Lock Recovery Tests"
    echo "=================================="
    echo ""
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"

    local total=0 passed=0 t
    for t in test_dead_owner_recovered test_expired_lock_recovered test_live_lock_times_out \
             test_trap_releases_on_term test_node_recovers_bash_lock; do
        total=$((total + 1))
        if $t; then passed=$((passed + 1)); fi
    done

    rm -rf "$TEST_DIR"
    echo ""
    echo "=================================="
    if [[ $passed -eq $total ]]; then
        echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
        return 0
    fi
    echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
    return 1
}

run_all_tests
