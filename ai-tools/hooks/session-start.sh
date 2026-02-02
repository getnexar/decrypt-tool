#!/usr/bin/env bash
# SessionStart hook for Amplify
# Initializes workspace structure and sets environment variables for session orchestration
# Also detects and activates worktree handovers for context continuity

set -euo pipefail

# Get project directory from Claude's environment
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ENV_FILE="${CLAUDE_ENV_FILE:-}"
CWD="$(pwd)"

# Find the scripts directory (relative to this hook or via amplify installation)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Try to find handover-helper.js in standard locations
HANDOVER_HELPER=""
if [[ -f "$SCRIPT_DIR/../../scripts/orchestration/handover-helper.js" ]]; then
  HANDOVER_HELPER="$SCRIPT_DIR/../../scripts/orchestration/handover-helper.js"
elif [[ -f "$PROJECT_DIR/scripts/orchestration/handover-helper.js" ]]; then
  HANDOVER_HELPER="$PROJECT_DIR/scripts/orchestration/handover-helper.js"
fi

# Calculate project hash (same algorithm as session-types.js)
# Priority: git remote URL hash > path hash > "global"
calculate_project_hash() {
  local hash_input=""

  # Try to get git remote URL for cross-machine consistency
  if command -v git &>/dev/null && git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
    hash_input=$(git -C "$PROJECT_DIR" config --get remote.origin.url 2>/dev/null || echo "")
  fi

  # Fallback to absolute path if no git remote
  if [[ -z "$hash_input" ]]; then
    hash_input=$(cd "$PROJECT_DIR" && pwd -P)
  fi

  # Generate 12-char MD5 hash (same as JS: crypto.createHash('md5').update(input).digest('hex').slice(0, 12))
  if command -v md5 &>/dev/null; then
    # macOS
    echo -n "$hash_input" | md5 | cut -c1-12
  elif command -v md5sum &>/dev/null; then
    # Linux
    echo -n "$hash_input" | md5sum | cut -c1-12
  else
    # Fallback - use a simple hash
    echo "global"
  fi
}

# Get or generate instance ID
# Use Claude's session UUID if available, otherwise generate one
get_instance_id() {
  if [[ -n "${CLAUDE_SESSION_UUID:-}" ]]; then
    echo "$CLAUDE_SESSION_UUID"
  elif command -v uuidgen &>/dev/null; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  else
    # Fallback UUID generation
    cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$(date +%s)-$$-$RANDOM"
  fi
}

# Only initialize workspace if not already a worker session
# Workers already have AMPLIFY_WORKSPACE_HASH and AMPLIFY_INSTANCE_ID set by spawner
if [[ -z "${AMPLIFY_WORKSPACE_HASH:-}" ]] && [[ -z "${AMPLIFY_INSTANCE_ID:-}" ]]; then
  # Orchestrator session - calculate and set workspace vars
  WORKSPACE_HASH=$(calculate_project_hash)
  INSTANCE_ID=$(get_instance_id)

  # Create workspace directory structure
  WORKSPACE_DIR="$HOME/.amplify/workspaces/$WORKSPACE_HASH"
  INSTANCE_DIR="$WORKSPACE_DIR/instance-$INSTANCE_ID"
  SESSIONS_DIR="$INSTANCE_DIR/isolated-sessions"

  mkdir -p "$SESSIONS_DIR"

  # Export to Claude's env file for this session
  if [[ -n "$ENV_FILE" ]] && [[ -f "$ENV_FILE" || ! -e "$ENV_FILE" ]]; then
    echo "export AMPLIFY_WORKSPACE_HASH='$WORKSPACE_HASH'" >> "$ENV_FILE"
    echo "export AMPLIFY_INSTANCE_ID='$INSTANCE_ID'" >> "$ENV_FILE"
  fi

  WORKSPACE_MSG="Workspace initialized: $WORKSPACE_HASH (instance: ${INSTANCE_ID:0:8}...)"
