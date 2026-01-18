#!/bin/bash
# tests/test-error-messages.sh
# Tests for enhanced error messages

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Source helpers
source_helpers() {
    log_contextual_error() {
        local advisor="$1"
        local error_type="$2"
        local error_details="$3"
        local recovery_action="$4"

        echo "" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "ERROR: $error_type" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "" >&2
        echo "Advisor: $advisor" >&2
        echo "Details: $error_details" >&2
        echo "" >&2
        echo "Troubleshooting Steps:" >&2

        case "$error_type" in
            "Session Resume Failed")
                echo "  1. Check if $advisor CLI is responsive:" >&2
                [[ "$advisor" == "gemini" ]] && echo "     gemini --version" >&2 || echo "     codex --version" >&2
                echo "  2. List active sessions:" >&2
                [[ "$advisor" == "gemini" ]] && echo "     gemini --list-sessions" >&2 || echo "     codex resume --all" >&2
                echo "  3. Creating new session with full context" >&2
                ;;
            "Network Timeout")
                echo "  1. Check internet connection" >&2
                echo "  2. Retrying with longer timeout (automatic)" >&2
                echo "  3. If persistent, check firewall/proxy" >&2
                ;;
            "Rate Limit")
                echo "  1. Waiting 60s for rate limit reset..." >&2
                echo "  2. If persistent, check API quota:" >&2
                if [[ "$advisor" == "gemini" ]]; then
                    echo "     https://console.cloud.google.com/apis/dashboard" >&2
                else
                    echo "     https://platform.openai.com/usage" >&2
                fi
                ;;
            "Usage Limit")
                echo "  1. Check API quota/billing:" >&2
                if [[ "$advisor" == "gemini" ]]; then
                    echo "     https://console.cloud.google.com/billing" >&2
                else
                    echo "     https://platform.openai.com/account/billing" >&2
                fi
                echo "  2. Continuing without $advisor" >&2
                ;;
            "CLI Not Found")
                echo "  1. Install $advisor CLI:" >&2
                if [[ "$advisor" == "gemini" ]]; then
                    echo "     npm install -g @anthropic-ai/gemini-cli" >&2
                else
                    echo "     # Follow Codex installation guide" >&2
                fi
                echo "  2. Verify with: $advisor --version" >&2
                ;;
        esac

        echo "" >&2
        echo "Recovery: $recovery_action" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "" >&2
    }

    log_advisor_success() {
        local advisor="$1"
        local round="$2"
        local response_length="$3"
        local time_taken="$4"

        echo "✓ $advisor Round $round completed ($response_length words, ${time_taken}s)" >&2
    }
}

# Test 1: Session resume error message
test_session_resume_error() {
    echo -n "Test 1: Session resume error message... "

    output=$(log_contextual_error "gemini" "Session Resume Failed" "Session abc123 not found" "Creating new session" 2>&1)

    if echo "$output" | grep -q "ERROR: Session Resume Failed" && \
       echo "$output" | grep -q "Advisor: gemini" && \
       echo "$output" | grep -q "Session abc123 not found" && \
       echo "$output" | grep -q "gemini --list-sessions" && \
       echo "$output" | grep -q "Recovery: Creating new session"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Missing expected content in output"
        return 1
    fi
}

# Test 2: Rate limit error message (Gemini)
test_rate_limit_gemini() {
    echo -n "Test 2: Rate limit error (Gemini)... "

    output=$(log_contextual_error "gemini" "Rate Limit" "Quota exceeded" "Retrying after 60s" 2>&1)

    if echo "$output" | grep -q "ERROR: Rate Limit" && \
       echo "$output" | grep -q "console.cloud.google.com" && \
       echo "$output" | grep -q "Waiting 60s"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Missing Gemini-specific quota link"
        return 1
    fi
}

# Test 3: Rate limit error message (Codex)
test_rate_limit_codex() {
    echo -n "Test 3: Rate limit error (Codex)... "

    output=$(log_contextual_error "codex" "Rate Limit" "Too many requests" "Retrying after 60s" 2>&1)

    if echo "$output" | grep -q "ERROR: Rate Limit" && \
       echo "$output" | grep -q "platform.openai.com/usage" && \
       echo "$output" | grep -q "Waiting 60s"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Missing Codex-specific usage link"
        return 1
    fi
}

# Test 4: Network timeout error
test_network_timeout() {
    echo -n "Test 4: Network timeout error... "

    output=$(log_contextual_error "codex" "Network Timeout" "ETIMEDOUT after 90s" "Retrying with 180s timeout" 2>&1)

    if echo "$output" | grep -q "ERROR: Network Timeout" && \
       echo "$output" | grep -q "Check internet connection" && \
       echo "$output" | grep -q "Retrying with longer timeout"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Test 5: Usage limit error
test_usage_limit() {
    echo -n "Test 5: Usage limit error... "

    output=$(log_contextual_error "codex" "Usage Limit" "Billing quota exceeded" "Skipping codex" 2>&1)

    if echo "$output" | grep -q "ERROR: Usage Limit" && \
       echo "$output" | grep -q "platform.openai.com/account/billing" && \
       echo "$output" | grep -q "Continuing without codex"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Test 6: Success message
test_success_message() {
    echo -n "Test 6: Success message... "

    output=$(log_advisor_success "gemini" 1 287 12 2>&1)

    if echo "$output" | grep -q "✓ gemini Round 1 completed (287 words, 12s)"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Expected: '✓ gemini Round 1 completed (287 words, 12s)'"
        echo "Got: $output"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo ""
    echo "Running Error Message Tests"
    echo "=================================="
    echo ""

    local total=0
    local passed=0

    source_helpers

    tests=(
        test_session_resume_error
        test_rate_limit_gemini
        test_rate_limit_codex
        test_network_timeout
        test_usage_limit
        test_success_message
    )

    for test in "${tests[@]}"; do
        total=$((total + 1))
        if $test; then
            passed=$((passed + 1))
        fi
    done

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
