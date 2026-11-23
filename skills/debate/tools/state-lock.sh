#!/usr/bin/env bash
# state-lock.sh — atomic, lock-protected JSON writes for the debate skill.
#
# Source it, then call update_debate_state / update_debate_index:
#   source "<debate-skill-dir>/tools/state-lock.sh"
#
# Lock: `mkdir "<file>.lock"` (atomic on POSIX, macOS, Linux, Git Bash; no flock).
# The lock dir holds an `owner` file with "<pid> <epoch-seconds>". A waiter
# removes a lock whose owner PID is gone (kill -0) or that is older than
# DEBATE_LOCK_STALE seconds; a lock without an owner file (for example one
# taken by tools/atomic-json.mjs) is aged by its mtime. Every write runs in a
# subshell whose EXIT/INT/TERM trap releases the lock, so no `.lock` survives.
# shortcut: two waiters that judge the same lock stale at the same instant can
# both proceed; acceptable because stale locks only follow a crash. Upgrade to
# rename-then-verify if debates ever run many writers per file.
#
# Shares the lock path and format with tools/atomic-json.mjs, so bash and Node
# writers exclude each other.

DEBATE_LOCK_TIMEOUT="${DEBATE_LOCK_TIMEOUT:-5}"   # seconds to wait for a lock
DEBATE_LOCK_STALE="${DEBATE_LOCK_STALE:-30}"      # seconds before a lock is stale

_debate_mtime() {
    stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null
}

# Returns 0 when the lock dir is stale and may be removed.
_debate_lock_is_stale() {
    local lockdir="$1" pid="" ts="" now
    now=$(date +%s)
    if [[ -f "$lockdir/owner" ]] && read -r pid ts < "$lockdir/owner" 2>/dev/null && [[ -n "$pid" ]]; then
        if ! kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
        [[ "$ts" =~ ^[0-9]+$ ]] && (( now - ts > DEBATE_LOCK_STALE )) && return 0
        return 1
    fi
    ts=$(_debate_mtime "$lockdir") || return 1
    [[ "$ts" =~ ^[0-9]+$ ]] && (( now - ts > DEBATE_LOCK_STALE ))
}

# debate_lock_acquire <file>: take "<file>.lock"; waits up to DEBATE_LOCK_TIMEOUT.
debate_lock_acquire() {
    local lockdir="$1.lock" deadline
    deadline=$(( $(date +%s) + DEBATE_LOCK_TIMEOUT ))
    while ! mkdir "$lockdir" 2>/dev/null; do
        if _debate_lock_is_stale "$lockdir"; then
            echo "WARN: removing stale lock $lockdir" >&2
            rm -rf "$lockdir"
            continue
        fi
        if (( $(date +%s) >= deadline )); then
            echo "ERROR: Could not acquire lock on $1 after ${DEBATE_LOCK_TIMEOUT}s" >&2
            return 1
        fi
        sleep 0.1
    done
    echo "${BASHPID:-$$} $(date +%s)" > "$lockdir/owner"
}

# debate_lock_release <file>
debate_lock_release() {
    rm -rf "$1.lock"
}

# Validate JSON when jq is available (jq is optional).
_debate_json_ok() {
    command -v jq >/dev/null 2>&1 || return 0
    jq empty "$1" >/dev/null 2>&1
}

# update_debate_state <state-file> <json>: replace the file atomically.
update_debate_state() {
    local state_file="$1"
    local new_data="$2"
    (
        trap 'debate_lock_release "$state_file"' EXIT
        trap 'exit 130' INT TERM
        debate_lock_acquire "$state_file" || exit 1

        echo "$new_data" > "${state_file}.tmp" || {
            echo "ERROR: Failed to write ${state_file}.tmp" >&2
            rm -f "${state_file}.tmp"
            exit 1
        }
        if ! _debate_json_ok "${state_file}.tmp"; then
            echo "ERROR: Invalid JSON in new state" >&2
            rm -f "${state_file}.tmp"
            exit 1
        fi
        # mv within one directory is atomic: the old state stays intact on failure.
        mv "${state_file}.tmp" "$state_file" || {
            echo "ERROR: Failed to atomically update $state_file" >&2
            rm -f "${state_file}.tmp"
            exit 1
        }
    )
}

# update_debate_index <index-file> <debate-id>: append the id once (needs jq).
update_debate_index() {
    local index_file="$1"
    local debate_id="$2"
    if ! command -v jq >/dev/null 2>&1; then
        echo "ERROR: jq is required; use: node tools/atomic-json.mjs append-index \"$index_file\" \"$debate_id\"" >&2
        return 1
    fi
    (
        trap 'debate_lock_release "$index_file"' EXIT
        trap 'exit 130' INT TERM
        debate_lock_acquire "$index_file" || exit 1

        [[ -f "$index_file" ]] || echo '{"debates":[]}' > "$index_file"
        local current updated
        current=$(cat "$index_file")
        if echo "$current" | jq -e --arg id "$debate_id" '.debates | index($id)' >/dev/null 2>&1; then
            exit 0
        fi
        updated=$(echo "$current" | jq --arg id "$debate_id" '.debates += [$id]') || exit 1
        echo "$updated" > "${index_file}.tmp" || { rm -f "${index_file}.tmp"; exit 1; }
        if ! _debate_json_ok "${index_file}.tmp"; then
            echo "ERROR: Invalid JSON when updating index" >&2
            rm -f "${index_file}.tmp"
            exit 1
        fi
        mv "${index_file}.tmp" "$index_file" || { rm -f "${index_file}.tmp"; exit 1; }
    )
}