else
  # Worker session - workspace already inherited from spawner
  WORKSPACE_MSG="Worker session (workspace: ${AMPLIFY_WORKSPACE_HASH:-unknown})"
fi

# === HANDOVER DETECTION ===
# Check if we're in a worktree and if there's a pending handover
HANDOVER_CONTEXT=""
WORKTREE_MSG=""

if [[ -n "$HANDOVER_HELPER" ]] && command -v node &>/dev/null; then
  # Detect if we're in a worktree with a handover
  HANDOVER_JSON=$(node "$HANDOVER_HELPER" detect "$CWD" 2>/dev/null || echo '{"isWorktree":false}')

  IS_WORKTREE=$(echo "$HANDOVER_JSON" | grep -o '"isWorktree":[^,}]*' | cut -d: -f2 | tr -d ' ' || echo "false")
  HAS_HANDOVER=$(echo "$HANDOVER_JSON" | grep -o '"hasHandover":[^,}]*' | cut -d: -f2 | tr -d ' ' || echo "false")
  HANDOVER_STATUS=$(echo "$HANDOVER_JSON" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")
  HANDOVER_DIR=$(echo "$HANDOVER_JSON" | grep -o '"handoverDir":"[^"]*"' | cut -d'"' -f4 || echo "")
  WORKTREE_NAME=$(echo "$HANDOVER_JSON" | grep -o '"worktreeName":"[^"]*"' | cut -d'"' -f4 || echo "")

  if [[ "$IS_WORKTREE" == "true" ]]; then
    if [[ "$HAS_HANDOVER" == "true" ]] && [[ "$HANDOVER_STATUS" == "pending" ]]; then
      # Read the full handover content
      HANDOVER_CONTENT=""
      if [[ -n "$HANDOVER_DIR" ]] && [[ -f "$HANDOVER_DIR/HANDOVER.md" ]]; then
        HANDOVER_CONTENT=$(cat "$HANDOVER_DIR/HANDOVER.md")
      fi

      # Activate the handover (mark as active)
      node "$HANDOVER_HELPER" activate "$HANDOVER_DIR" "${INSTANCE_ID:-unknown}" &>/dev/null || true

      WORKTREE_MSG="Working in worktree: $WORKTREE_NAME (handover activated)"
      HANDOVER_CONTEXT="$HANDOVER_CONTENT"
    elif [[ "$HAS_HANDOVER" == "true" ]]; then
      WORKTREE_MSG="Working in worktree: $WORKTREE_NAME (handover status: $HANDOVER_STATUS)"
    else
      WORKTREE_MSG="Working in worktree: $WORKTREE_NAME (no handover found)"
    fi
  fi
fi

# Output context as JSON
# Claude Code parses hookSpecificOutput.additionalContext and injects it as a system reminder

# Build the context message
CONTEXT_MSG="$WORKSPACE_MSG"
if [[ -n "$WORKTREE_MSG" ]]; then
  CONTEXT_MSG="$CONTEXT_MSG. $WORKTREE_MSG"
fi
CONTEXT_MSG="$CONTEXT_MSG. See .claude/CLAUDE.md for orchestrator identity and .claude/index/ for discovery."

# If we have handover content, append it
if [[ -n "$HANDOVER_CONTEXT" ]]; then
  # Escape the handover content for JSON (newlines, quotes, backslashes)
  # Works on both macOS (BSD sed) and Linux (GNU sed)
  ESCAPED_HANDOVER=$(printf '%s' "$HANDOVER_CONTEXT" | \
    sed 's/\\/\\\\/g' | \
    sed 's/"/\\"/g' | \
    awk '{printf "%s\\n", $0}' | \
    sed 's/\\n$//')
  CONTEXT_MSG="$CONTEXT_MSG\\n\\n---\\n\\n# HANDOVER CONTEXT\\n\\n$ESCAPED_HANDOVER"
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "$CONTEXT_MSG"
  }
}
EOF

exit 0
