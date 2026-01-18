#!/bin/bash
# tests/test-atomic-state-writes.sh
# Tests for atomic state write functionality

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/tmp"

# Setup
setup() {
    mkdir -p "$TEST_DIR"
}

# Cleanup
cleanup() {
    rm -rf "$TEST_DIR"
}

# Source the helper function
source_helper() {
    # Extract the helper function from skills/debate.md
    # For testing, we'll define it directly
    update_debate_state() {
        local state_file="$1"
        local new_data="$2"

        # Check if flock is available
        if ! command -v flock &>/dev/null; then
            echo "WARN: flock not available, skipping file locking" >&2
            # Fallback: Direct atomic write without locking
            echo "$new_data" > "${state_file}.tmp" || return 1
            if command -v jq &>/dev/null && ! jq empty "${state_file}.tmp" 2>/dev/null; then
                rm "${state_file}.tmp" 2>/dev/null
                return 1
            fi
            mv "${state_file}.tmp" "$state_file" || return 1
            return 0
        fi

        (
            flock -x -w 5 200 || {
                echo "ERROR: Could not acquire lock on $state_file after 5s" >&2
                return 1
            }

            if [[ -f "$state_file" ]]; then
                cp "$state_file" "${state_file}.backup" 2>/dev/null
            fi

            echo "$new_data" > "${state_file}.tmp" || {
                echo "ERROR: Failed to write new state to ${state_file}.tmp" >&2
                return 1
            }

            if command -v jq &>/dev/null; then
                if ! jq empty "${state_file}.tmp" 2>/dev/null; then
                    echo "ERROR: Invalid JSON in new state" >&2
                    rm "${state_file}.tmp" 2>/dev/null
                    return 1
                fi
            fi

            mv "${state_file}.tmp" "$state_file" || {
                echo "ERROR: Failed to atomically update $state_file" >&2
                if [[ -f "${state_file}.backup" ]]; then
                    mv "${state_file}.backup" "$state_file" 2>/dev/null
                fi
                return 1
            }

            rm "${state_file}.backup" 2>/dev/null
            rm "${state_file}.tmp" 2>/dev/null

        ) 200>"${state_file}.lock"
    }
}

# Test 1: Basic state update
test_basic_update() {
    echo -n "Test 1: Basic state update... "

    local state_file="$TEST_DIR/state.json"
    echo '{"status":"in_progress"}' > "$state_file"

    local new_state='{"status":"completed","current_round":3}'
    update_debate_state "$state_file" "$new_state"

    local result=$(cat "$state_file")
    if [[ "$result" == "$new_state" ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected: $new_state"
        echo "  Got: $result"
        return 1
    fi
}

# Test 2: No leftover files
test_no_leftover_files() {
    echo -n "Test 2: No leftover files... "

    local state_file="$TEST_DIR/state2.json"
    echo '{"status":"in_progress"}' > "$state_file"

    update_debate_state "$state_file" '{"status":"completed"}'

    if [[ -f "${state_file}.tmp" ]] || [[ -f "${state_file}.backup" ]] || [[ -f "${state_file}.lock" ]]; then
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Found leftover files:"
        ls -la "$TEST_DIR"
        return 1
    else
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    fi
}

# Test 3: Invalid JSON detection (if jq available)
test_invalid_json() {
    if ! command -v jq &>/dev/null; then
        echo "Test 3: Invalid JSON detection... SKIPPED (jq not installed)"
        return 0
    fi

    echo -n "Test 3: Invalid JSON detection... "

    local state_file="$TEST_DIR/state3.json"
    echo '{"valid":"json"}' > "$state_file"

    local invalid_json='{"broken":json'  # Missing quote

    if update_debate_state "$state_file" "$invalid_json" 2>/dev/null; then
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Should have rejected invalid JSON"
        return 1
    fi

    # Verify original state preserved
    local result=$(cat "$state_file")
    if [[ "$result" == '{"valid":"json"}' ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Original state not preserved"
        return 1
    fi
}

# Test 4: Concurrent updates (simplified - just verify locking works)
test_concurrent_updates() {
    if ! command -v flock &>/dev/null; then
        echo "Test 4: Lock timeout (simulated)... SKIPPED (flock not installed)"
        return 0
    fi

    echo -n "Test 4: Lock timeout (simulated)... "

    local state_file="$TEST_DIR/state4.json"
    echo '{"counter":0}' > "$state_file"

    # Acquire lock in background
    (
        flock -x 200
        sleep 3  # Hold lock for 3 seconds
    ) 200>"${state_file}.lock" &

    local lock_pid=$!

    # Try to acquire lock immediately (should timeout after 5s or succeed after lock releases)
    sleep 0.5  # Ensure background lock is acquired first

    local start=$(date +%s)
    if update_debate_state "$state_file" '{"counter":1}' 2>/dev/null; then
        local end=$(date +%s)
        local elapsed=$((end - start))

        # Should succeed after ~3s (when background lock releases)
        if [[ $elapsed -ge 2 ]] && [[ $elapsed -le 4 ]]; then
            echo -e "${GREEN}✓ PASS${NC} (waited ${elapsed}s for lock)"
            wait $lock_pid 2>/dev/null
            return 0
        else
            echo -e "${RED}✗ FAIL${NC}"
            echo "  Unexpected timing: ${elapsed}s"
            wait $lock_pid 2>/dev/null
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Update should have succeeded after lock release"
        wait $lock_pid 2>/dev/null
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo ""
    echo "Running Atomic State Write Tests"
    echo "=================================="
    echo ""

    local total=0
    local passed=0

    setup
    source_helper

    tests=(
        test_basic_update
        test_no_leftover_files
        test_invalid_json
        test_concurrent_updates
    )

    for test in "${tests[@]}"; do
        total=$((total + 1))
        if $test; then
            passed=$((passed + 1))
        fi
    done

    cleanup

    echo ""
    echo "=================================="
    if [[ $passed -eq $total ]]; then
        echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
        return 0
    else
        echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
        return 1
    fi
}

# Run tests
run_all_tests
