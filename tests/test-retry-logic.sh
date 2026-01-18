#!/bin/bash
# tests/test-retry-logic.sh
# Tests for exponential backoff retry logic

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/tmp-retry"

setup() {
    mkdir -p "$TEST_DIR"
}

cleanup() {
    rm -rf "$TEST_DIR"
}

# Source helper functions
source_helpers() {
    # Mock functions for testing
    run_advisor() {
        local advisor="$1"
        local prompt="$2"
        local timeout="$3"

        # Check test scenario file
        local scenario_file="$TEST_DIR/scenario_${advisor}.txt"
        if [[ -f "$scenario_file" ]]; then
            local attempt=$(cat "$TEST_DIR/attempt_${advisor}.txt" 2>/dev/null || echo "1")
            local line=$(sed -n "${attempt}p" "$scenario_file")
            echo "$((attempt + 1))" > "$TEST_DIR/attempt_${advisor}.txt"

            if [[ "$line" == "success" ]]; then
                return 0
            else
                echo "$line" >&2
                return 1
            fi
        fi
        return 0
    }

    get_last_error() {
        # Return last error (mock)
        cat "$TEST_DIR/last_error.txt" 2>/dev/null || echo "unknown error"
    }

    # Copy retry logic from debate.md
    run_advisor_with_retry() {
        local advisor="$1"
        local prompt="$2"
        local max_retries="${3:-3}"
        local base_timeout="${4:-90}"

        local attempt=1
        local timeout=$base_timeout

        while [[ $attempt -le $max_retries ]]; do
            echo "[$advisor] Attempt $attempt/$max_retries (timeout: ${timeout}s)" >&2

            if run_advisor "$advisor" "$prompt" "$timeout"; then
                echo "[$advisor] Response received" >&2
                return 0
            fi

            local exit_code=$?
            local error_output=$(get_last_error 2>&1)

            if [[ $attempt -eq $max_retries ]]; then
                echo "ERROR: [$advisor] Failed after $max_retries attempts" >&2
                return 1
            fi

            local failure_mode=$(detect_failure_mode "$advisor" "$error_output")

            case "$failure_mode" in
                rate_limit)
                    echo "WARN: [$advisor] Rate limit, waiting 60s..." >&2
                    sleep 1  # Shortened for testing
                    ;;
                network_timeout)
                    local wait_time=$((2 ** (attempt - 1)))
                    echo "WARN: [$advisor] Timeout, waiting ${wait_time}s..." >&2
                    sleep 1  # Shortened for testing
                    timeout=$((timeout * 2))
                    ;;
                session_expired)
                    echo "WARN: [$advisor] Session expired" >&2
                    return 2
                    ;;
                usage_limit)
                    echo "ERROR: [$advisor] Usage limit reached" >&2
                    return 3
                    ;;
                *)
                    local wait_time=$((2 ** (attempt - 1)))
                    echo "WARN: [$advisor] Error, waiting ${wait_time}s..." >&2
                    sleep 1  # Shortened for testing
                    timeout=$((timeout + base_timeout))
                    ;;
            esac

            attempt=$((attempt + 1))
        done

        return 1
    }

    detect_failure_mode() {
        local advisor="$1"
        local error_output="$2"

        if echo "$error_output" | grep -Eqi "session.*(expired|not found|invalid|closed)"; then
            echo "session_expired"
            return
        fi

        if [[ "$advisor" == "gemini" ]]; then
            if echo "$error_output" | grep -Eqi "quota exceeded|rate limit|too many requests|429"; then
                echo "rate_limit"
                return
            fi
        elif [[ "$advisor" == "codex" ]]; then
            if echo "$error_output" | grep -Eqi "rate limit|too many requests|slow down|429"; then
                echo "rate_limit"
                return
            fi
        fi

        if echo "$error_output" | grep -Eqi "timeout|timed out|connection.*closed|ETIMEDOUT|ECONNRESET"; then
            echo "network_timeout"
            return
        fi

        if echo "$error_output" | grep -Eqi "usage.*limit|quota.*exceeded|billing|payment|403|insufficient.*funds"; then
            echo "usage_limit"
            return
        fi

        echo "unknown_error"
    }
}

