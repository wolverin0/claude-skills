# AI Debate Hub - Helper Functions v6.0.0

Reference documentation for bash helper functions used in debate orchestration.

> **Cross-platform note:** The state helpers below need only bash (`jq` is optional for JSON validation; `update_debate_index` needs it). Without bash, use `tools/atomic-json.mjs`; see the Node.js Alternative section at the bottom. Both use the same `<file>.lock` directory, so they exclude each other.

---

## Atomic State and Index Updates

Source the shipped implementation instead of copying functions from this file
(the source repo tests it in `tests/test-atomic-state-writes.sh` and `tests/test-state-lock-recovery.sh`):

```bash
source "<debate-skill-dir>/tools/state-lock.sh"
```

It provides:

- `update_debate_state <state-file> <json>`: validates the JSON (when `jq` is installed), writes `<file>.tmp` and renames it over the state file. Returns 0 on success, 1 on lock timeout, invalid JSON or a failed write; the old state is kept on failure.
- `update_debate_index <index-file> <debate-id>`: appends the id to `.debates` once (parallel-safe; needs `jq`).
- `debate_lock_acquire <file>` / `debate_lock_release <file>`: the lock itself, for callers that need a critical section.

Locking: `mkdir "<file>.lock"` (atomic, no `flock`), with an `owner` file holding
`<pid> <epoch-seconds>`. A waiter retries every 0.1s for `DEBATE_LOCK_TIMEOUT`
seconds (default 5) and removes a stale lock (owner PID gone, or older than
`DEBATE_LOCK_STALE` seconds, default 30). Each write runs in a subshell whose
`EXIT`/`INT`/`TERM` trap releases the lock, so no `.lock` is left behind;
release removes only a lock whose `owner` PID is the caller's, so a waiter that
timed out never deletes the holder's lock.

**Usage:**
```bash
current_state=$(cat "$STATE_FILE")
new_state=$(echo "$current_state" | jq '.current_round = 2')
update_debate_state "$STATE_FILE" "$new_state"
update_debate_index "$DEBATES_DIR/index.json" "003-redis-vs-memcached"
```

---

## Exponential Backoff Retry

Retry advisor calls with intelligent failure detection and telemetry.

```bash
run_advisor_with_retry() {
    local advisor="$1"
    local prompt="$2"
    local max_retries="${3:-3}"
    local base_timeout="${4:-90}"
    local state_file="${5:-}"  # Optional: pass state.json path for telemetry

    local attempt=1
    local timeout=$base_timeout
    local total_retries=0

    while [[ $attempt -le $max_retries ]]; do
        echo "[$advisor] Attempt $attempt/$max_retries (timeout: ${timeout}s)" >&2

        if run_advisor "$advisor" "$prompt" "$timeout"; then
            return 0
        fi

        local error_output=$(get_last_error 2>&1)
        total_retries=$((total_retries + 1))

        # Record error in state.json if path provided
        if [[ -n "$state_file" && -f "$state_file" ]]; then
            local error_msg="${error_output:0:200}"  # Cap at 200 chars
            local failure_mode=$(detect_failure_mode "$advisor" "$error_output")
            local current_round=$(jq -r '.current_round // 0' "$state_file" 2>/dev/null)
            local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            local updated
            updated=$(jq \
                --arg type "$failure_mode" \
                --arg msg "$error_msg" \
                --arg adv "$advisor" \
                --arg ts "$timestamp" \
                --argjson round "$current_round" \
                --argjson retries "$total_retries" \
                '.last_error = {type: $type, message: $msg, round: $round, advisor: $adv, timestamp: $ts} |
                 .telemetry.retries_count = ((.telemetry.retries_count // 0) + $retries)' \
                "$state_file")
            update_debate_state "$state_file" "$updated"
        fi

        if [[ $attempt -eq $max_retries ]]; then
            echo "ERROR: [$advisor] Failed after $max_retries attempts" >&2
            return 1
        fi

        local failure_mode=$(detect_failure_mode "$advisor" "$error_output")

        case "$failure_mode" in
            rate_limit)
                echo "WARN: [$advisor] Rate limit, waiting 60s..." >&2
                sleep 60
                ;;
            network_timeout)
                local wait_time=$((2 ** (attempt - 1)))
                echo "WARN: [$advisor] Timeout, waiting ${wait_time}s..." >&2
                sleep "$wait_time"
                timeout=$((timeout * 2))
                ;;
            session_expired)
                echo "WARN: [$advisor] Session expired" >&2
                return 2  # Caller should create new session
                ;;
            usage_limit)
                echo "ERROR: [$advisor] Usage limit reached" >&2
                return 3  # Caller should skip this advisor
                ;;
            *)
                local wait_time=$((2 ** (attempt - 1)))
                echo "WARN: [$advisor] Error, waiting ${wait_time}s..." >&2
                sleep "$wait_time"
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

    if echo "$error_output" | grep -Eqi "timeout|timed out|ETIMEDOUT|ECONNRESET"; then
        echo "network_timeout"
        return
    fi

    if echo "$error_output" | grep -Eqi "usage.*limit|quota.*exceeded|billing|403"; then
        echo "usage_limit"
        return
    fi

    echo "unknown_error"
}
```