# Test 1: Success on first attempt
test_success_first_attempt() {
    echo -n "Test 1: Success on first attempt... "

    echo "1" > "$TEST_DIR/attempt_gemini.txt"
    echo "success" > "$TEST_DIR/scenario_gemini.txt"

    run_advisor_with_retry "gemini" "test" 3 90 >/dev/null 2>&1
    result=$?

    if [[ $result -eq 0 ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected code 0, got $result)"
        return 1
    fi
}

# Test 2: Success after network timeout retry
test_network_timeout_recovery() {
    echo -n "Test 2: Network timeout recovery... "

    echo "1" > "$TEST_DIR/attempt_gemini.txt"
    cat > "$TEST_DIR/scenario_gemini.txt" <<EOF
Connection timed out
Connection timed out
success
EOF
    echo "Connection timed out" > "$TEST_DIR/last_error.txt"

    run_advisor_with_retry "gemini" "test" 3 90 >/dev/null 2>&1
    result=$?

    if [[ $result -eq 0 ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected success after retries)"
        return 1
    fi
}

# Test 3: Rate limit detection
test_rate_limit_detection() {
    echo -n "Test 3: Rate limit detection... "

    echo "1" > "$TEST_DIR/attempt_gemini.txt"
    cat > "$TEST_DIR/scenario_gemini.txt" <<EOF
Rate limit exceeded, retry after 60s
success
EOF
    echo "Rate limit exceeded, retry after 60s" > "$TEST_DIR/last_error.txt"

    output=$(run_advisor_with_retry "gemini" "test" 3 90 2>&1)

    if echo "$output" | grep -q "Rate limit, waiting"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected rate limit message"
        return 1
    fi
}

# Test 4: Session expired handling
test_session_expired() {
    echo -n "Test 4: Session expired handling... "

    echo "1" > "$TEST_DIR/attempt_codex.txt"
    echo "Session not found or expired" > "$TEST_DIR/scenario_codex.txt"
    echo "Session not found or expired" > "$TEST_DIR/last_error.txt"

    run_advisor_with_retry "codex" "test" 3 180 >/dev/null 2>&1
    result=$?

    if [[ $result -eq 2 ]]; then
        echo -e "${GREEN}✓ PASS${NC} (return code 2)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected code 2, got $result)"
        return 1
    fi
}

# Test 5: Usage limit handling
test_usage_limit() {
    echo -n "Test 5: Usage limit handling... "

    echo "1" > "$TEST_DIR/attempt_codex.txt"
    echo "Usage quota exceeded for this billing period" > "$TEST_DIR/scenario_codex.txt"
    echo "Usage quota exceeded for this billing period" > "$TEST_DIR/last_error.txt"

    run_advisor_with_retry "codex" "test" 3 180 >/dev/null 2>&1
    result=$?

    if [[ $result -eq 3 ]]; then
        echo -e "${GREEN}✓ PASS${NC} (return code 3)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected code 3, got $result)"
        return 1
    fi
}

# Test 6: All retries exhausted
test_all_retries_exhausted() {
    echo -n "Test 6: All retries exhausted... "

    echo "1" > "$TEST_DIR/attempt_gemini.txt"
    cat > "$TEST_DIR/scenario_gemini.txt" <<EOF
Connection timed out
Connection timed out
Connection timed out
EOF
    echo "Connection timed out" > "$TEST_DIR/last_error.txt"

    run_advisor_with_retry "gemini" "test" 3 90 >/dev/null 2>&1
    result=$?

    if [[ $result -eq 1 ]]; then
        echo -e "${GREEN}✓ PASS${NC} (return code 1)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected code 1, got $result)"
        return 1
    fi
}

# Test 7: Timeout doubling
test_timeout_doubling() {
    echo -n "Test 7: Timeout doubling on retries... "

    echo "1" > "$TEST_DIR/attempt_gemini.txt"
    cat > "$TEST_DIR/scenario_gemini.txt" <<EOF
ETIMEDOUT
ETIMEDOUT
success
EOF
    echo "ETIMEDOUT" > "$TEST_DIR/last_error.txt"

    # Capture output to verify timeout values
    output=$(run_advisor_with_retry "gemini" "test" 3 90 2>&1)

    if echo "$output" | grep -q "timeout: 90s" && \
       echo "$output" | grep -q "timeout: 180s" && \
       echo "$output" | grep -q "timeout: 360s"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected timeout progression: 90s → 180s → 360s"
        return 1
    fi
}

# Test 8: CLI not found handling
test_cli_not_found() {
    echo -n "Test 8: CLI not found handling... "

    echo "1" > "$TEST_DIR/attempt_gemini.txt"
    echo "gemini: command not found" > "$TEST_DIR/scenario_gemini.txt"
    echo "gemini: command not found" > "$TEST_DIR/last_error.txt"

    run_advisor_with_retry "gemini" "test" 3 90 >/dev/null 2>&1
    result=$?

    # Should retry and eventually fail with code 1 (cli_not_found not a special case)
    if [[ $result -eq 1 ]]; then
        echo -e "${GREEN}✓ PASS${NC} (return code 1)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected code 1, got $result)"
        return 1
    fi
}

# Test 9: Permission error handling
test_permission_error() {
    echo -n "Test 9: Permission error handling... "

    echo "1" > "$TEST_DIR/attempt_codex.txt"
    echo "Error: Permission denied - unauthorized API key" > "$TEST_DIR/scenario_codex.txt"
    echo "Error: Permission denied - unauthorized API key" > "$TEST_DIR/last_error.txt"

    run_advisor_with_retry "codex" "test" 3 90 >/dev/null 2>&1
    result=$?

    # Should retry and eventually fail with code 1
    if [[ $result -eq 1 ]]; then
        echo -e "${GREEN}✓ PASS${NC} (return code 1)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected code 1, got $result)"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo ""
    echo "Running Retry Logic Tests"
    echo "=================================="
    echo ""

    local total=0
    local passed=0

    setup
    source_helpers

    tests=(
        test_success_first_attempt
        test_network_timeout_recovery
        test_rate_limit_detection
        test_session_expired
        test_usage_limit
        test_all_retries_exhausted
        test_timeout_doubling
        test_cli_not_found
        test_permission_error
    )

    for test in "${tests[@]}"; do
        total=$((total + 1))
        # Clean up between tests
        rm -f "$TEST_DIR/attempt_"* "$TEST_DIR/scenario_"* "$TEST_DIR/last_error.txt"
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

run_all_tests