**Return codes:**
- `0` - Success
- `1` - All retries failed
- `2` - Session expired (create new session)
- `3` - Usage limit (skip advisor)

---

## Round Duration Tracking

Record how long each round takes for telemetry.

```bash
record_round_duration() {
    local state_file="$1"
    local round_number="$2"
    local duration_seconds="$3"

    if [[ -f "$state_file" ]]; then
        local updated
        updated=$(jq \
            --arg round "$round_number" \
            --argjson dur "$duration_seconds" \
            '.telemetry.round_durations[$round] = $dur' \
            "$state_file")
        update_debate_state "$state_file" "$updated"
    fi
}
```

**Usage:**
```bash
start_time=$(date +%s)
# ... run round ...
end_time=$(date +%s)
duration=$((end_time - start_time))
record_round_duration "$STATE_FILE" "1" "$duration"
```

---

## Contextual Error Messages

User-friendly error output with troubleshooting steps.

```bash
log_contextual_error() {
    local advisor="$1"
    local error_type="$2"
    local error_details="$3"
    local recovery_action="$4"

    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "ERROR: $error_type" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "Advisor: $advisor" >&2
    echo "Details: $error_details" >&2
    echo "" >&2
    echo "Troubleshooting:" >&2

    case "$error_type" in
        "Session Resume Failed")
            echo "  1. Check CLI: $advisor --version" >&2
            echo "  2. List sessions:" >&2
            [[ "$advisor" == "gemini" ]] && echo "     gemini --list-sessions" >&2
            [[ "$advisor" == "codex" ]] && echo "     codex resume --all" >&2
            ;;
        "Network Timeout")
            echo "  1. Check internet connection" >&2
            echo "  2. Retrying with longer timeout" >&2
            ;;
        "Rate Limit")
            echo "  1. Waiting 60s for reset" >&2
            echo "  2. Check quota:" >&2
            [[ "$advisor" == "gemini" ]] && echo "     https://console.cloud.google.com/apis/dashboard" >&2
            [[ "$advisor" == "codex" ]] && echo "     https://platform.openai.com/usage" >&2
            ;;
        "Usage Limit")
            echo "  1. Check billing:" >&2
            [[ "$advisor" == "gemini" ]] && echo "     https://console.cloud.google.com/billing" >&2
            [[ "$advisor" == "codex" ]] && echo "     https://platform.openai.com/account/billing" >&2
            ;;
    esac

    echo "" >&2
    echo "Recovery: $recovery_action" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
}

log_advisor_success() {
    local advisor="$1"
    local round="$2"
    local words="$3"
    local seconds="$4"

    echo "PASS: $advisor Round $round completed ($words words, ${seconds}s)" >&2
}
```

**Usage:**
```bash
log_contextual_error "gemini" "Session Resume Failed" \
    "Session abc123 not found" \
    "Creating new session with full context"

log_advisor_success "gemini" 1 287 12
```

---

## Node.js Alternative

For environments without bash or `jq`, use the cross-platform Node.js helper:

```bash
# Atomic state write
node tools/atomic-json.mjs write state.json '{"version":2,"status":"in_progress",...}'

# Atomic index append
node tools/atomic-json.mjs append-index index.json '{"debate_id":"003-redis-vs-memcached"}'

# Read with lock
node tools/atomic-json.mjs read state.json
```

See `tools/atomic-json.mjs` for implementation details. Zero external dependencies.
